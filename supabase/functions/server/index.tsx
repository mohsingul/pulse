import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 600,
    credentials: true,
  }),
);

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

// USER ROUTES
app.post("/make-server-494d91eb/users/create", async (c) => {
  try {
    const { username, password, displayName } = await c.req.json();
    
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
    const { username, password } = await c.req.json();
    
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

// Reset password endpoint
app.post("/make-server-494d91eb/users/reset-password", async (c) => {
  try {
    const { username, newPassword } = await c.req.json();
    
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
    const { userId } = await c.req.json();
    
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
    const { userId, code } = await c.req.json();
    
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
    
    // Delete couple mappings
    await kv.del(`couple:user:${couple.user1Id}`);
    await kv.del(`couple:user:${couple.user2Id}`);
    await kv.del(`couple:${coupleId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error unpairing: ${error}`);
    return c.json({ error: "Failed to unpair" }, 500);
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
    const coupleId = c.req.param("coupleId");
    const { userId, mood, message, doodle, intensity } = await c.req.json();
    
    const today = new Date().toISOString().split('T')[0];
    const existingCard = await kv.get(`today:${coupleId}:${today}`) || {};
    
    // Get couple info to determine user1 vs user2
    const couple = await kv.get(`couple:${coupleId}`);
    const isUser1 = couple.user1Id === userId;
    
    // Build update for this specific user
    const userPrefix = isUser1 ? 'user1' : 'user2';
    const updates: any = {};
    
    if (mood !== undefined) {
      updates[`${userPrefix}Mood`] = mood;
      updates[`${userPrefix}Intensity`] = intensity;
    }
    if (message !== undefined) {
      updates[`${userPrefix}Message`] = message;
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
    const coupleId = c.req.param("coupleId");
    const { userId, emoji } = await c.req.json();
    
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
app.post("/make-server-494d91eb/notifications/nudge", async (c) => {
  try {
    const { coupleId, senderId } = await c.req.json();
    
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
    
    // Store notification
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

    await kv.set(`notification:${notificationId}`, notification);
    await kv.set(`notification:user:${receiverId}:${notificationId}`, notificationId);

    return c.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.log(`Error sending nudge notification: ${error}`);
    return c.json({ error: "Failed to send nudge" }, 500);
  }
});

app.post("/make-server-494d91eb/notifications/mood-update", async (c) => {
  try {
    const { coupleId, senderId, mood, intensity } = await c.req.json();
    
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
    
    // Store notification
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

    await kv.set(`notification:${notificationId}`, notification);
    await kv.set(`notification:user:${receiverId}:${notificationId}`, notificationId);

    return c.json({
      success: true,
      notification,
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
    
    // Store notification
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

    await kv.set(`notification:${notificationId}`, notification);
    await kv.set(`notification:user:${receiverId}:${notificationId}`, notificationId);

    return c.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.log(`Error sending message update notification: ${error}`);
    return c.json({ error: "Failed to send message update notification" }, 500);
  }
});

app.post("/make-server-494d91eb/notifications/doodle-update", async (c) => {
  try {
    const { coupleId, senderId, doodle } = await c.req.json();
    
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
    
    // Store notification with doodle data
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

    await kv.set(`notification:${notificationId}`, notification);
    await kv.set(`notification:user:${receiverId}:${notificationId}`, notificationId);

    return c.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.log(`Error sending doodle update notification: ${error}`);
    return c.json({ error: "Failed to send doodle update notification" }, 500);
  }
});

app.get("/make-server-494d91eb/notifications/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    
    if (!userId) {
      return c.json({ notifications: [] });
    }
    
    const notificationIds = await kv.getByPrefix(`notification:user:${userId}:`);
    
    if (!notificationIds || notificationIds.length === 0) {
      return c.json({ notifications: [] });
    }
    
    const notifications = await Promise.all(
      notificationIds.map(async (id: string) => {
        try {
          return await kv.get(`notification:${id}`);
        } catch (err) {
          console.log(`Error fetching notification ${id}: ${err}`);
          return null;
        }
      })
    );

    // Filter out nulls and sort by timestamp descending
    const validNotifications = notifications
      .filter((n) => n !== null && n !== undefined)
      .sort((a: any, b: any) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    return c.json({ notifications: validNotifications });
  } catch (error) {
    console.log(`Error getting notifications: ${error}`);
    return c.json({ error: "Failed to get notifications" }, 500);
  }
});

app.post("/make-server-494d91eb/notifications/:notificationId/read", async (c) => {
  try {
    const notificationId = c.req.param("notificationId");
    const notification = await kv.get(`notification:${notificationId}`);
    
    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }

    notification.read = true;
    await kv.set(`notification:${notificationId}`, notification);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error marking notification as read: ${error}`);
    return c.json({ error: "Failed to mark notification as read" }, 500);
  }
});

// Global error handler
app.onError((err, c) => {
  console.error(`[Server Error] ${err.message}`, err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) => {
  console.log(`[404] Route not found: ${c.req.url}`);
  return c.json({ error: "Not found" }, 404);
});

Deno.serve(app.fetch);