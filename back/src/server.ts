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
import cors from "cors";

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

app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"], credentials: true }));
app.set("trust proxy", 1);
app.use(express.json({ limit: "1kb" }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "http://127.0.0.1:3000", "http://localhost:3000"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
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

async function getAuthUsername(req: express.Request): Promise<string | null> {
  const token = (req as any).cookies?.token as string | undefined;
  
  if (!token) return null;

  try {
    const session = await db.get<{ username: string }>(
      "SELECT username FROM sessions WHERE token = ?",
      [token],
    );
    return session?.username ?? null;
  } catch {
    return null;
  }
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
Comments API
*/

const commentCreateSchema = z.object({
  message: z.string().trim().min(1, "message is required").max(500, "message too long"),
  parentId: z.number().int().positive().optional(),
});

const voteSchema = z.object({
  // 1 = upvote, -1 = downvote, 0 = clear vote
  value: z.number().int().refine((v) => v === 1 || v === -1 || v === 0, "invalid vote value"),
});

/*
get request handlers
*/

app.get("/api/meals", async (req, res) => {
  const meals = await db.all(`
    SELECT id, strTags, strCategory, strMealThumb, strMeal FROM meals
  `);
  res.json(meals ?? []);
});

app.get("/api/ingredients", async (req, res) => {
  const ingredients = await db.all(`SELECT * FROM ingredients`);
  res.json(ingredients ?? []);
})

app.get("/api/recipe/:id/ingredients", async (req, res) => {
  const recipeId = Number(req.params.id);
  if (!Number.isFinite(recipeId)) return res.status(400).json({ error: "invalid recipe id" });

  try {
    const ingredients = await db.all(
      `
      SELECT
        i.name as name,
        mi.measure as measure
      FROM meal_ingredients mi
      JOIN ingredients i ON i.id = mi.idIngredient
      WHERE mi.idMeal = ?
      ORDER BY i.name ASC
      `,
      [recipeId],
    );

    return res.json(Array.isArray(ingredients) ? ingredients : []);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

app.get("/api/recipe/:id", async (req, res) => {
  let recipeId = req.params.id; 
  try {
    let recipe = await db.get("SELECT * FROM meals WHERE id = ?", [recipeId]);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  } 
});

app.get("/api/ingredient/:id", async (req, res) => {
  let ingredientId = req.params.id; 
  try {
    let ingredient = await db.get("SELECT * FROM ingredients WHERE id = ?", [ingredientId]);
    if (!ingredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.json(ingredient);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  } 
});

app.get("/api/recipe/:id/comments", async (req, res) => {
  const recipeId = Number(req.params.id);
  if (!Number.isFinite(recipeId)) return res.status(400).json({ error: "invalid recipe id" });

  const currentUser = await getAuthUsername(req);

  try {
    const rows = await db.all(
      `
      SELECT
        c.id,
        c.recipe_id as recipeId,
        c.username,
        c.parent_id as parentId,
        c.message,
        c.created_at as createdAt,
        COALESCE(SUM(cv.value), 0) as score,
        MAX(CASE WHEN cv.username = ? THEN cv.value END) as myVote
      FROM comments c
      LEFT JOIN comment_votes cv ON cv.comment_id = c.id
      WHERE c.recipe_id = ?
      GROUP BY c.id
      ORDER BY datetime(c.created_at) ASC
      `,
      [currentUser ?? "", recipeId],
    );

    return res.json(rows ?? []);
  } catch (err) {
    const error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
});

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

app.post("/api/recipe/:id/comments", async (req, res) => {
  const recipeId = Number(req.params.id);

  if (!Number.isFinite(recipeId)) return res.status(400).json({ error: "invalid recipe id" });

  const username = await getAuthUsername(req);

  if (!username) return res.status(401).json({ error: "login required" });

  const parsed = commentCreateSchema.safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ errors: parseError(parsed.error) });

  const { message, parentId } = parsed.data;

  try {
    if (parentId) {
      const parent = await db.get<{ id: number; recipe_id: number }>(
        "SELECT id, recipe_id FROM comments WHERE id = ?",
        [parentId],
      );

      if (!parent) return res.status(404).json({ error: "parent comment not found" });

      if (parent.recipe_id !== recipeId) return res.status(400).json({ error: "invalid parent for recipe" });
    }

    const createdAt = new Date().toISOString();
    const result = await db.run(
      "INSERT INTO comments(recipe_id, username, parent_id, message, created_at) VALUES(?, ?, ?, ?, ?)",
      [recipeId, username, parentId ?? null, message, createdAt],
    );

    const inserted = await db.get(
      `
      SELECT
        c.id,
        c.recipe_id as recipeId,
        c.username,
        c.parent_id as parentId,
        c.message,
        c.created_at as createdAt,
        0 as score,
        NULL as myVote
      FROM comments c
      WHERE c.id = ?
      `,
      [result.lastID],
    );

    return res.status(201).json(inserted);
  } catch (err) {
    const error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
});

app.post("/api/comments/:commentId/vote", async (req, res) => {
  const commentId = Number(req.params.commentId);

  if (!Number.isFinite(commentId)) return res.status(400).json({ error: "invalid comment id" });

  const username = await getAuthUsername(req);

  if (!username) return res.status(401).json({ error: "login required" });

  const parsed = voteSchema.safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ errors: parseError(parsed.error) });

  const { value } = parsed.data;

  try {
    const comment = await db.get<{ id: number }>("SELECT id FROM comments WHERE id = ?", [commentId]);
    if (!comment) return res.status(404).json({ error: "comment not found" });

    if (value === 0) {
      await db.run("DELETE FROM comment_votes WHERE comment_id = ? AND username = ?", [commentId, username]);
    } else {
      await db.run(
        `
        INSERT INTO comment_votes(comment_id, username, value, created_at)
        VALUES(?, ?, ?, ?)
        ON CONFLICT(comment_id, username) DO UPDATE SET value = excluded.value, created_at = excluded.created_at
        `,
        [commentId, username, value, new Date().toISOString()],
      );
    }

    const updated = await db.get<{ score: number; myVote: number | null }>(
      `
      SELECT
        COALESCE(SUM(cv.value), 0) as score,
        MAX(CASE WHEN cv.username = ? THEN cv.value END) as myVote
      FROM comment_votes cv
      WHERE cv.comment_id = ?
      `,
      [username, commentId],
    );

    return res.json({ commentId, score: updated?.score ?? 0, myVote: updated?.myVote ?? null });
  } catch (err) {
    const error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
});

/*
Start Server
*/

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
