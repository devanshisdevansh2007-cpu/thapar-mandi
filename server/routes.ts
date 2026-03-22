import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth } from "./auth";
import passport from "passport";
import { pool } from "./db";

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

  function isNotBlocked(req: any, res: any, next: any) {
    if (req.user?.blocked) {
      return res.status(403).json({ message: "You are blocked" });
    }
    next();
  }

  async function isUserBlocked(user1: number, user2: number) {
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

  // ================= AUTH =================

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    if (req.user!.blocked) {
      return res.status(403).json({ message: "You are blocked" });
    }
    const { password, ...safeUser } = req.user!;
    res.json(safeUser);
  });

  app.post("/auth/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
      });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password, ...safeUser } = req.user!;
    res.json(safeUser);
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

  // ================= CHAT =================

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
      `INSERT INTO messages (chat_id, sender_id, text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [chatId, senderId, text]
    );

    res.json(result.rows[0]);
  });

  return httpServer;
}
