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

  // 🔒 BLOCK CHECK MIDDLEWARE
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
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  // ================= ITEMS =================

  // 🔥 GET ALL ITEMS (SAFE + SEARCH)
  app.get(api.items.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const items = await storage.getItems(search);

    const result = await Promise.all(
      items.map(async (item) => {
        const seller = await storage.getUser(item.sellerId);
        const { password, phoneNumber, ...safeSeller } = seller!;
        return { ...item, seller: safeSeller };
      })
    );

    res.json(result);
  });

  // 🔥 GET SINGLE ITEM (SAFE)
  app.get(api.items.get.path, async (req, res) => {
    const item = await storage.getItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });

    const seller = await storage.getUser(item.sellerId);
    const { password, phoneNumber, ...safeSeller } = seller!;

    res.json({ ...item, seller: safeSeller });
  });

  // 🔥 CREATE ITEM
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

  // 🔥 DELETE OWN ITEM
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

  // 🔥 DELETE ANY ITEM
  app.delete("/api/admin/item/:id", isAdmin, async (req, res) => {
    await storage.deleteItem(Number(req.params.id));
    res.json({ success: true });
  });

  // 🔥 EDIT ANY ITEM
  app.put("/api/admin/item/:id", isAdmin, async (req, res) => {
    const updated = await storage.updateItem(Number(req.params.id), req.body);
    res.json(updated);
  });

  // 🔥 BLOCK USER (NO SELF BLOCK)
  app.post("/api/admin/block-user/:id", isAdmin, async (req, res) => {
    const userId = Number(req.params.id);

    if (req.user.id === userId) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    await storage.updateUser(userId, { blocked: true });
    res.json({ success: true });
  });

  // 🔥 GET ALL USERS
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
