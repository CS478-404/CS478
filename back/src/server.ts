import express from "express";
import { z } from "zod";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import crypto from "crypto";
import * as argon2 from "argon2";
import cookieParser from "cookie-parser";
import type { CookieOptions } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

sqlite3.verbose(); // enable better error messages

const db: Database = await open({
    filename: process.env.DATABASE_FILE ?? "../database.db",
    driver: sqlite3.Database,
});

await db.get("PRAGMA foreign_keys = ON");
await db.run(
    "CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL, email TEXT NOT NULL UNIQUE)"
);
await db.run(
  "CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, username TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE)",
);

export let app = express();

app.set("trust proxy", 1);
app.use(express.static("public"));
app.use(express.json({ limit: "1kb" }));
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-origin" },
  }),
);
app.use(
    rateLimit({
        windowMs: 60_000,
        limit: 300,
        standardHeaders: true,
        legacyHeaders: false,
    })  
);

let limiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later." },
});

/*
Auth Schemas & Helpers
*/
let credentialsSchema = z.object({
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    password: z.string().min(8).max(100),
    email: z.string().email().max(254),
}).strict();

let loginSchema = z.object({
    identifier: z.string().min(1),
    password: z.string().min(8).max(100),
}).strict();

function parseError(zodError: z.ZodError): string[] {
    let { formErrors, fieldErrors } = zodError.flatten();
    return [...formErrors, ...Object.entries(fieldErrors).map(([property, message]) => `${property}: ${message}`)];
}

type Session = {
    token: string;
    id: number;
    username: string;
    email: string;
    created_at: string;
};

function getRandomToken() {
    return crypto.randomBytes(32).toString("hex");
}

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
};

/* 
post request handlers
*/
app.post("/api/register", limiter, async (req, res) => {
  let result = credentialsSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: parseError(result.error) });
  }

  let { username, password, email } = result.data;

  try {
    let existing = await db.get<{ username: string }>(
      "SELECT username FROM users WHERE username = ? OR email = ?",
      [username, email],
    );
    if (existing) return res.status(409).json({ error: "username or email already taken" });
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }

  let password_hash = await argon2.hash(password, { type: argon2.argon2id });

  try {
    await db.run("INSERT INTO users(username, password_hash, email) VALUES(?, ?, ?)", [
      username,
      password_hash,
      email,
    ]);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }

  let token = getRandomToken();

  try {
    await db.run("DELETE FROM sessions WHERE username = ?", [username]);

    await db.run(
      "INSERT INTO sessions(token, username, created_at) VALUES(?, ?, ?)",
      [token, username, new Date().toISOString()],
    );
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }

  res.cookie("token", token, cookieOptions);
  res.cookie("username", username, { ...cookieOptions, httpOnly: false });
  return res.status(201).json({ username });
});

app.post("/api/login", limiter, async (req, res) => {
  let result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ errors: parseError(result.error) });
  }

  let { identifier, password } = result.data;
  let user;

  try {
    user = await db.get<{ username: string; password_hash: string }>(
      "SELECT username, password_hash FROM users WHERE username = ? OR email = ?",
      [identifier, identifier],
    );
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }

  if (!user) return res.status(401).json({ error: "invalid credentials" });

  let correct = await argon2.verify(user.password_hash, password);

  if (!correct) return res.status(401).json({ error: "invalid credentials" });

  let token = getRandomToken();

  try {
    await db.run("DELETE FROM sessions WHERE username = ?", [user.username]);

    await db.run(
      "INSERT INTO sessions(token, username, created_at) VALUES(?, ?, ?)",
      [token, user.username, new Date().toISOString()],
    );
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }

  res.cookie("token", token, cookieOptions);
  res.cookie("username", user.username, { ...cookieOptions, httpOnly: false });
  return res.json({ username: user.username });
});

export function startServer() {
  let port = 3000;
  let host = "127.0.0.1";
  let protocol = "http";

  app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
  });
}

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  startServer();
}
