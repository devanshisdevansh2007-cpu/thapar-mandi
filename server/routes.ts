import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth } from "./auth";
import passport from "passport";
import { pool } from "./db";
import { verifyOTP, saveOTP } from "./otpStore";
import { generateOTP } from "./otp";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { sendOTPEmail } from "./email";
export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  setupAuth(app);

  function isAdmin(req: any, res: any, next: any) {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    next();
  }

async function isNotBlocked(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      `SELECT blocked FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    if (result.rows[0].blocked === true) {
      return res.status(403).json({ message: "You are blocked" });
    }

    next();

  } catch (err) {
    console.error("Block check failed:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
  const scryptAsync = promisify(scrypt);

// helper
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}
  async function isUserBlocked(user1: string, user2: string){
    const result = await pool.query(
      `SELECT 1 FROM blocked_users 
       WHERE 
         (blocker_id = $1 AND blocked_id = $2)
         OR
         (blocker_id = $2 AND blocked_id = $1)
       LIMIT 1`,
      [user1, user2]
    );

    return result.rows.length > 0;
  }
app.use(async (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    try {
      await pool.query(
        `UPDATE users SET last_seen = NOW() WHERE id = $1`,
        [req.user.id]
      );
    } catch (err) {
      console.error("last_seen update failed:", err);
    }
  }
  next();
});
  // ================= AUTH =================

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    if (req.user!.blocked) {
      return res.status(403).json({ message: "You are blocked" });
    }
    const { password, ...safeUser } = req.user!;
    res.json(safeUser);
  });
  app.post(api.auth.signup.path, async (req, res) => {
  try {
    const input = api.auth.signup.input.parse(req.body);

    const otpValid = await verifyOTP(input.email, input.otp);

    if (!otpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ ADD THIS
    const hashedPassword = await hashPassword(input.password);

    const user = await storage.createUser({
      ...input,
      password: hashedPassword, // ✅ FIX
      role: "user",             // ✅ FIX
    });

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Login after signup failed" });
      }

      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    });

  } catch (err: any) {
    console.error("Signup error:", err);
    res.status(400).json({ message: err.message || "Signup failed" });
  }
});

     app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("Generating OTP for:", email);

    // store OTP
    saveOTP(email, otp);

    // send email
    await sendOTPEmail(email, otp);

    console.log("OTP sent successfully");

    res.status(200).json({ success: true });

  } catch (error) {
    console.error("OTP ERROR:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
       });

app.post("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }

    // 🔥 Destroy session completely
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Session destroy failed" });
      }

      // 🔥 VERY IMPORTANT (this is what usually breaks logout)
      res.clearCookie("connect.sid", {
        path: "/",
      });

      return res.json({ message: "Logged out successfully" });
    });
  });
});

  app.get(api.auth.me.path, (req, res) => {
 if (!req.isAuthenticated()) {
    return res.status(401).json(null);
  }

  const { password, ...safeUser } = req.user!;
  return res.json(safeUser);
});

  // ================= USER =================

  app.put("/api/user/hostel", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { hostel } = req.body;
    if (!hostel) {
      return res.status(400).json({ message: "Hostel required" });
    }

    await storage.updateUser(req.user!.id, { hostel });
    res.json({ success: true });
  });


  // ================= ADMIN =================

// ✅ GET ALL USERS
app.get("/api/admin/users", isAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, role, blocked FROM users ORDER BY id DESC`
  );

  res.json(result.rows);
});

// ✅ BLOCK USER (GLOBAL BLOCK)
app.post("/api/admin/block-user/:id", isAdmin, async (req, res) => {
  try {
    const userId = req.params.id; // ✅ FIXED

    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await pool.query(
      `UPDATE users SET blocked = true WHERE id = $1`,
      [userId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Block error:", err);
    res.status(500).json({ message: "Server crashed" });
  }
});
// ✅ UNBLOCK USER
app.post("/api/admin/unblock-user/:id", isAdmin, async (req, res) => {
  try {
    const userId = req.params.id; // ✅ FIXED (no Number)

    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await pool.query(
      `UPDATE users SET blocked = false WHERE id = $1`,
      [userId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Unblock error:", err);
    res.status(500).json({ message: "Server crashed" });
  }
});

// ✅ DELETE ITEM (ADMIN POWER)
app.delete("/api/admin/item/:id", isAdmin, async (req, res) => {
  const id = Number(req.params.id);

  await storage.deleteItem(id);

  res.json({ success: true });
});

  // ✅ RESOLVE REPORT (DELETE REPORT)
app.post("/api/admin/reports/:id/resolve", isAdmin, async (req, res) => {
  try {
    const reportId = req.params.id;

    await pool.query(
      `DELETE FROM reports WHERE id = $1`,
      [reportId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Resolve report error:", err);
    res.status(500).json({ message: "Failed to resolve report" });
  }
});

  
  // ================= ITEMS =================

  app.get(api.items.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const items = await storage.getItems(search);

    const result = await Promise.all(
      items.map(async (item) => {
        const seller = await storage.getUser(item.sellerId);
        if (!seller) return { ...item, seller: null };

        const { password, phoneNumber, ...safeSeller } = seller;
        return { ...item, seller: safeSeller };
      })
    );

    res.json(result);
  });

  app.get(api.items.get.path, async (req, res) => {
    const item = await storage.getItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });

    const seller = await storage.getUser(item.sellerId);
    if (!seller) return res.json({ ...item, seller: null });

    const { password, phoneNumber, ...safeSeller } = seller;
    res.json({ ...item, seller: safeSeller });
  });

  app.post(api.items.create.path, isNotBlocked, async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    const input = api.items.create.input.parse(req.body);

    const item = await storage.createItem({
      ...input,
      sellerId: req.user!.id,
    });

    res.json(item);
  });

  app.delete(api.items.delete.path, isNotBlocked, async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    const id = Number(req.params.id);
    const item = await storage.getItem(id);

    if (!item || item.sellerId !== req.user!.id)
      return res.status(403).json({ message: "Unauthorized" });

    await storage.deleteItem(id);
    res.json({ success: true });
  });
  
app.get("/api/my-listings", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = req.user!.id;

    const items = await pool.query(
      `SELECT * FROM items WHERE seller_id = $1 ORDER BY id DESC`,
      [userId]
    );

    res.json(items.rows);

  } catch (err) {
    console.error("MY LISTINGS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
  // ================= USER BLOCK =================

  app.post("/api/block/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const blockerId = req.user!.id;
    const blockedId = Number(req.params.id);

    if (blockerId === blockedId) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    await pool.query(
      `INSERT INTO blocked_users (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [blockerId, blockedId]
    );

    res.json({ success: true });
  });

  // ✅ FIXED UNBLOCK (no reverse delete)
  app.delete("/api/unblock/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const otherUserId = Number(req.params.id);

    await pool.query(
      `DELETE FROM blocked_users 
       WHERE blocker_id = $1 AND blocked_id = $2`,
      [userId, otherUserId]
    );

    res.json({ success: true });
  });

  // ✅ NEW API (CRITICAL FIX)
  app.get("/api/is-blocked/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const otherUserId = Number(req.params.id);

    const result = await pool.query(
      `SELECT 1 FROM blocked_users 
       WHERE blocker_id = $1 AND blocked_id = $2`,
      [userId, otherUserId]
    );

    res.json({ blocked: result.rows.length > 0 });
  });

app.post("/api/reports", async (req, res) => {
  try {
    console.log("API HIT HOI");
    console.log("BODY:", req.body);

    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });

      
    }

    const { reported_user_id, reported_item_id, reason } = req.body;
    const reporter_id = req.user.id;
    const itemId = reported_item_id ? String(reported_item_id) : null;
const userId = reported_user_id ? String(reported_user_id) : null;

    if (!reason) {
      return res.status(400).json({ error: "Reason is required" });
    }

    if (!reported_user_id && !reported_item_id) {
      return res.status(400).json({ error: "Invalid report" });
    }

    // 🔥 INSERT HERE
   const result = await pool.query(
      `INSERT INTO reports (reporter_id, reported_user_id, reported_item_id, reason)
       VALUES ($1, $2, $3, $4) RETURNING *`,
    [reporter_id, userId, itemId, reason]
    );

    console.log("INSERT SUCCESS:", result.rows[0]);

    res.json({ success: true });

  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ error: "Failed to create report" });
  }
});
 
  app.get("/api/admin/reports", isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM reports ORDER BY id DESC`
    );

    console.log("REPORTS FETCHED:", result.rows);

    res.json(result.rows);

  } catch (err) {
    console.error("FETCH REPORTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});
  // ================= CHAT =================
app.get("/api/chat", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const userId = req.user!.id;

 const result = await pool.query(
  `SELECT 
    chats.id,
    items.title AS item_title,
    users.name AS other_user,

    -- ✅ ADD THIS
    (
      users.last_seen > NOW() - INTERVAL '2 minutes'
    ) AS is_online,

    (
      SELECT message
      FROM messages
      WHERE chat_id = chats.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) AS last_message,

    0 AS unread_count

  FROM chats
  JOIN items ON items.id = chats.item_id
  JOIN users ON users.id = 
    CASE 
      WHEN chats.buyer_id = $1 THEN chats.seller_id
      ELSE chats.buyer_id
    END
  WHERE chats.buyer_id = $1 OR chats.seller_id = $1
  ORDER BY chats.id DESC`,
  [userId]
);

  res.json(result.rows);
});
  
  app.get("/api/chat/:chatId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const chatId = Number(req.params.chatId);
    const userId = req.user!.id;

    const chatRes = await pool.query(
      `SELECT * FROM chats WHERE id = $1`,
      [chatId]
    );

    if (chatRes.rows.length === 0) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const chat = chatRes.rows[0];

    const otherUser =
      chat.buyer_id === userId ? chat.seller_id : chat.buyer_id;

    const blocked = await isUserBlocked(userId, otherUser);

    if (blocked) {
      return res.status(403).json({ message: "Blocked" });
    }

    const messages = await pool.query(
      `SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`,
      [chatId]
    );

    res.json(messages.rows);
  });

  app.post("/api/chat/create", isNotBlocked, async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    const { itemId, sellerId } = req.body;
    const buyerId = req.user!.id;

    const blocked = await isUserBlocked(buyerId, sellerId);
    if (blocked) {
      return res.status(403).json({ message: "User is blocked" });
    }

    const existing = await pool.query(
      `SELECT * FROM chats
       WHERE (buyer_id=$1 AND seller_id=$2)
       OR (buyer_id=$2 AND seller_id=$1)
       LIMIT 1`,
      [buyerId, sellerId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO chats (item_id, buyer_id, seller_id)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [itemId, buyerId, sellerId]
    );

    res.json(result.rows[0]);
  });

  app.post("/api/message/send", isNotBlocked, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { chatId, text } = req.body;
    const senderId = req.user!.id;

    const chatRes = await pool.query(
      `SELECT * FROM chats WHERE id = $1`,
      [chatId]
    );

    if (chatRes.rows.length === 0) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const chat = chatRes.rows[0];

    const receiverId =
      chat.buyer_id === senderId ? chat.seller_id : chat.buyer_id;

    const blocked = await isUserBlocked(senderId, receiverId);

    if (blocked) {
      return res.status(403).json({ message: "User is blocked" });
    }

    const result = await pool.query(
      `INSERT INTO messages (chat_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [chatId, senderId, text]
    );

    res.json(result.rows[0]);
  });

  return httpServer;
}
