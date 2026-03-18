import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

import { resend } from "./resend"; // your email setup (adjust path)
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "thapar-mandi-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await storage.getUserByEmail(email);

    // Always respond same (security)
    if (!user) {
      return res.json({ message: "If account exists, email sent" });
    }

    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await storage.updateUserResetToken(user.id, token, expiry);

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    await resend.emails.send({
    from: "Thapar Mandi <noreply@yourdomain.com>",
     
    to: email,
      subject: "Reset Password",
      html: `<p>Click here: <a href="${resetLink}">Reset Password</a></p>`
    });

    res.json({ message: "Reset link sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});
  app.post("/auth/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await storage.getUserByResetToken(token);

    if (!user || !user.reset_token_expiry || user.reset_token_expiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // 🔐 Use YOUR hashing system (scrypt)
    const hashedPassword = await hashPassword(newPassword);

    await storage.updateUserPassword(user.id, hashedPassword);

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
