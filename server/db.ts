import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";


const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
pool.query("SELECT NOW()")
  .then(() => console.log("DATABASE CONNECTED"))
  .catch(err => console.error("DATABASE FAILED", err));
export const db = drizzle(pool, { schema });
