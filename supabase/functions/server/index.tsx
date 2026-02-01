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
      // Add message to gallery array instead of overwriting
      const messageGalleryKey = `${userPrefix}MessageGallery`;
      const existingMessageGallery = existingCard[messageGalleryKey] || [];
      const newMessageEntry = {
        message,
        timestamp: new Date().toISOString(),
        userId,
      };
      updates[messageGalleryKey] = [...existingMessageGallery, newMessageEntry];
      
      // Also update the single message field for backward compatibility
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

// ===== SHARK MODE ENDPOINTS =====

// Activate Shark Mode
app.post("/make-server-494d91eb/shark-mode/activate", async (c) => {
  try {
    const { coupleId, userId, durationDays, note } = await c.req.json();
    
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
    const { coupleId, userId, additionalDays } = await c.req.json();
    
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
    const { coupleId, userId } = await c.req.json();
    
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
    const { coupleId, userId, response } = await c.req.json();
    
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

// Start the server with error handling
Deno.serve({
  handler: async (req: Request) => {
    try {
      // Always return a response, no timeout to avoid connection closures
      const response = await app.fetch(req);
      
      // Ensure we always have proper headers
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
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: error?.message || 'Unknown error' }),
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
  },
  onError: (error) => {
    console.error('[Deno.serve] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Service error', message: error?.message || 'Unknown error' }),
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
  },
  onListen: ({ port, hostname }) => {
    console.log(`[Server] Listening on http://${hostname}:${port}`);
  }
});