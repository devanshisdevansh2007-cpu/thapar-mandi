import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, hashPassword } from "./auth";
import passport from "passport";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.post(api.auth.signup.path, async (req, res) => {
    try {
      const input = api.auth.signup.input.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({
        name: input.name,
        email: input.email,
        phoneNumber: input.phoneNumber,
        password: hashedPassword
      });

      req.login(user, (err) => {
        if (err) throw err;
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    const { password, ...userWithoutPassword } = req.user!;
    res.status(200).json(userWithoutPassword);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { password, ...userWithoutPassword } = req.user!;
    res.status(200).json(userWithoutPassword);
  });

  // Items
  app.get(api.items.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const items = await storage.getItems(search);
    
    // Fetch sellers
    const itemsWithSellers = await Promise.all(items.map(async (item) => {
      const seller = await storage.getUser(item.sellerId);
      const { password, ...sellerWithoutPassword } = seller!;
      return { ...item, seller: sellerWithoutPassword };
    }));
    
    res.status(200).json(itemsWithSellers);
  });

  app.get(api.items.myListings.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const items = await storage.getItemsBySeller(req.user!.id);
    res.status(200).json(items);
  });

  app.get(api.items.get.path, async (req, res) => {
    const item = await storage.getItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });
    
    const seller = await storage.getUser(item.sellerId);
    const { password, ...sellerWithoutPassword } = seller!;
    
    res.status(200).json({ ...item, seller: sellerWithoutPassword });
  });

  app.post(api.items.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const input = api.items.create.input.parse(req.body);
      const item = await storage.createItem({ ...input, sellerId: req.user!.id });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.items.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const id = Number(req.params.id);
      const item = await storage.getItem(id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      if (item.sellerId !== req.user!.id) return res.status(401).json({ message: "Unauthorized" });

      const input = api.items.update.input.parse(req.body);
      const updated = await storage.updateItem(id, input);
      res.status(200).json(updated!);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.items.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = Number(req.params.id);
    const item = await storage.getItem(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.sellerId !== req.user!.id) return res.status(401).json({ message: "Unauthorized" });

    await storage.deleteItem(id);
    res.status(204).end();
  });

  return httpServer;
}
