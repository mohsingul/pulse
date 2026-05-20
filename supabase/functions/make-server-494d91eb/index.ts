import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import { processCalendarReminders } from "./calendar_reminders.ts";

const app = new Hono();

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
const FIREBASE_SERVICE_ACCOUNT_JSON = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL');
const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY');
const FCM_LEGACY_SEND_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';
const FCM_OAUTH_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

let cachedFcmAccessToken: { token: string; expiresAt: number } | null = null;

type FirebaseServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function base64UrlEncode(value: string | Uint8Array): string {
  let base64 = '';
  if (typeof value === 'string') {
    base64 = btoa(value);
  } else {
    let binary = '';
    for (const byte of value) {
      binary += String.fromCharCode(byte);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function parsePemPrivateKey(pem: string): Uint8Array {
  const normalized = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function loadFirebaseServiceAccount(): FirebaseServiceAccount | null {
  if (FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON) as Record<string, unknown>;
      const projectId = String(parsed.project_id || parsed.projectId || '').trim();
      const clientEmail = String(parsed.client_email || parsed.clientEmail || '').trim();
      const privateKey = String(parsed.private_key || parsed.privateKey || '').trim();
      if (projectId && clientEmail && privateKey) {
        return { projectId, clientEmail, privateKey };
      }
    } catch (error) {
      console.error('[FCM] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    }
  }

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

async function signJwt(payload: string, privateKey: string): Promise<string> {
  const keyData = parsePemPrivateKey(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData.buffer as ArrayBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

async function getFcmAccessToken(): Promise<string | null> {
  const serviceAccount = loadFirebaseServiceAccount();
  if (!serviceAccount) {
    return null;
  }

  if (cachedFcmAccessToken && Date.now() < cachedFcmAccessToken.expiresAt) {
    return cachedFcmAccessToken.token;
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(JSON.stringify({
    iss: serviceAccount.clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: FCM_OAUTH_TOKEN_ENDPOINT,
    exp,
    iat,
  }));
  const unsignedJwt = `${header}.${claimSet}`;
  const signature = await signJwt(unsignedJwt, serviceAccount.privateKey);
  const signedJwt = `${unsignedJwt}.${signature}`;

  const response = await fetch(FCM_OAUTH_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.access_token) {
    console.error('[FCM] Access token fetch failed:', response.status, result);
    throw new Error('Failed to obtain Firebase access token');
  }

  cachedFcmAccessToken = {
    token: result.access_token,
    expiresAt: Date.now() + ((result.expires_in ?? 3600) - 60) * 1000,
  };

  return cachedFcmAccessToken.token;
}

function normalizeFcmData(data: Record<string, unknown>): Record<string, string> {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    acc[key] = String(value);
    return acc;
  }, {} as Record<string, string>);
}

async function sendFcmPush(
  fcmToken: string,
  notification: { title: string; body: string; icon?: string; badge?: string },
  data: Record<string, unknown> = {},
) {
  const normalizedData = normalizeFcmData(data);
  const message = {
    message: {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: normalizedData,
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icon-192.png',
          badge: notification.badge || '/icon-192.png',
          tag: normalizedData.tag || undefined,
          data: {
            url: normalizedData.url || '/',
          },
        },
        fcmOptions: {
          link: normalizedData.url || '/',
        },
      },
    },
  };

  const serviceAccount = loadFirebaseServiceAccount();
  if (serviceAccount) {
    const accessToken = await getFcmAccessToken();
    if (!accessToken) {
      throw new Error('Firebase access token not available');
    }

    const endpoint = `https://fcm.googleapis.com/v1/projects/${serviceAccount.projectId}/messages:send`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    if (!response.ok) {
      console.log('[FCM] v1 send failed:', response.status, result);
      throw new Error(`FCM v1 send failed: ${JSON.stringify(result)}`);
    }

    return result;
  }

  if (!FCM_SERVER_KEY) {
    throw new Error('No Firebase credentials configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FCM_SERVER_KEY.');
  }

  const legacyPayload = {
    to: fcmToken,
    priority: 'high',
    notification: {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192.png',
      badge: notification.badge || '/icon-192.png',
      click_action: '/',
    },
    data: normalizedData,
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon-192.png',
        badge: notification.badge || '/icon-192.png',
      },
    },
  };

  const response = await fetch(FCM_LEGACY_SEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${FCM_SERVER_KEY}`,
    },
    body: JSON.stringify(legacyPayload),
  });

  const result = await response.json();
  if (!response.ok) {
    console.log('[FCM] Legacy send failed:', response.status, result);
    throw new Error(`FCM send failed: ${JSON.stringify(result)}`);
  }

  return result;
}

async function updateUserFcmToken(userId: string, fcmToken: string | null) {
  const user = await kv.get(`user:${userId}`);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  if (fcmToken) {
    user.fcmToken = fcmToken;
    user.fcmTokenUpdatedAt = new Date().toISOString();
  } else {
    delete user.fcmToken;
    delete user.fcmTokenUpdatedAt;
  }

  await kv.set(`user:${userId}`, user);
  return user;
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 600,
  }),
);

app.options("/*", (c) => {
  return c.text('OK');
});

// Global middleware to ensure all errors are caught and logged
app.use('*', async (c, next) => {
  try {
    await next();
  } catch (error: any) {
    console.error(`[Middleware Error] ${c.req.method} ${c.req.url}:`, error);
    console.error(`[Middleware Error Stack]:`, error?.stack);
    return c.json({ 
      error: 'Request processing failed', 
      message: error?.message || 'Unknown error',
      path: new URL(c.req.url).pathname
    }, 500);
  }
});

// Utility: Hash password
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Utility: Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Utility: Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Health check endpoint
app.get("/make-server-494d91eb/health", (c) => {
  return c.json({ status: "ok" });
});

// Initialize demo data endpoint (for testing)
app.post("/make-server-494d91eb/init-demo", async (c) => {
  try {
    // Check if demo users already exist
    const existingUsers = await kv.getByPrefix("user:");
    console.log(`[Init Demo] Found ${existingUsers.length} existing users`);
    
    const demoUser1Exists = existingUsers.some((u: any) => u.username === "demo");
    const demoUser2Exists = existingUsers.some((u: any) => u.username === "demo2");
    
    const createdUsers = [];
    
    // Create demo user 1 if doesn't exist
    if (!demoUser1Exists) {
      const userId1 = generateId();
      const passwordHash1 = await hashPassword("password123");
      const demoUser1 = {
        userId: userId1,
        username: "demo",
        passwordHash: passwordHash1,
        displayName: "Demo User",
        createdAt: new Date().toISOString(),
      };
      await kv.set(`user:${userId1}`, demoUser1);
      createdUsers.push("demo");
      console.log("[Init Demo] Created demo user: demo / password123");
    } else {
      console.log("[Init Demo] User 'demo' already exists");
    }
    
    // Create demo user 2 if doesn't exist
    if (!demoUser2Exists) {
      const userId2 = generateId();
      const passwordHash2 = await hashPassword("password123");
      const demoUser2 = {
        userId: userId2,
        username: "demo2",
        passwordHash: passwordHash2,
        displayName: "Demo Partner",
        createdAt: new Date().toISOString(),
      };
      await kv.set(`user:${userId2}`, demoUser2);
      createdUsers.push("demo2");
      console.log("[Init Demo] Created demo user: demo2 / password123");
    } else {
      console.log("[Init Demo] User 'demo2' already exists");
    }
    
    // Get all users after creation
    const allUsers = await kv.getByPrefix("user:");
    console.log(`[Init Demo] Total users in database: ${allUsers.length}`);
    console.log(`[Init Demo] Usernames: ${allUsers.map((u: any) => u.username).join(', ')}`);
    
    return c.json({
      success: true,
      message: "Demo data initialized",
      created: createdUsers,
      existingCount: existingUsers.length,
      totalUsers: allUsers.length,
      usernames: allUsers.map((u: any) => u.username),
    });
  } catch (error) {
    console.log(`Error initializing demo data: ${error}`);
    return c.json({ error: "Failed to initialize demo data" }, 500);
  }
});

// Debug endpoint to list all users (for testing)
app.get("/make-server-494d91eb/debug/users", async (c) => {
  try {
    const users = await kv.getByPrefix("user:");
    const userList = users.map((u: any) => ({
      userId: u.userId,
      username: u.username,
      displayName: u.displayName,
      createdAt: u.createdAt,
    }));
    
    console.log(`[Debug] Found ${userList.length} users:`, userList.map(u => u.username).join(', '));
    
    return c.json({
      success: true,
      count: userList.length,
      users: userList,
    });
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Debug endpoint to export all couples
app.get("/make-server-494d91eb/debug/couples", async (c) => {
  try {
    const allData = await kv.getByPrefix("couple:");
    
    // Filter to get only the main couple records (not the user mappings)
    const couples = allData.filter((item: any) => item.coupleId && item.user1Id && item.user2Id);
    
    console.log(`[Debug] Found ${couples.length} couples`);
    
    return c.json({
      success: true,
      count: couples.length,
      couples: couples,
    });
  } catch (error) {
    console.log(`Error fetching couples: ${error}`);
    return c.json({ error: "Failed to fetch couples" }, 500);
  }
});

// Debug endpoint to export all pairing codes
app.get("/make-server-494d91eb/debug/codes", async (c) => {
  try {
    const allData = await kv.getByPrefix("code:");
    
    // Filter to get only the main code records
    const codes = allData.filter((item: any) => item.code && item.userId);
    
    console.log(`[Debug] Found ${codes.length} pairing codes`);
    
    return c.json({
      success: true,
      count: codes.length,
      codes: codes,
    });
  } catch (error) {
    console.log(`Error fetching pairing codes: ${error}`);
    return c.json({ error: "Failed to fetch pairing codes" }, 500);
  }
});

// Debug endpoint to export all today cards
app.get("/make-server-494d91eb/debug/today-cards", async (c) => {
  try {
    const allCards = await kv.getByPrefix("today:");
    
    console.log(`[Debug] Found ${allCards.length} today cards`);
    
    return c.json({
      success: true,
      count: allCards.length,
      todayCards: allCards,
    });
  } catch (error) {
    console.log(`Error fetching today cards: ${error}`);
    return c.json({ error: "Failed to fetch today cards" }, 500);
  }
});

// Debug endpoint to export all notifications
app.get("/make-server-494d91eb/debug/notifications", async (c) => {
  try {
    // Notifications are not stored in database (feature disabled to reduce usage)
    console.log(`[Debug] Notification storage disabled - returning empty array`);

    return c.json({
      success: true,
      count: 0,
      notifications: [],
      note: "Notification storage disabled to reduce database usage"
    });
  } catch (error) {
    console.log(`Error fetching notifications: ${error}`);
    return c.json({ error: "Failed to fetch notifications" }, 500);
  }
});

// Debug endpoint to export ALL data at once
app.get("/make-server-494d91eb/debug/export-all", async (c) => {
  try {
    console.log(`[Export All] Starting full data export...`);

    // Fetch all data types
    const usersData = await kv.getByPrefix("user:");
    const couplesData = await kv.getByPrefix("couple:");
    const codesData = await kv.getByPrefix("code:");
    const todayCardsData = await kv.getByPrefix("today:");

    // Filter to get clean data
    const couples = couplesData.filter((item: any) => item.coupleId && item.user1Id && item.user2Id);
    const codes = codesData.filter((item: any) => item.code && item.userId);

    // Notifications are not stored in database (feature disabled to reduce usage)

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0.0",
      appName: "Aimo Pulse",
      statistics: {
        totalUsers: usersData.length,
        totalCouples: couples.length,
        totalPairingCodes: codes.length,
        totalTodayCards: todayCardsData.length,
        totalNotifications: 0, // Notification storage disabled
      },
      data: {
        users: usersData,
        couples: couples,
        pairingCodes: codes,
        todayCards: todayCardsData,
        notifications: [], // Notification storage disabled to reduce database usage
      },
      notes: {
        notifications: "Notification storage has been disabled to reduce database usage. Notifications are handled locally on the frontend only."
      }
    };

    console.log(`[Export All] Export complete:`, exportData.statistics);

    return c.json(exportData);
  } catch (error) {
    console.log(`Error exporting all data: ${error}`);
    return c.json({ error: "Failed to export all data" }, 500);
  }
});

// USER ROUTES
app.post("/make-server-494d91eb/users/create", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Create User] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { username, password, displayName } = body;
    
    if (!username || !password || !displayName) {
      return c.json({ error: "Username, password, and display name are required" }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    // Check if username exists
    const existingUsers = await kv.getByPrefix("user:");
    const usernameTaken = existingUsers.some((u: any) => u.username === username);
    
    if (usernameTaken) {
      return c.json({ error: "Username already taken" }, 400);
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    
    const user = {
      userId,
      username,
      passwordHash,
      displayName,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, user);
    
    console.log(`[Create User] User created successfully: ${username}`);
    
    return c.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
      }
    });
  } catch (error) {
    console.log(`Error creating user: ${error}`);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

app.post("/make-server-494d91eb/users/login", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Login] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { username, password } = body;
    
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    const passwordHash = await hashPassword(password);
    const users = await kv.getByPrefix("user:");
    const user = users.find((u: any) => u.username === username && u.passwordHash === passwordHash);
    
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    return c.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
      }
    });
  } catch (error) {
    console.log(`Error logging in user: ${error}`);
    return c.json({ error: "Failed to log in" }, 500);
  }
});

app.get("/make-server-494d91eb/users/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
    });
  } catch (error) {
    console.log(`Error getting user: ${error}`);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

app.post("/make-server-494d91eb/users/:userId/fcm", async (c) => {
  try {
    const userId = c.req.param("userId");
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[FCM Register] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }

    const { fcmToken } = body;
    if (!fcmToken) {
      return c.json({ error: "fcmToken is required" }, 400);
    }

    await updateUserFcmToken(userId, fcmToken);
    console.log(`[FCM Register] Stored FCM token for user: ${userId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`[FCM Register] Error storing token: ${error}`);
    return c.json({ error: "Failed to register FCM token" }, 500);
  }
});

app.delete("/make-server-494d91eb/users/:userId/fcm", async (c) => {
  try {
    const userId = c.req.param("userId");
    await updateUserFcmToken(userId, null);
    console.log(`[FCM Unregister] Removed FCM token for user: ${userId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`[FCM Unregister] Error removing token: ${error}`);
    return c.json({ error: "Failed to unregister FCM token" }, 500);
  }
});

// Reset password endpoint
app.post("/make-server-494d91eb/users/reset-password", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Reset Password] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { username, newPassword } = body;
    
    if (!username || !newPassword) {
      return c.json({ error: "Username and new password are required" }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    // Find user by username
    const users = await kv.getByPrefix("user:");
    const user = users.find((u: any) => u.username === username);
    
    if (!user) {
      console.log(`[Reset Password] User not found: ${username}`);
      return c.json({ error: "No account found with this username. Please check your username and try again." }, 404);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    
    // Update user with new password
    const updatedUser = {
      ...user,
      passwordHash: newPasswordHash,
    };
    
    await kv.set(`user:${user.userId}`, updatedUser);

    console.log(`[Reset Password] Password successfully reset for user: ${username}`);

    return c.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log(`Error resetting password: ${error}`);
    return c.json({ error: "Failed to reset password" }, 500);
  }
});

// PAIRING ROUTES
app.post("/make-server-494d91eb/pairing/generate", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Pairing Generate] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { userId } = body;
    
    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    // Check if user exists
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Allow generating new code even if already paired (removed the check)

    // Generate unique code
    let code = generateCode();
    let existingCode = await kv.get(`code:${code}`);
    while (existingCode) {
      code = generateCode();
      existingCode = await kv.get(`code:${code}`);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
    const codeData = {
      code,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: "active",
    };

    await kv.set(`code:${code}`, codeData);
    await kv.set(`code:user:${userId}`, codeData);

    return c.json({
      success: true,
      code,
      expiresAt,
    });
  } catch (error) {
    console.log(`Error generating pairing code: ${error}`);
    return c.json({ error: "Failed to generate code" }, 500);
  }
});

app.post("/make-server-494d91eb/pairing/join", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Pairing Join] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { userId, code } = body;
    
    if (!userId || !code) {
      return c.json({ error: "User ID and code are required" }, 400);
    }

    // Check if user exists
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if user already has a couple
    const existingCouple = await kv.get(`couple:user:${userId}`);
    if (existingCouple) {
      return c.json({ error: "User is already paired" }, 400);
    }

    // Get code data
    const codeData = await kv.get(`code:${code}`);
    if (!codeData) {
      return c.json({ error: "Invalid code" }, 400);
    }

    // Check if code expired
    if (new Date(codeData.expiresAt) < new Date()) {
      await kv.set(`code:${code}`, { ...codeData, status: "expired" });
      return c.json({ error: "Code has expired" }, 400);
    }

    // Check if code already used
    if (codeData.status !== "active") {
      return c.json({ error: "Code has already been used" }, 400);
    }

    // Check if trying to join own code
    if (codeData.userId === userId) {
      return c.json({ error: "Cannot join your own code" }, 400);
    }

    // If the code owner is already paired, block the join request.
    const codeOwnerCoupleId = await kv.get(`couple:user:${codeData.userId}`);
    if (codeOwnerCoupleId) {
      return c.json({ error: "The code owner is already paired" }, 400);
    }

    // If this is a reconnect attempt to a previous partner, create a reconnect request instead
    const previousHistory = (await kv.get(`couple:history:${codeData.userId}`)) || [];
    const reconnectEntry = (previousHistory as any[]).find(
      (entry) => entry.partnerId === userId && entry.coupleId
    );

    if (reconnectEntry) {
      const requestId = generateId();
      const request = {
        requestId,
        coupleId: reconnectEntry.coupleId,
        requesterId: userId,
        requesterUsername: user.username,
        requesterDisplayName: user.displayName,
        targetId: codeData.userId,
        requestedAt: new Date().toISOString(),
        status: "pending",
      };

      const requestKey = `reconnect:requests:${codeData.userId}`;
      const existingRequests = (await kv.get(requestKey)) || [];
      const updatedRequests = [request, ...(existingRequests as any[]).filter((item) => item.requestId !== requestId)];
      await kv.set(requestKey, updatedRequests);

      return c.json({ success: true, pending: true, request });
    }

    // Create couple
    const coupleId = generateId();
    const couple = {
      coupleId,
      user1Id: codeData.userId,
      user2Id: userId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`couple:${coupleId}`, couple);
    await kv.set(`couple:user:${codeData.userId}`, coupleId);
    await kv.set(`couple:user:${userId}`, coupleId);
    await kv.set(`code:${code}`, { ...codeData, status: "used", coupleId });

    // Get partner info
    const partner = await kv.get(`user:${codeData.userId}`);

    return c.json({
      success: true,
      coupleId,
      partner: {
        userId: partner.userId,
        username: partner.username,
        displayName: partner.displayName,
      }
    });
  } catch (error) {
    console.log(`Error joining with code: ${error}`);
    return c.json({ error: "Failed to join with code" }, 500);
  }
});

app.get("/make-server-494d91eb/pairing/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const codeData = await kv.get(`code:user:${userId}`);
    
    if (!codeData) {
      return c.json({ code: null });
    }

    return c.json(codeData);
  } catch (error) {
    console.log(`Error getting pairing code: ${error}`);
    return c.json({ error: "Failed to get pairing code" }, 500);
  }
});

// COUPLE ROUTES
app.get("/make-server-494d91eb/couples/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const coupleId = await kv.get(`couple:user:${userId}`);
    
    if (!coupleId) {
      return c.json({ couple: null });
    }

    const couple = await kv.get(`couple:${coupleId}`);
    const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
    const partner = await kv.get(`user:${partnerId}`);

    return c.json({
      coupleId: couple.coupleId,
      createdAt: couple.createdAt,
      user1Id: couple.user1Id,
      user2Id: couple.user2Id,
      partner: {
        userId: partner.userId,
        username: partner.username,
        displayName: partner.displayName,
      }
    });
  } catch (error) {
    console.log(`Error getting couple: ${error}`);
    return c.json({ error: "Failed to get couple" }, 500);
  }
});

app.delete("/make-server-494d91eb/couples/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const coupleId = await kv.get(`couple:user:${userId}`);
    
    if (!coupleId) {
      return c.json({ error: "No couple found" }, 404);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple data not found" }, 404);
    }

    const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
    const user = await kv.get(`user:${userId}`);
    const partner = await kv.get(`user:${partnerId}`);

    const historyEntryForUser = {
      coupleId,
      partnerId: partner.userId,
      partnerUsername: partner.username,
      partnerDisplayName: partner.displayName,
      disconnectedAt: new Date().toISOString(),
      createdAt: couple.createdAt,
    };

    const historyEntryForPartner = {
      coupleId,
      partnerId: user.userId,
      partnerUsername: user.username,
      partnerDisplayName: user.displayName,
      disconnectedAt: new Date().toISOString(),
      createdAt: couple.createdAt,
    };

    const appendHistory = async (targetUserId: string, entry: any) => {
      const historyKey = `couple:history:${targetUserId}`;
      const existingHistory = (await kv.get(historyKey)) || [];
      const filteredHistory = (existingHistory as any[]).filter((item) => item.coupleId !== entry.coupleId);
      const nextHistory = [entry, ...filteredHistory].slice(0, 10);
      await kv.set(historyKey, nextHistory);
    };

    await appendHistory(userId, historyEntryForUser);
    await appendHistory(partnerId, historyEntryForPartner);

    // Remove both user connection mappings but keep couple data intact so reconnection is possible
    await kv.del(`couple:user:${couple.user1Id}`);
    await kv.del(`couple:user:${couple.user2Id}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error unpairing: ${error}`);
    return c.json({ error: "Failed to unpair" }, 500);
  }
});

app.get("/make-server-494d91eb/couples/history/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const history = (await kv.get(`couple:history:${userId}`)) || [];
    return c.json({ history });
  } catch (error) {
    console.log(`Error getting couple history: ${error}`);
    return c.json({ error: "Failed to get couple history" }, 500);
  }
});

app.get("/make-server-494d91eb/reconnect-requests/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const requests = (await kv.get(`reconnect:requests:${userId}`)) || [];
    return c.json({ requests });
  } catch (error) {
    console.log(`Error getting reconnect requests: ${error}`);
    return c.json({ error: "Failed to get reconnect requests" }, 500);
  }
});

app.post("/make-server-494d91eb/reconnect-requests/:userId/:requestId/accept", async (c) => {
  try {
    const userId = c.req.param("userId");
    const requestId = c.req.param("requestId");
    const requestsKey = `reconnect:requests:${userId}`;
    const requests = (await kv.get(requestsKey)) || [];
    const request = (requests as any[]).find((item) => item.requestId === requestId);

    if (!request) {
      return c.json({ error: "Reconnect request not found" }, 404);
    }

    if (request.status !== "pending") {
      return c.json({ error: "Reconnect request is no longer pending" }, 400);
    }

    const requesterId = request.requesterId;
    const targetId = request.targetId;
    const coupleId = request.coupleId;

    const existingRequesterCoupleId = await kv.get(`couple:user:${requesterId}`);
    const existingTargetCoupleId = await kv.get(`couple:user:${targetId}`);

    if (existingRequesterCoupleId) {
      return c.json({ error: "Requester is already paired" }, 400);
    }

    if (existingTargetCoupleId) {
      return c.json({ error: "Target user is already paired" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple record no longer exists" }, 404);
    }

    await kv.set(`couple:user:${requesterId}`, coupleId);
    await kv.set(`couple:user:${targetId}`, coupleId);

    const updatedRequests = (requests as any[]).filter((item) => item.requestId !== requestId);
    await kv.set(requestsKey, updatedRequests);

    const partnerId = requesterId === userId ? targetId : requesterId;
    const partner = await kv.get(`user:${partnerId}`);

    return c.json({
      success: true,
      couple: {
        coupleId: couple.coupleId,
        createdAt: couple.createdAt,
        user1Id: couple.user1Id,
        user2Id: couple.user2Id,
        partner: {
          userId: partner.userId,
          username: partner.username,
          displayName: partner.displayName,
        },
      },
    });
  } catch (error) {
    console.log(`Error accepting reconnect request: ${error}`);
    return c.json({ error: "Failed to accept reconnect request" }, 500);
  }
});

app.delete("/make-server-494d91eb/reconnect-requests/:userId/:requestId/decline", async (c) => {
  try {
    const userId = c.req.param("userId");
    const requestId = c.req.param("requestId");
    const requestsKey = `reconnect:requests:${userId}`;
    const requests = (await kv.get(requestsKey)) || [];
    const updatedRequests = (requests as any[]).filter((item) => item.requestId !== requestId);
    await kv.set(requestsKey, updatedRequests);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error declining reconnect request: ${error}`);
    return c.json({ error: "Failed to decline reconnect request" }, 500);
  }
});

app.post("/make-server-494d91eb/couples/reconnect/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const { coupleId } = await c.req.json();

    if (!coupleId) {
      return c.json({ error: "Couple ID is required" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }

    if (couple.user1Id !== userId && couple.user2Id !== userId) {
      return c.json({ error: "You are not part of this couple" }, 403);
    }

    const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
    const partner = await kv.get(`user:${partnerId}`);
    if (!partner) {
      return c.json({ error: "Partner user not found" }, 404);
    }

    const partnerCurrentCoupleId = await kv.get(`couple:user:${partnerId}`);
    if (partnerCurrentCoupleId && partnerCurrentCoupleId !== coupleId) {
      return c.json({ error: "Your previous partner is already paired with someone else" }, 409);
    }

    // Restore both user mappings to the existing couple
    await kv.set(`couple:user:${userId}`, coupleId);
    await kv.set(`couple:user:${partnerId}`, coupleId);

    return c.json({
      success: true,
      couple: {
        coupleId: couple.coupleId,
        createdAt: couple.createdAt,
        user1Id: couple.user1Id,
        user2Id: couple.user2Id,
        partner: {
          userId: partner.userId,
          username: partner.username,
          displayName: partner.displayName,
        },
      },
    });
  } catch (error) {
    console.log(`Error reconnecting couple: ${error}`);
    return c.json({ error: "Failed to reconnect" }, 500);
  }
});

// TODAY CARD ROUTES
app.get("/make-server-494d91eb/today/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    
    if (!coupleId) {
      return c.json({ todayCard: null });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayCard = await kv.get(`today:${coupleId}:${today}`);
    
    return c.json({ todayCard: todayCard || null });
  } catch (error) {
    console.log(`Error getting today card: ${error}`);
    return c.json({ error: "Failed to get today card" }, 500);
  }
});

app.post("/make-server-494d91eb/today/:coupleId", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Today Card Update] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const coupleId = c.req.param("coupleId");
    const { userId, mood, message, doodle, intensity } = body;
    
    const today = new Date().toISOString().split('T')[0];
    const existingCard = await kv.get(`today:${coupleId}:${today}`) || {};
    
    // Get couple info to determine user1 vs user2
    const couple = await kv.get(`couple:${coupleId}`);
    const isUser1 = couple.user1Id === userId;
    
    // Build update for this specific user
    const userPrefix = isUser1 ? 'user1' : 'user2';
    const updates: any = {};
    
    if (mood !== undefined) {
      // Add mood to gallery array instead of overwriting
      const moodGalleryKey = `${userPrefix}MoodGallery`;
      const existingMoodGallery = existingCard[moodGalleryKey] || [];
      const newMoodEntry = {
        mood,
        intensity,
        timestamp: new Date().toISOString(),
        userId,
      };
      updates[moodGalleryKey] = [...existingMoodGallery, newMoodEntry];
      
      // Also update the single mood field for backward compatibility
      updates[`${userPrefix}Mood`] = mood;
      updates[`${userPrefix}Intensity`] = intensity;
    }
    if (message !== undefined) {
      const messageText = String(message);
      if (messageText.length > 1000) {
        return c.json({ error: "Message must be 1000 characters or less" }, 400);
      }
      // Add message to gallery array instead of overwriting
      const messageGalleryKey = `${userPrefix}MessageGallery`;
      const existingMessageGallery = existingCard[messageGalleryKey] || [];
      const newMessageEntry = {
        message: messageText,
        timestamp: new Date().toISOString(),
        userId,
      };
      updates[messageGalleryKey] = [...existingMessageGallery, newMessageEntry];
      
      // Also update the single message field for backward compatibility
      updates[`${userPrefix}Message`] = messageText;
    }
    if (doodle !== undefined) {
      // Add doodle to gallery array instead of overwriting
      const doodleGalleryKey = `${userPrefix}DoodleGallery`;
      const existingGallery = existingCard[doodleGalleryKey] || [];
      const newDoodleEntry = {
        doodle,
        timestamp: new Date().toISOString(),
        userId,
      };
      updates[doodleGalleryKey] = [...existingGallery, newDoodleEntry];
      
      // Also update the single doodle field for backward compatibility
      updates[`${userPrefix}Doodle`] = doodle;
    }
    
    updates[`${userPrefix}UpdatedAt`] = new Date().toISOString();
    
    const todayCard = {
      ...existingCard,
      coupleId,
      date: today,
      ...updates,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
      reactions: existingCard.reactions || [],
    };

    await kv.set(`today:${coupleId}:${today}`, todayCard);

    return c.json({
      success: true,
      todayCard,
    });
  } catch (error) {
    console.log(`Error updating today card: ${error}`);
    return c.json({ error: "Failed to update today card" }, 500);
  }
});

app.post("/make-server-494d91eb/today/:coupleId/react", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Today Card React] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const coupleId = c.req.param("coupleId");
    const { userId, emoji } = body;
    
    const today = new Date().toISOString().split('T')[0];
    const todayCard = await kv.get(`today:${coupleId}:${today}`);
    
    if (!todayCard) {
      return c.json({ error: "No today card found" }, 404);
    }

    const reactions = todayCard.reactions || [];
    reactions.push({
      userId,
      emoji,
      timestamp: new Date().toISOString(),
    });

    const updatedCard = {
      ...todayCard,
      reactions,
    };

    await kv.set(`today:${coupleId}:${today}`, updatedCard);

    return c.json({
      success: true,
      todayCard: updatedCard,
    });
  } catch (error) {
    console.log(`Error adding reaction: ${error}`);
    return c.json({ error: "Failed to add reaction" }, 500);
  }
});

// HISTORY ROUTES
app.get("/make-server-494d91eb/history/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    const allCards = await kv.getByPrefix(`today:${coupleId}:`);
    
    // Sort by date descending
    const sortedCards = allCards.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return c.json({ history: sortedCards });
  } catch (error) {
    console.log(`Error getting history: ${error}`);
    return c.json({ error: "Failed to get history" }, 500);
  }
});

// NOTIFICATION ROUTES
// NOTE: Notifications are NOT stored in database to reduce usage
// They are handled locally on the frontend only
app.post("/make-server-494d91eb/notifications/nudge", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Nudge Notification] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }

    const { coupleId, senderId } = body;

    console.log(`[Nudge Notification] Received request - coupleId: ${coupleId}, senderId: ${senderId}`);

    if (!coupleId || !senderId) {
      return c.json({ error: "Couple ID and sender ID are required" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      console.log(`[Nudge Notification] Couple not found: ${coupleId}`);
      return c.json({ error: "Couple not found" }, 404);
    }

    // Get receiver ID (the partner)
    const receiverId = couple.user1Id === senderId ? couple.user2Id : couple.user1Id;

    console.log(`[Nudge Notification] Receiver identified: ${receiverId}`);

    // Get sender info
    const sender = await kv.get(`user:${senderId}`);

    // Create notification object but DO NOT store in database
    const notificationId = generateId();
    const notification = {
      id: notificationId,
      type: "nudge",
      coupleId,
      senderId,
      senderName: sender.displayName,
      receiverId,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Attempt to send push notification to the partner
    const receiver = await kv.get(`user:${receiverId}`);
    let notificationSent = false;
    if (receiver?.fcmToken) {
      try {
        await sendFcmPush(
          receiver.fcmToken,
          {
            title: `${sender.displayName} sent you a nudge`,
            body: "Open Aimo Pulse to view your partner's update.",
          },
          {
            type: "nudge",
            coupleId,
            senderId,
            receiverId,
            notificationId,
          },
        );
        notificationSent = true;
      } catch (pushError) {
        console.log(`[Nudge Notification] FCM push failed: ${pushError}`);
      }
    } else {
      console.log(`[Nudge Notification] Receiver does not have an FCM token: ${receiverId}`);
    }

    // Database storage removed to reduce usage
    // await kv.set(`notification:${notificationId}`, notification);
    // await kv.set(`notification:user:${receiverId}:${notificationId}`, notificationId);

    console.log(`[Nudge Notification] Notification created (not stored in DB): ${notificationId} for receiver ${receiverId}`);

    return c.json({
      success: true,
      notification,
      notificationSent,
    });
  } catch (error) {
    console.log(`[Nudge Notification] Error sending nudge notification: ${error}`);
    console.log(`[Nudge Notification] Error stack:`, error?.stack);
    return c.json({ error: "Failed to send nudge" }, 500);
  }
});

app.post("/make-server-494d91eb/notifications/mood-update", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Mood Update Notification] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }

    const { coupleId, senderId, mood, intensity } = body;

    if (!coupleId || !senderId || !mood) {
      return c.json({ error: "Couple ID, sender ID, and mood are required" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }

    // Get receiver ID (the partner)
    const receiverId = couple.user1Id === senderId ? couple.user2Id : couple.user1Id;

    // Get sender info
    const sender = await kv.get(`user:${senderId}`);

    // Create notification object but DO NOT store in database
    const notificationId = generateId();
    const notification = {
      id: notificationId,
      type: "mood-update",
      coupleId,
      senderId,
      senderName: sender.displayName,
      receiverId,
      mood,
      intensity,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const receiver = await kv.get(`user:${receiverId}`);
    let notificationSent = false;
    if (receiver?.fcmToken) {
      try {
        await sendFcmPush(
          receiver.fcmToken,
          {
            title: `${sender.displayName} updated their mood`,
            body: `${sender.displayName} is feeling ${mood}${intensity ? ` (${intensity})` : ''}.`,
          },
          {
            type: "mood-update",
            coupleId,
            senderId,
            receiverId,
            notificationId,
            mood,
            intensity,
          },
        );
        notificationSent = true;
      } catch (pushError) {
        console.log(`[Mood Update Notification] FCM push failed: ${pushError}`);
      }
    } else {
      console.log(`[Mood Update Notification] Receiver does not have an FCM token: ${receiverId}`);
    }

    // Database storage removed to reduce usage
    // await kv.set(`notification:${notificationId}`, notification);
    // await kv.set(`notification:user:${receiverId}:${notificationId}`, notificationId);

    return c.json({
      success: true,
      notification,
      notificationSent,
    });
  } catch (error) {
    console.log(`Error sending mood update notification: ${error}`);
    return c.json({ error: "Failed to send mood update notification" }, 500);
  }
});

app.post("/make-server-494d91eb/notifications/message-update", async (c) => {
  try {
    const { coupleId, senderId, message } = await c.req.json();

    if (!coupleId || !senderId || !message) {
      return c.json({ error: "Couple ID, sender ID, and message are required" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }

    // Get receiver ID (the partner)
    const receiverId = couple.user1Id === senderId ? couple.user2Id : couple.user1Id;

    // Get sender info
    const sender = await kv.get(`user:${senderId}`);

    // Create notification object but DO NOT store in database
    const notificationId = generateId();
    const notification = {
      id: notificationId,
      type: "message-update",
      coupleId,
      senderId,
      senderName: sender.displayName,
      receiverId,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const receiver = await kv.get(`user:${receiverId}`);
    let notificationSent = false;
    if (receiver?.fcmToken) {
      try {
        await sendFcmPush(
          receiver.fcmToken,
          {
            title: `${sender.displayName} sent you a message`,
            body: message,
          },
          {
            type: "message-update",
            coupleId,
            senderId,
            receiverId,
            notificationId,
            message,
          },
        );
        notificationSent = true;
      } catch (pushError) {
        console.log(`[Message Update Notification] FCM push failed: ${pushError}`);
      }
    } else {
      console.log(`[Message Update Notification] Receiver does not have an FCM token: ${receiverId}`);
    }

    // Database storage removed to reduce usage
    // await kv.set(`notification:${notificationId}`, notification);
    // await kv.set(`notification:user:${receiverId}:${notificationId}`, notificationId);

    return c.json({
      success: true,
      notification,
      notificationSent,
    });
  } catch (error) {
    console.log(`Error sending message update notification: ${error}`);
    return c.json({ error: "Failed to send message update notification" }, 500);
  }
});

app.post("/make-server-494d91eb/notifications/doodle-update", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Doodle Update Notification] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }

    const { coupleId, senderId, doodle } = body;

    if (!coupleId || !senderId) {
      return c.json({ error: "Couple ID and sender ID are required" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }

    // Get receiver ID (the partner)
    const receiverId = couple.user1Id === senderId ? couple.user2Id : couple.user1Id;

    // Get sender info
    const sender = await kv.get(`user:${senderId}`);

    // Create notification object but DO NOT store in database
    const notificationId = generateId();
    const notification = {
      id: notificationId,
      type: "doodle-update",
      coupleId,
      senderId,
      senderName: sender.displayName,
      receiverId,
      doodle: doodle || null,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const receiver = await kv.get(`user:${receiverId}`);
    let notificationSent = false;
    if (receiver?.fcmToken) {
      try {
        await sendFcmPush(
          receiver.fcmToken,
          {
            title: `${sender.displayName} sent a doodle`,
            body: "Tap to open the new doodle in Aimo Pulse.",
          },
          {
            type: "doodle-update",
            coupleId,
            senderId,
            receiverId,
            notificationId,
          },
        );
        notificationSent = true;
      } catch (pushError) {
        console.log(`[Doodle Update Notification] FCM push failed: ${pushError}`);
      }
    } else {
      console.log(`[Doodle Update Notification] Receiver does not have an FCM token: ${receiverId}`);
    }

    // Database storage removed to reduce usage
    // await kv.set(`notification:${notificationId}`, notification);
    // await kv.set(`notification:user:${receiverId}:${notificationId}`, notificationId);

    return c.json({
      success: true,
      notification,
      notificationSent,
    });
  } catch (error) {
    console.log(`Error sending doodle update notification: ${error}`);
    return c.json({ error: "Failed to send doodle update notification" }, 500);
  }
});

app.get("/make-server-494d91eb/notifications/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");

    console.log(`[Notifications] Fetching notifications for user: ${userId} (DB storage disabled)`);

    // Notifications are not stored in database to reduce usage
    // Always return empty array
    return c.json({ notifications: [] });
  } catch (error) {
    console.log(`[Notifications] Error getting notifications: ${error}`);
    console.log(`[Notifications] Error stack:`, error?.stack);
    return c.json({ error: "Failed to get notifications" }, 500);
  }
});

app.post("/make-server-494d91eb/notifications/:notificationId/read", async (c) => {
  try {
    const notificationId = c.req.param("notificationId");

    console.log(`[Notifications] Mark as read request for: ${notificationId} (DB storage disabled)`);

    // Notifications are not stored in database to reduce usage
    // Always return success
    return c.json({ success: true });
  } catch (error) {
    console.log(`[Notifications] Error marking notification as read: ${error}`);
    console.log(`[Notifications] Error stack:`, error?.stack);
    return c.json({ error: "Failed to mark notification as read" }, 500);
  }
});

// ===== SHARK MODE ENDPOINTS =====

// Activate Shark Mode
app.post("/make-server-494d91eb/shark-mode/activate", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Shark Mode Activate] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { coupleId, userId, durationDays, note } = body;
    
    if (!coupleId || !userId || !durationDays) {
      return c.json({ error: "Couple ID, user ID, and duration are required" }, 400);
    }

    if (durationDays < 1 || durationDays > 7) {
      return c.json({ error: "Duration must be between 1 and 7 days" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }

    // Verify user is part of the couple
    if (couple.user1Id !== userId && couple.user2Id !== userId) {
      return c.json({ error: "User is not part of this couple" }, 403);
    }

    // Get user info for display name
    const user = await kv.get(`user:${userId}`);

    const now = new Date();
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const sharkModeId = generateId();
    const sharkMode = {
      id: sharkModeId,
      coupleId,
      activatedBy: userId,
      activatedByName: user.displayName,
      activatedAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      durationDays,
      note: note || '',
      reassurance: null,
      reassuranceBy: null,
      reassuranceAt: null,
      status: "active",
    };

    await kv.set(`shark_mode:${coupleId}`, sharkMode);
    await kv.set(`shark_mode_history:${coupleId}:${sharkModeId}`, sharkMode);

    console.log(`[Shark Mode] Activated by user ${userId} for ${durationDays} days`);
    return c.json({ success: true, sharkMode });
  } catch (error: any) {
    console.error(`[Shark Mode] Error activating:`, error);
    return c.json({ error: error.message || "Failed to activate Shark Mode" }, 500);
  }
});

// Extend Shark Mode
app.post("/make-server-494d91eb/shark-mode/extend", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Shark Mode Extend] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { coupleId, userId, additionalDays } = body;
    
    if (!coupleId || !userId || !additionalDays) {
      return c.json({ error: "Couple ID, user ID, and additional days are required" }, 400);
    }

    const sharkMode = await kv.get(`shark_mode:${coupleId}`);
    
    if (!sharkMode || sharkMode.status !== "active") {
      return c.json({ error: "Shark Mode is not active" }, 404);
    }

    // Verify the user is the one who activated it
    if (sharkMode.activatedBy !== userId) {
      return c.json({ error: "Only the user who activated Shark Mode can extend it" }, 403);
    }

    const currentEndsAt = new Date(sharkMode.endsAt);
    const newEndsAt = new Date(currentEndsAt.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    const maxEndsAt = new Date(new Date(sharkMode.activatedAt).getTime() + 7 * 24 * 60 * 60 * 1000);

    // Don't allow extension beyond 7 days from activation
    if (newEndsAt > maxEndsAt) {
      return c.json({ error: "Cannot extend beyond 7 days total" }, 400);
    }

    sharkMode.endsAt = newEndsAt.toISOString();
    sharkMode.durationDays = Math.ceil((newEndsAt.getTime() - new Date(sharkMode.activatedAt).getTime()) / (24 * 60 * 60 * 1000));
    
    await kv.set(`shark_mode:${coupleId}`, sharkMode);
    // Update history as well
    await kv.set(`shark_mode_history:${coupleId}:${sharkMode.id}`, sharkMode);

    console.log(`[Shark Mode] Extended by user ${userId} to ${newEndsAt.toISOString()}`);
    return c.json({ success: true, sharkMode });
  } catch (error: any) {
    console.error(`[Shark Mode] Error extending:`, error);
    return c.json({ error: error.message || "Failed to extend Shark Mode" }, 500);
  }
});

// Deactivate Shark Mode
app.post("/make-server-494d91eb/shark-mode/deactivate", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Shark Mode Deactivate] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { coupleId, userId } = body;
    
    if (!coupleId || !userId) {
      return c.json({ error: "Couple ID and user ID are required" }, 400);
    }

    const sharkMode = await kv.get(`shark_mode:${coupleId}`);
    
    if (!sharkMode || sharkMode.status !== "active") {
      return c.json({ error: "Shark Mode is not active" }, 404);
    }

    // Verify the user is the one who activated it
    if (sharkMode.activatedBy !== userId) {
      return c.json({ error: "Only the user who activated Shark Mode can deactivate it" }, 403);
    }

    sharkMode.status = "deactivated";
    sharkMode.deactivatedAt = new Date().toISOString();
    
    await kv.set(`shark_mode:${coupleId}`, sharkMode);
    // Update history as well
    await kv.set(`shark_mode_history:${coupleId}:${sharkMode.id}`, sharkMode);

    console.log(`[Shark Mode] Deactivated by user ${userId}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error(`[Shark Mode] Error deactivating:`, error);
    return c.json({ error: error.message || "Failed to deactivate Shark Mode" }, 500);
  }
});

// Update note
app.post("/make-server-494d91eb/shark-mode/update-note", async (c) => {
  try {
    const { coupleId, userId, note } = await c.req.json();
    
    if (!coupleId || !userId) {
      return c.json({ error: "Couple ID and user ID are required" }, 400);
    }

    const sharkMode = await kv.get(`shark_mode:${coupleId}`);
    
    if (!sharkMode || sharkMode.status !== "active") {
      return c.json({ error: "Shark Mode is not active" }, 404);
    }

    // Verify the user is the one who activated it
    if (sharkMode.activatedBy !== userId) {
      return c.json({ error: "Only the user who activated Shark Mode can update the note" }, 403);
    }

    sharkMode.note = note || '';
    await kv.set(`shark_mode:${coupleId}`, sharkMode);
    // Update history as well
    await kv.set(`shark_mode_history:${coupleId}:${sharkMode.id}`, sharkMode);

    console.log(`[Shark Mode] Note updated by user ${userId}`);
    return c.json({ success: true, sharkMode });
  } catch (error: any) {
    console.error(`[Shark Mode] Error updating note:`, error);
    return c.json({ error: error.message || "Failed to update note" }, 500);
  }
});

// Get Shark Mode status
app.get("/make-server-494d91eb/shark-mode/status/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    
    if (!coupleId) {
      return c.json({ error: "Couple ID is required" }, 400);
    }

    const sharkMode = await kv.get(`shark_mode:${coupleId}`);
    
    if (!sharkMode) {
      return c.json({ sharkMode: null });
    }

    // Check if it has expired
    if (sharkMode.status === "active" && new Date(sharkMode.endsAt) < new Date()) {
      sharkMode.status = "expired";
      await kv.set(`shark_mode:${coupleId}`, sharkMode);
      // Update in history as well
      await kv.set(`shark_mode_history:${coupleId}:${sharkMode.id}`, sharkMode);
    }

    // Only return active shark modes
    if (sharkMode.status === "active") {
      return c.json({ sharkMode });
    }

    return c.json({ sharkMode: null });
  } catch (error: any) {
    console.error(`[Shark Mode] Error getting status:`, error);
    return c.json({ error: error.message || "Failed to get Shark Mode status" }, 500);
  }
});

// Send reassurance
app.post("/make-server-494d91eb/shark-mode/reassurance", async (c) => {
  try {
    const { coupleId, userId, reassurance } = await c.req.json();
    
    if (!coupleId || !userId || !reassurance) {
      return c.json({ error: "Couple ID, user ID, and reassurance are required" }, 400);
    }

    const sharkMode = await kv.get(`shark_mode:${coupleId}`);
    
    if (!sharkMode || sharkMode.status !== "active") {
      return c.json({ error: "Shark Mode is not active" }, 404);
    }

    // Verify the user is NOT the one who activated it (partner only)
    if (sharkMode.activatedBy === userId) {
      return c.json({ error: "Only the partner can send reassurance" }, 403);
    }

    // Get user info for display name
    const user = await kv.get(`user:${userId}`);

    sharkMode.reassurance = reassurance;
    sharkMode.reassuranceBy = userId;
    sharkMode.reassuranceByName = user.displayName;
    sharkMode.reassuranceAt = new Date().toISOString();
    
    await kv.set(`shark_mode:${coupleId}`, sharkMode);
    // Update history as well
    await kv.set(`shark_mode_history:${coupleId}:${sharkMode.id}`, sharkMode);

    console.log(`[Shark Mode] Reassurance sent by user ${userId}`);
    return c.json({ success: true, sharkMode });
  } catch (error: any) {
    console.error(`[Shark Mode] Error sending reassurance:`, error);
    return c.json({ error: error.message || "Failed to send reassurance" }, 500);
  }
});

// Get Shark Mode history
app.get("/make-server-494d91eb/shark-mode/history/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    
    if (!coupleId) {
      return c.json({ error: "Couple ID is required" }, 400);
    }

    const history = await kv.getByPrefix(`shark_mode_history:${coupleId}:`);
    
    // Sort by activatedAt descending (newest first)
    const sortedHistory = history.sort((a: any, b: any) => {
      return new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime();
    });

    return c.json({ history: sortedHistory });
  } catch (error: any) {
    console.error(`[Shark Mode] Error getting history:`, error);
    return c.json({ error: error.message || "Failed to get Shark Mode history" }, 500);
  }
});

// ===== END SHARK MODE ENDPOINTS =====

// ===== COUPLE CHALLENGES ENDPOINTS =====

// Challenge Library - Fun weekly challenges for couples
const CHALLENGE_LIBRARY = [
  // Communication 💬
  { id: 'c1', category: '💬 Communication', title: 'Share 3 Compliments', description: 'Throughout the day, send your partner 3 genuine compliments', points: 10 },
  { id: 'c2', category: '💬 Communication', title: 'Childhood Memory', description: 'Share a favorite childhood memory with each other', points: 10 },
  { id: 'c3', category: '💬 Communication', title: 'Dream Talk', description: 'Discuss your dreams and goals for the future together', points: 15 },
  { id: 'c4', category: '💬 Communication', title: 'Gratitude Exchange', description: 'Each write down 5 things you love about the other person', points: 15 },
  { id: 'c5', category: '💬 Communication', title: 'Question Deep Dive', description: 'Ask each other: "What made you fall in love with me?"', points: 20 },
  { id: 'c6', category: '💬 Communication', title: '20 Questions', description: 'Play 20 questions about each other - test how well you know your partner!', points: 15 },
  
  // Adventure 🎯
  { id: 'c7', category: '🎯 Adventure', title: 'New Recipe Together', description: 'Cook or bake something you\'ve never tried before together', points: 20 },
  { id: 'c8', category: '🎯 Adventure', title: 'Explore New Place', description: 'Visit a restaurant, cafe, or spot you\'ve never been to', points: 20 },
  { id: 'c9', category: '🎯 Adventure', title: 'Phone-Free Walk', description: 'Take a 20-minute walk together without phones', points: 15 },
  { id: 'c10', category: '🎯 Adventure', title: 'Sunrise/Sunset', description: 'Watch the sunrise or sunset together', points: 25 },
  { id: 'c11', category: '🎯 Adventure', title: 'Try Something New', description: 'Do an activity neither of you has done before', points: 30 },
  { id: 'c12', category: '🎯 Adventure', title: 'Mystery Drive', description: 'Take turns giving driving directions to a random destination', points: 20 },
  
  // Romance 💕
  { id: 'c13', category: '💕 Romance', title: 'Love Letter', description: 'Write each other a handwritten love note', points: 20 },
  { id: 'c14', category: '💕 Romance', title: 'Plan Surprise Date', description: 'One person plans a surprise date for the other', points: 25 },
  { id: 'c15', category: '💕 Romance', title: 'Dance Together', description: 'Dance together for at least 5 minutes (any style!)', points: 15 },
  { id: 'c16', category: '💕 Romance', title: 'Massage Exchange', description: 'Give each other a 10-minute massage', points: 20 },
  { id: 'c17', category: '💕 Romance', title: 'Candlelit Dinner', description: 'Have dinner together by candlelight at home', points: 20 },
  { id: 'c18', category: '💕 Romance', title: 'Star Gazing', description: 'Lay under the stars and share your deepest thoughts', points: 25 },
  
  // Fun & Games 🎮
  { id: 'c19', category: '🎮 Fun & Games', title: 'Board Game Tournament', description: 'Play 3 different board or card games - keep score and crown a champion!', points: 20 },
  { id: 'c20', category: '🎮 Fun & Games', title: 'Video Game Co-op', description: 'Play a co-op video game together for at least 1 hour', points: 15 },
  { id: 'c21', category: '🎮 Fun & Games', title: 'Trivia Battle', description: 'Create custom trivia questions about your relationship - compete to see who remembers more!', points: 15 },
  { id: 'c22', category: '🎮 Fun & Games', title: 'Scavenger Hunt', description: 'Create a scavenger hunt with clues around your home or neighborhood for each other', points: 25 },
  { id: 'c23', category: '🎮 Fun & Games', title: 'Movie Marathon', description: 'Pick a theme and watch 2-3 movies together', points: 15 },
  { id: 'c24', category: '🎮 Fun & Games', title: 'DIY Escape Room', description: 'Create simple puzzles and riddles for each other to solve', points: 30 },
  { id: 'c25', category: '🎮 Fun & Games', title: 'Karaoke Duel', description: 'Sing at least 3 songs together - judge each other\'s performances!', points: 20 },
  { id: 'c26', category: '🎮 Fun & Games', title: 'Photo Challenge', description: 'Take 10 fun selfies together in different poses or recreate old photos', points: 10 },
  { id: 'c27', category: '🎮 Fun & Games', title: 'Craft Battle', description: 'Each make something creative in 30 mins with the same materials - vote on a winner!', points: 20 },
  { id: 'c28', category: '🎮 Fun & Games', title: 'Truth or Dare', description: 'Play truth or dare with silly, fun, or romantic dares for each other', points: 15 },
  { id: 'c29', category: '🎮 Fun & Games', title: 'Cooking Competition', description: 'Each make a dish with the same ingredients - taste test and judge!', points: 25 },
  { id: 'c30', category: '🎮 Fun & Games', title: 'Charades Night', description: 'Play charades with couple-themed categories (movies you\'ve seen, inside jokes, etc.)', points: 15 },
  { id: 'c31', category: '🎮 Fun & Games', title: 'Build Together Challenge', description: 'Build something together using LEGO, cards, or anything - get creative!', points: 20 },
  { id: 'c32', category: '🎮 Fun & Games', title: 'TikTok/Reel Challenge', description: 'Learn and perform a dance or comedy skit together', points: 20 },
  
  // Growth 🌱
  { id: 'c33', category: '🌱 Growth', title: 'Learn Together', description: 'Watch an educational video or read an article and discuss', points: 15 },
  { id: 'c34', category: '🌱 Growth', title: 'Meditation/Yoga', description: 'Do a 15-minute meditation or yoga session together', points: 20 },
  { id: 'c35', category: '🌱 Growth', title: 'Goal Setting', description: 'Set one personal and one couple goal for the month', points: 20 },
  { id: 'c36', category: '🌱 Growth', title: 'Digital Detox', description: 'Spend an entire evening without screens together', points: 25 },
  { id: 'c37', category: '🌱 Growth', title: 'Gratitude Journal', description: 'Write down 3 things you\'re grateful for about your relationship', points: 15 },
  { id: 'c38', category: '🌱 Growth', title: 'Book Club for Two', description: 'Read the same book chapter or article and discuss your takeaways', points: 20 },
  
  // Support 💪
  { id: 'c39', category: '💪 Support', title: 'Acts of Service', description: 'Do 3 helpful tasks for your partner without being asked', points: 15 },
  { id: 'c40', category: '💪 Support', title: 'Listen Deeply', description: 'Each person talks for 10 mins while the other just listens', points: 20 },
  { id: 'c41', category: '💪 Support', title: 'Encouragement Notes', description: 'Leave 5 encouraging notes for your partner to find', points: 15 },
  { id: 'c42', category: '💪 Support', title: 'Check-In Time', description: 'Have a 30-minute check-in about how you\'re both really doing', points: 20 },
  { id: 'c43', category: '💪 Support', title: 'Appreciate Effort', description: 'Acknowledge and thank each other for the little things', points: 10 },
  { id: 'c44', category: '💪 Support', title: 'Memory Lane', description: 'Look through old photos or videos together and share your favorite memories', points: 20 },
];

// Get the current week's challenge
app.get("/make-server-494d91eb/challenges/current/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    
    if (!coupleId) {
      return c.json({ error: "Couple ID is required" }, 400);
    }

    // Get current challenge for this couple
    let currentChallenge = await kv.get(`challenge_current:${coupleId}`);
    
    // If no challenge exists or it's from a previous week, generate a new one
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();
    const currentWeekKey = `${year}-W${weekNumber}`;
    
    if (!currentChallenge || currentChallenge.weekKey !== currentWeekKey) {
      // Get challenge history to avoid repeats
      const history = await kv.getByPrefix(`challenge_history:${coupleId}:`);
      const usedChallengeIds = history.map((h: any) => h.challengeId);
      
      // Filter out used challenges, or reset if all have been used
      let availableChallenges = CHALLENGE_LIBRARY.filter(ch => !usedChallengeIds.includes(ch.id));
      if (availableChallenges.length === 0) {
        availableChallenges = CHALLENGE_LIBRARY; // Reset if all completed
      }
      
      // Pick a random challenge
      const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
      
      currentChallenge = {
        ...randomChallenge,
        weekKey: currentWeekKey,
        startDate: getWeekStart(now).toISOString(),
        endDate: getWeekEnd(now).toISOString(),
        user1Completed: false,
        user2Completed: false,
        user1CompletedAt: null,
        user2CompletedAt: null,
        user1Response: null,
        user2Response: null,
        bothCompleted: false,
        bothCompletedAt: null,
      };
      
      await kv.set(`challenge_current:${coupleId}`, currentChallenge);
      console.log(`[Challenges] New challenge for ${coupleId}: ${currentChallenge.title}`);
    }

    return c.json({ challenge: currentChallenge });
  } catch (error: any) {
    console.error(`[Challenges] Error getting current challenge:`, error);
    return c.json({ error: error.message || "Failed to get current challenge" }, 500);
  }
});

// Mark challenge as complete
app.post("/make-server-494d91eb/challenges/complete", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Challenge Complete] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { coupleId, userId, response } = body;
    
    if (!coupleId || !userId) {
      return c.json({ error: "Couple ID and User ID are required" }, 400);
    }

    // Get couple to determine if user1 or user2
    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }
    
    const isUser1 = couple.user1Id === userId;
    const userKey = isUser1 ? 'user1Completed' : 'user2Completed';
    const userCompletedAtKey = isUser1 ? 'user1CompletedAt' : 'user2CompletedAt';
    const userResponseKey = isUser1 ? 'user1Response' : 'user2Response';
    
    // Get current challenge
    const currentChallenge = await kv.get(`challenge_current:${coupleId}`);
    if (!currentChallenge) {
      return c.json({ error: "No active challenge found" }, 404);
    }
    
    // Mark as completed
    currentChallenge[userKey] = true;
    currentChallenge[userCompletedAtKey] = new Date().toISOString();
    currentChallenge[userResponseKey] = response || null;
    
    // Check if both completed
    if (currentChallenge.user1Completed && currentChallenge.user2Completed && !currentChallenge.bothCompleted) {
      currentChallenge.bothCompleted = true;
      currentChallenge.bothCompletedAt = new Date().toISOString();
      
      // Save to history
      const historyEntry = {
        ...currentChallenge,
        completedAt: currentChallenge.bothCompletedAt,
      };
      await kv.set(`challenge_history:${coupleId}:${currentChallenge.weekKey}`, historyEntry);
      
      console.log(`[Challenges] Both completed challenge: ${currentChallenge.title}`);
    }
    
    await kv.set(`challenge_current:${coupleId}`, currentChallenge);

    return c.json({ 
      success: true, 
      challenge: currentChallenge,
      celebration: currentChallenge.bothCompleted && currentChallenge.bothCompletedAt === currentChallenge[userCompletedAtKey]
    });
  } catch (error: any) {
    console.error(`[Challenges] Error completing challenge:`, error);
    return c.json({ error: error.message || "Failed to complete challenge" }, 500);
  }
});

// Get challenge history
app.get("/make-server-494d91eb/challenges/history/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    
    if (!coupleId) {
      return c.json({ error: "Couple ID is required" }, 400);
    }

    const history = await kv.getByPrefix(`challenge_history:${coupleId}:`);
    
    // Sort by completion date descending (newest first)
    const sortedHistory = history.sort((a: any, b: any) => {
      return new Date(b.bothCompletedAt || b.endDate).getTime() - new Date(a.bothCompletedAt || a.endDate).getTime();
    });

    // Calculate stats
    const totalCompleted = sortedHistory.length;
    const totalPoints = sortedHistory.reduce((sum: number, ch: any) => sum + (ch.points || 0), 0);
    
    // Calculate streak (consecutive weeks)
    let currentStreak = 0;
    const sortedByWeek = [...sortedHistory].sort((a: any, b: any) => {
      return b.weekKey.localeCompare(a.weekKey);
    });
    
    for (let i = 0; i < sortedByWeek.length; i++) {
      const challenge = sortedByWeek[i];
      if (challenge.bothCompleted) {
        currentStreak++;
        // Check if next challenge is from the previous week
        if (i < sortedByWeek.length - 1) {
          const currentWeek = parseInt(challenge.weekKey.split('-W')[1]);
          const nextWeek = parseInt(sortedByWeek[i + 1].weekKey.split('-W')[1]);
          if (currentWeek - nextWeek !== 1) {
            break; // Streak broken
          }
        }
      } else {
        break;
      }
    }

    return c.json({ 
      history: sortedHistory,
      stats: {
        totalCompleted,
        totalPoints,
        currentStreak,
      }
    });
  } catch (error: any) {
    console.error(`[Challenges] Error getting challenge history:`, error);
    return c.json({ error: error.message || "Failed to get challenge history" }, 500);
  }
});

// Utility functions for week calculations
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  return new Date(d.setDate(diff));
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000); // Add 6 days
}

// ===== END COUPLE CHALLENGES ENDPOINTS =====

// ===== DAILY CHALLENGE ENDPOINTS =====

// Daily Challenge Question Library (100 curated questions)
const DAILY_QUESTIONS = [
  // 💗 Emotional Connection (20)
  "Send one word that describes how you feel about your partner today",
  "Share one thing you appreciate about them",
  "Draw how your heart feels today",
  "Send a comfort emoji without explanation",
  "Write a message starting with \"I feel safe when…\"",
  "Share a memory that made you smile",
  "Send a color that matches your mood",
  "Write one sentence you wish they knew",
  "Share today's emotional weather (sunny, cloudy, stormy)",
  "Send a hug emoji at a random time",
  "Share something you're proud of today",
  "Write a one-word intention for your relationship today",
  "Send a song lyric that matches your mood",
  "Share what you miss about them right now",
  "Draw your energy level today",
  "Send one thing that made today better",
  "Share something you're grateful for together",
  "Describe today in one emoji",
  "Send a calming message",
  "Say \"thank you\" for something specific",
  
  // 😄 Fun & Playful (20)
  "Draw something silly",
  "Send your current face emoji",
  "Use only emojis to describe your day",
  "Draw a tiny version of your partner",
  "Share your snack mood",
  "Send the funniest emoji combo you can",
  "Draw a random shape and name it",
  "Share today's vibe animal 🐢🐱🦊",
  "Send a surprise heart at a random hour",
  "Share your \"today energy\" emoji",
  "Draw your mood without lifting your finger",
  "Send an emoji that makes no sense",
  "Share your current comfort thing",
  "Draw a smile in under 5 seconds",
  "Send a \"guess my mood\" emoji",
  "Share a color that matches your energy",
  "Draw something abstract",
  "Send a playful tease (kind only!)",
  "Share your current obsession",
  "Send an emoji you rarely use",
  
  // 💬 Communication & Reflection (20)
  "Answer: \"What's on your mind today?\"",
  "Share one small worry",
  "Write something you're working through",
  "Share something you need today",
  "Write one boundary you value",
  "Answer: \"What do you need more of right now?\"",
  "Share one thing you learned today",
  "Write a sentence starting with \"Lately I've been…\"",
  "Share a feeling you had but didn't say",
  "Describe today in one sentence",
  "Share one thing you'd like support with",
  "Write something you'd like to talk about soon",
  "Share something you're avoiding",
  "Answer: \"What made today hard?\"",
  "Share one win from today",
  "Write something you're excited about",
  "Share one thing you want more of together",
  "Write a gentle check-in message",
  "Share today's emotional high",
  "Share today's emotional low",
  
  // 💞 Intimacy & Affection (20)
  "Send a loving emoji",
  "Write one thing you adore about your partner",
  "Share a moment you felt close",
  "Draw a heart your way",
  "Write \"I love when you…\"",
  "Send a kiss emoji unexpectedly",
  "Share one way they make you feel seen",
  "Draw something soft",
  "Share something you find attractive",
  "Write a cozy message",
  "Send an emoji that feels intimate to you",
  "Share a comforting word",
  "Draw closeness",
  "Send a sweet reminder",
  "Share a future moment you look forward to",
  "Write a sentence just for them",
  "Send a warm emoji combo",
  "Share something that makes you feel connected",
  "Write a gentle compliment",
  "Send a \"thinking of you\" moment",
  
  // 🌱 Care & Growth (20)
  "Share one thing you're doing for yourself today",
  "Write a kind message to yourself",
  "Share how you're taking care of your energy",
  "Send a reminder to rest",
  "Draw your stress level",
  "Share one thing you're letting go of",
  "Write a small intention for tomorrow",
  "Share one healthy habit today",
  "Send a grounding emoji",
  "Write something that helps you reset",
  "Share your sleep mood",
  "Send a gentle check-in emoji",
  "Write something you forgive yourself for",
  "Share how full your cup feels",
  "Draw balance",
  "Share one thing you're proud of surviving",
  "Write a reminder you need to hear",
  "Share something that soothes you",
  "Send a calm emoji",
  "Write one thing you're hopeful about"
];

// Get today's daily challenge
app.get("/make-server-494d91eb/daily-challenge/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    
    if (!coupleId) {
      return c.json({ error: "Couple ID is required" }, 400);
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Try to get existing challenge for today
    let dailyChallenge = await kv.get(`daily_challenge:${coupleId}:${today}`);
    
    if (!dailyChallenge) {
      // Generate a new challenge for today
      // Use date-based deterministic selection so both users see same question
      const dateNum = new Date(today).getTime();
      const questionIndex = Math.floor((dateNum / 86400000) % DAILY_QUESTIONS.length);
      const question = DAILY_QUESTIONS[questionIndex];
      
      dailyChallenge = {
        coupleId,
        date: today,
        question,
        questionIndex,
        user1Answer: null,
        user2Answer: null,
        user1AnsweredAt: null,
        user2AnsweredAt: null,
        bothAnswered: false,
        bothAnsweredAt: null,
        createdAt: new Date().toISOString(),
      };
      
      await kv.set(`daily_challenge:${coupleId}:${today}`, dailyChallenge);
      console.log(`[Daily Challenge] New challenge for ${coupleId} on ${today}: ${question}`);
    }

    return c.json({ challenge: dailyChallenge });
  } catch (error: any) {
    console.error(`[Daily Challenge] Error getting challenge:`, error);
    return c.json({ error: error.message || "Failed to get daily challenge" }, 500);
  }
});

// Submit answer to daily challenge
app.post("/make-server-494d91eb/daily-challenge/answer", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.log(`[Daily Challenge Answer] Failed to parse JSON body: ${parseError}`);
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    
    const { coupleId, userId, answer } = body;
    
    if (!coupleId || !userId || !answer) {
      return c.json({ error: "Couple ID, User ID, and answer are required" }, 400);
    }

    // Get couple to determine if user1 or user2
    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }
    
    const isUser1 = couple.user1Id === userId;
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's challenge
    const dailyChallenge = await kv.get(`daily_challenge:${coupleId}:${today}`);
    if (!dailyChallenge) {
      return c.json({ error: "No daily challenge found for today" }, 404);
    }
    
    // Update answer
    if (isUser1) {
      dailyChallenge.user1Answer = answer;
      dailyChallenge.user1AnsweredAt = new Date().toISOString();
    } else {
      dailyChallenge.user2Answer = answer;
      dailyChallenge.user2AnsweredAt = new Date().toISOString();
    }
    
    // Check if both answered
    if (dailyChallenge.user1Answer && dailyChallenge.user2Answer && !dailyChallenge.bothAnswered) {
      dailyChallenge.bothAnswered = true;
      dailyChallenge.bothAnsweredAt = new Date().toISOString();
      
      // Save to archive
      const archiveKey = `daily_challenge_archive:${coupleId}:${today}`;
      await kv.set(archiveKey, dailyChallenge);
      
      console.log(`[Daily Challenge] Both partners answered for ${today}`);
    }
    
    await kv.set(`daily_challenge:${coupleId}:${today}`, dailyChallenge);

    return c.json({ 
      success: true, 
      challenge: dailyChallenge,
      justCompleted: dailyChallenge.bothAnswered && dailyChallenge.bothAnsweredAt === (isUser1 ? dailyChallenge.user1AnsweredAt : dailyChallenge.user2AnsweredAt)
    });
  } catch (error: any) {
    console.error(`[Daily Challenge] Error submitting answer:`, error);
    return c.json({ error: error.message || "Failed to submit answer" }, 500);
  }
});

// Get daily challenge archive
app.get("/make-server-494d91eb/daily-challenge/archive/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    
    if (!coupleId) {
      return c.json({ error: "Couple ID is required" }, 400);
    }

    const archive = await kv.getByPrefix(`daily_challenge_archive:${coupleId}:`);
    
    // Sort by date descending (newest first)
    const sortedArchive = archive.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Calculate stats
    const totalAnswered = sortedArchive.length;
    let currentStreak = 0;
    
    // Calculate streak (consecutive days)
    if (sortedArchive.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date(today);
      
      for (const entry of sortedArchive) {
        const entryDate = entry.date;
        const expectedDate = checkDate.toISOString().split('T')[0];
        
        if (entryDate === expectedDate) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return c.json({ 
      archive: sortedArchive,
      stats: {
        totalAnswered,
        currentStreak,
      }
    });
  } catch (error: any) {
    console.error(`[Daily Challenge] Error getting archive:`, error);
    return c.json({ error: error.message || "Failed to get archive" }, 500);
  }
});

// ===== END DAILY CHALLENGE ENDPOINTS =====

// ===== PARTNER NEEDS YOU =====

type PartnerNeedStatus = "great" | "low" | "attention" | "support";

async function getPartnerNeedsRecord(coupleId: string) {
  const existing = await kv.get(`partner_needs:${coupleId}`);
  return existing || {
    coupleId,
    user1Status: null,
    user2Status: null,
    user1UpdatedAt: null,
    user2UpdatedAt: null,
  };
}

app.get("/make-server-494d91eb/partner-needs/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    if (!coupleId) {
      return c.json({ error: "Couple ID is required" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }

    const needs = await getPartnerNeedsRecord(coupleId);
    return c.json({ partnerNeeds: needs, user1Id: couple.user1Id, user2Id: couple.user2Id });
  } catch (error: any) {
    console.error(`[Partner Needs] Error getting status:`, error);
    return c.json({ error: error.message || "Failed to get partner needs status" }, 500);
  }
});

app.post("/make-server-494d91eb/partner-needs/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    const { userId, status } = await c.req.json();

    if (!coupleId || !userId || !status) {
      return c.json({ error: "Couple ID, user ID, and status are required" }, 400);
    }

    const validStatuses: PartnerNeedStatus[] = ["great", "low", "attention", "support"];
    if (!validStatuses.includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }

    if (userId !== couple.user1Id && userId !== couple.user2Id) {
      return c.json({ error: "User is not part of this couple" }, 403);
    }

    const needs = await getPartnerNeedsRecord(coupleId);
    const now = new Date().toISOString();

    if (userId === couple.user1Id) {
      needs.user1Status = status;
      needs.user1UpdatedAt = now;
    } else {
      needs.user2Status = status;
      needs.user2UpdatedAt = now;
    }

    await kv.set(`partner_needs:${coupleId}`, needs);

    return c.json({ success: true, partnerNeeds: needs });
  } catch (error: any) {
    console.error(`[Partner Needs] Error updating status:`, error);
    return c.json({ error: error.message || "Failed to update partner needs status" }, 500);
  }
});

// ===== COUPLE CALENDAR =====

type CalendarEventType = "anniversary" | "birthday" | "trip" | "important";

app.get("/make-server-494d91eb/calendar/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    if (!coupleId) {
      return c.json({ error: "Couple ID is required" }, 400);
    }

    const events = await kv.getByPrefix(`calendar_event:${coupleId}:`);
    const sorted = events.sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return c.json({ events: sorted });
  } catch (error: any) {
    console.error(`[Calendar] Error getting events:`, error);
    return c.json({ error: error.message || "Failed to get calendar events" }, 500);
  }
});

app.post("/make-server-494d91eb/calendar/:coupleId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    const { userId, type, title, date, notes } = await c.req.json();

    if (!coupleId || !userId || !type || !title || !date) {
      return c.json({ error: "Couple ID, user ID, type, title, and date are required" }, 400);
    }

    const validTypes: CalendarEventType[] = ["anniversary", "birthday", "trip", "important"];
    if (!validTypes.includes(type)) {
      return c.json({ error: "Invalid event type" }, 400);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }

    if (userId !== couple.user1Id && userId !== couple.user2Id) {
      return c.json({ error: "User is not part of this couple" }, 403);
    }

    const user = await kv.get(`user:${userId}`);
    const eventId = crypto.randomUUID();
    const event = {
      id: eventId,
      coupleId,
      type,
      title: String(title).trim(),
      date,
      notes: notes ? String(notes).trim() : "",
      createdBy: userId,
      createdByName: user?.displayName || "Partner",
      createdAt: new Date().toISOString(),
    };

    await kv.set(`calendar_event:${coupleId}:${eventId}`, event);

    // Check if a push reminder applies today (5/3/1/0 days before)
    processCalendarReminders(sendFcmPush, coupleId).catch((err) => {
      console.error(`[Calendar] Post-create reminder check failed:`, err);
    });

    return c.json({ success: true, event });
  } catch (error: any) {
    console.error(`[Calendar] Error creating event:`, error);
    return c.json({ error: error.message || "Failed to create calendar event" }, 500);
  }
});

app.get("/make-server-494d91eb/calendar/:coupleId/event/:eventId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    const eventId = c.req.param("eventId");

    const event = await kv.get(`calendar_event:${coupleId}:${eventId}`);
    if (!event) {
      return c.json({ error: "Event not found" }, 404);
    }

    return c.json({ event });
  } catch (error: any) {
    console.error(`[Calendar] Error getting event:`, error);
    return c.json({ error: error.message || "Failed to get calendar event" }, 500);
  }
});

// Daily cron: send FCM reminders 5, 3, 1, and 0 days before each event
app.post("/make-server-494d91eb/calendar/process-reminders", async (c) => {
  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
      const provided = c.req.header("x-cron-secret");
      if (provided !== cronSecret) {
        return c.json({ error: "Unauthorized" }, 401);
      }
    }

    const result = await processCalendarReminders(sendFcmPush);
    return c.json({ success: true, ...result });
  } catch (error: any) {
    console.error(`[Calendar] process-reminders failed:`, error);
    return c.json({ error: error.message || "Failed to process calendar reminders" }, 500);
  }
});

app.delete("/make-server-494d91eb/calendar/:coupleId/:eventId", async (c) => {
  try {
    const coupleId = c.req.param("coupleId");
    const eventId = c.req.param("eventId");
    const userId = c.req.query("userId");

    if (!coupleId || !eventId || !userId) {
      return c.json({ error: "Couple ID, event ID, and user ID are required" }, 400);
    }

    const event = await kv.get(`calendar_event:${coupleId}:${eventId}`);
    if (!event) {
      return c.json({ error: "Event not found" }, 404);
    }

    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) {
      return c.json({ error: "Couple not found" }, 404);
    }

    if (userId !== couple.user1Id && userId !== couple.user2Id) {
      return c.json({ error: "User is not part of this couple" }, 403);
    }

    await kv.del(`calendar_event:${coupleId}:${eventId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error(`[Calendar] Error deleting event:`, error);
    return c.json({ error: error.message || "Failed to delete calendar event" }, 500);
  }
});

// ===== END PARTNER NEEDS & CALENDAR =====

// 404 handler
app.notFound((c) => {
  console.log(`[404] Route not found: ${c.req.url}`);
  return c.json({ error: "Not found" }, 404);
});

// Start the server with error handling
Deno.serve(async (req: Request) => {
  try {
    // Log the incoming request
    const url = new URL(req.url);
    console.log(`[Server] ${req.method} ${url.pathname}`);
    
    // Handle the request with Hono
    const response = await app.fetch(req);
    
    // Ensure Content-Type is set
    if (!response.headers.get('Content-Type')) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Content-Type', 'application/json');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }
    
    return response;
  } catch (error: any) {
    console.error('[Server] Unhandled error:', error);
    console.error('[Server] Error stack:', error?.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        }
      }
    );
  }
});