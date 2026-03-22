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

  // 🔒 ADMIN MIDDLEWARE
  function isAdmin(req: any, res: any, next: any) {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    next();
  }

  // 🔒 BLOCK CHECK
  function isNotBlocked(req: any, res: any, next: any) {
    if (req.user?.blocked) {
      return res.status(403).json({ message: "You are blocked" });
    }
    next();
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

  // 🔥 FIXED: UPDATE HOSTEL (THIS WAS YOUR BUG)
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

  // ================= ADMIN =================

  app.delete("/api/admin/item/:id", isAdmin, async (req, res) => {
    await storage.deleteItem(Number(req.params.id));
    res.json({ success: true });
  });

  app.put("/api/admin/item/:id", isAdmin, async (req, res) => {
    const updated = await storage.updateItem(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.post("/api/admin/block-user/:id", isAdmin, async (req, res) => {
    const userId = Number(req.params.id);

    if (req.user.id === userId) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    await storage.updateUser(userId, { blocked: true });
    res.json({ success: true });
  });

  app.post("/api/admin/unblock-user/:id", isAdmin, async (req, res) => {
    await storage.updateUser(Number(req.params.id), { blocked: false });
    res.json({ success: true });
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // ================= CHAT =================

  app.post("/api/chat/create", isNotBlocked, async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    const { itemId, sellerId } = req.body;
    const buyerId = req.user!.id;

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

  return httpServer;
}
