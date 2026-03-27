import { items, users, type User, type InsertUser, type Item, type InsertItem } from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { or } from "drizzle-orm"; // 🔥 ADD THIS
const PostgresStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<Pick<User, "id" | "name" | "email" | "role" | "blocked">[]>;
  createItem(item: InsertItem & { sellerId: number }): Promise<Item>;
  getItem(id: number): Promise<Item | undefined>;
  getItems(search?: string): Promise<Item[]>;
  getItemsBySeller(sellerId: number): Promise<Item[]>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
 updateUserResetToken(userId: number, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
async getAllUsers() {
  const result = await pool.query("SELECT id, name, email, role, blocked FROM users");
  return result.rows;
}
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
  const [user] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();

  return user;
}
  async updateUserResetToken(userId: number, token: string, expiry: Date): Promise<void> {
  await db
    .update(users)
    .set({
      reset_token: token,
      reset_token_expiry: expiry,
    })
    .where(eq(users.id, userId));
}
  async getUserByResetToken(token: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.reset_token, token));

  return user;
}
  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
  await db
    .update(users)
    .set({
      password: newPassword,
      reset_token: null,
      reset_token_expiry: null,
    })
    .where(eq(users.id, userId));
}
  async createItem(insertItem: InsertItem & { sellerId: number }): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItems(search?: string): Promise<Item[]> {
  if (search) {
    return await db
      .select()
      .from(items)
      .where(
        or(
          ilike(items.title, `%${search}%`),
          ilike(items.description, `%${search}%`)
          // 👉 add category if exists:
          // ilike(items.category, `%${search}%`)
        )
      )
      .orderBy(desc(items.createdAt));
  }

  return await db.select().from(items).orderBy(desc(items.createdAt));
}

  async getItemsBySeller(sellerId: number): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.sellerId, sellerId)).orderBy(desc(items.createdAt));
  }

  async updateItem(id: number, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const [item] = await db.update(items).set(updateData).where(eq(items.id, id)).returning();
    return item;
  }

  async deleteItem(id: number): Promise<boolean> {
    const [item] = await db.delete(items).where(eq(items.id, id)).returning();
    return !!item;
  }
}

export const storage = new DatabaseStorage();
