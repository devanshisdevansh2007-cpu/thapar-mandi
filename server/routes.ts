import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, hashPassword } from "./auth";
import passport from "passport";
import { z } from "zod";
import { pool } from "./db";
import { generateOTP } from "./otp";
import { sendOTPEmail } from "./email";
import { saveOTP, verifyOTP } from "./otpStore";
export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});
  app.put("/api/user/hostel", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

  const { hostel } = req.body;

  if (!hostel)
    return res.status(400).json({ message: "Hostel is required" });

  const updatedUser = await storage.updateUser(req.user!.id, { hostel });

if (!updatedUser) {
  return res.status(404).json({ message: "User not found" });
}
  const { password, ...userWithoutPassword } = updatedUser!;
  res.json(userWithoutPassword);
});
 app.post(api.auth.signup.path, async (req, res) => {
  try {
    const input = api.auth.signup.input.parse(req.body);

    const { otp, confirmPassword, ...rest } = input;
    const valid = verifyOTP(rest.email, otp);

    if (!valid) {
      return res.status(400).json({ message: "Email not verified" });
    }
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(input.password);
      let role = "user";

      if (
        input.email === "dkaushik_be25@thapar.edu" ||
        input.email === "psadhwani_be25@thapar.edu"
      ) {
        role = "admin";
      }

      const user = await storage.createUser({
        name: input.name,
        email: input.email,
        phoneNumber: input.phoneNumber,
        password: hashedPassword,
        hostel: input.hostel,
        role: role,
      });
      req.login(user, (err) => {
        if (err) throw err;
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({
            message: err.errors[0].message,
            field: err.errors[0].path.join("."),
          });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

app.post("/api/send-otp", async (req, res) => {
   console.log("OTP route hit");
  const { email } = req.body;
    if (!email.endsWith("@thapar.edu")) {
    return res.status(400).json({ message: "Use your Thapar email" });
  }
  const otp = generateOTP();

  saveOTP(email, otp);

  try {
  await sendOTPEmail(email, otp);
  res.json({ success: true });
} catch (err) {
  console.error(err);
  res.status(500).json({ message: "Failed to send OTP" });
}

  
});

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const valid = verifyOTP(email, otp);

  if (!valid) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  res.json({ verified: true });
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
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });
    const { password, ...userWithoutPassword } = req.user!;
    res.status(200).json(userWithoutPassword);
  });

  // Items
  app.get(api.items.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const items = await storage.getItems(search);

    // Fetch sellers
    const itemsWithSellers = await Promise.all(
      items.map(async (item) => {
        const seller = await storage.getUser(item.sellerId);
        const { password, ...sellerWithoutPassword } = seller!;
        return { ...item, seller: sellerWithoutPassword };
      }),
    );

    res.status(200).json(itemsWithSellers);
  });

  app.get(api.items.myListings.path, async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });
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
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

  try {
    const input = api.items.create.input.parse(req.body);
    const item = await storage.createItem({
      ...input,
      sellerId: req.user!.id,
    });
    res.status(201).json(item);
  } catch (err) {
    console.error("CREATE ITEM ERROR:", err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});

  app.put(api.items.update.path, async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const id = Number(req.params.id);
      const item = await storage.getItem(id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      if (item.sellerId !== req.user!.id)
        return res.status(401).json({ message: "Unauthorized" });

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
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    const id = Number(req.params.id);
    const item = await storage.getItem(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.sellerId !== req.user!.id)
      return res.status(401).json({ message: "Unauthorized" });

    await storage.deleteItem(id);
    res.status(204).end();
  });
// ================= CHAT =================

// Create chat
app.post("/api/chat/create", async (req, res) => {
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

  // CHAT EXISTS → update item
  if (existing.rows.length > 0) {

    const updated = await pool.query(
      `UPDATE chats
       SET item_id = $1
       WHERE id = $2
       RETURNING *`,
      [itemId, existing.rows[0].id]
    );

    return res.json(updated.rows[0]);
  }

  // CREATE NEW CHAT
  const result = await pool.query(
    `INSERT INTO chats (item_id, buyer_id, seller_id)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [itemId, buyerId, sellerId]
  );

  res.json(result.rows[0]);
});

// Send message
app.post("/api/chat/send", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

  const { chatId, message } = req.body;
  const senderId = req.user!.id;

  const result = await pool.query(
    `INSERT INTO messages (chat_id, sender_id, message, read)
     VALUES ($1,$2,$3,false)
     RETURNING *`,
    [chatId, senderId, message]
  );

  res.json(result.rows[0]);
});

  // Mark messages as read
app.post("/api/chat/:chatId/read", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

  const { chatId } = req.params;
  const userId = req.user!.id;

  await pool.query(
    `UPDATE messages
     SET read = true
     WHERE chat_id = $1
     AND sender_id != $2`,
    [chatId, userId]
  );

  res.json({ success: true });
});

// Get messages
app.get("/api/chat/:chatId", async (req, res) => {
  const { chatId } = req.params;

  try {
    // 1. Get messages
    const messagesResult = await pool.query(
      `SELECT * FROM messages
       WHERE chat_id=$1
       ORDER BY created_at ASC`,
      [chatId]
    );

    // 2. Get chat (to find item_id)
    const chatResult = await pool.query(
      `SELECT * FROM chats WHERE id=$1`,
      [chatId]
    );

    const chat = chatResult.rows[0];

    let product = null;

    // 3. Get product using item_id
    if (chat?.item_id) {
      const productResult = await pool.query(
        `SELECT id, title, price, image FROM items WHERE id=$1`,
        [chat.item_id]
      );

      product = productResult.rows[0];
    }

    // 4. Send response
    res.json({
      messages: messagesResult.rows,
      product,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
  

// Get user chats (Inbox)
app.get("/api/chat/user/me", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

  const userId = req.user!.id;

const result = await pool.query(
`
SELECT 
  chats.id,
  chats.item_id,
  items.title AS item_title,
  users.name AS other_user,
  last_msg.message AS last_message,

  COUNT(DISTINCT messages.id) FILTER (
    WHERE messages.read = false
    AND messages.sender_id != $1
  ) AS unread_count

FROM chats

LEFT JOIN items 
  ON chats.item_id = items.id

LEFT JOIN users 
  ON users.id =
    CASE
      WHEN chats.buyer_id = $1 THEN chats.seller_id
      ELSE chats.buyer_id
    END

LEFT JOIN messages
  ON messages.chat_id = chats.id

LEFT JOIN LATERAL (
  SELECT message
  FROM messages
  WHERE messages.chat_id = chats.id
  ORDER BY id DESC
  LIMIT 1
) last_msg ON true

WHERE chats.buyer_id = $1 OR chats.seller_id = $1

GROUP BY chats.id, chats.item_id, items.title, users.name, last_msg.message, chats.created_at

ORDER BY chats.created_at DESC
`,
[userId]
);


  res.json(result.rows);
});
  return httpServer;
}
