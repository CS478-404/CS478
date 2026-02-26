import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

interface MealDbAPI {
  meals: Meal[] | null;
}

interface Meal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  strSource: string | null;
  strImageSource: string | null;
  dateModified: string | null;
  [key: `strIngredient${number}`]: string;
  [key: `strMeasure${number}`]: string;
}

async function ensureSchema(db: Database) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idMeal TEXT,
      strMeal TEXT NOT NULL,
      strCategory TEXT,
      strArea TEXT,
      strInstructions TEXT,
      strMealThumb TEXT,
      strTags TEXT,
      strYoutube TEXT,
      strSource TEXT,
      strImageSource TEXT,
      strCreativeCommonsConfirmed TEXT,
      dateModified TEXT,
      rating INTEGER
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS meal_ingredients (
      idMeal INTEGER,
      idIngredient INTEGER,
      measure TEXT,
      PRIMARY KEY (idMeal, idIngredient),
      FOREIGN KEY (idMeal) REFERENCES meals(id),
      FOREIGN KEY (idIngredient) REFERENCES ingredients(id)
    );
  `);

  const mealsColumns: Array<{ name: string }> = await db.all(`PRAGMA table_info(meals)`);
  const hasIdMealColumn = mealsColumns.some((column) => column.name === "idMeal");

  if (!hasIdMealColumn) {
    await db.run(`ALTER TABLE meals ADD COLUMN idMeal TEXT`);
  }

  await db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_meals_idMeal_unique ON meals(idMeal)`);
}

async function mealToDb() {
  sqlite3.verbose();

  const dbPath = "./database.db";
  const db: Database = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.get("PRAGMA foreign_keys = ON");
  await ensureSchema(db);

  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  let totalMealsInserted = 0;
  let totalMealsSeen = 0;
  let totalErrors = 0;

  for (const letter of alphabet) {
    let response: Response;

    try {
      response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
    } catch (error) {
      totalErrors++;
      console.error(`Fetch failed for letter "${letter}":`, error);
      continue;
    }

    let apiData: MealDbAPI;

    try {
      apiData = (await response.json()) as MealDbAPI;
    } catch (error) {
      totalErrors++;
      console.error(`JSON parse failed for letter "${letter}":`, error);
      continue;
    }

    if (!apiData.meals || apiData.meals.length === 0) continue;

    for (const meal of apiData.meals) {
      totalMealsSeen++;

      try {
        const insertMealResult = await db.run(
          `INSERT OR IGNORE INTO meals
            (idMeal, strMeal, strCategory, strArea, strInstructions,
             strMealThumb, strTags, strYoutube, strSource, strImageSource, dateModified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          meal.idMeal,
          meal.strMeal,
          meal.strCategory,
          meal.strArea,
          meal.strInstructions,
          meal.strMealThumb,
          meal.strTags,
          meal.strYoutube,
          meal.strSource,
          meal.strImageSource,
          meal.dateModified
        );

        let internalMealId: number;

        if (insertMealResult.changes === 1 && typeof insertMealResult.lastID === "number") {
          internalMealId = insertMealResult.lastID;
          totalMealsInserted++;
        } else {
          const existingMealRow = await db.get<{ id: number }>(
            `SELECT id FROM meals WHERE idMeal = ?`,
            [meal.idMeal]
          );
          if (!existingMealRow) {
            throw new Error(`Meal row not found after INSERT OR IGNORE (idMeal=${meal.idMeal})`);
          }
          internalMealId = existingMealRow.id;
        }

        for (let ingredientIndex = 1; ingredientIndex <= 20; ingredientIndex++) {
          const ingredientRaw = meal[`strIngredient${ingredientIndex}`];
          const measureRaw = meal[`strMeasure${ingredientIndex}`];

          const ingredientName = ingredientRaw?.trim();
          const measureText = measureRaw?.trim() ?? "";

          if (!ingredientName) continue;

          await db.run(`INSERT OR IGNORE INTO ingredients (name) VALUES (?)`, [ingredientName]);

          const ingredientRow = await db.get<{ id: number }>(
            `SELECT id FROM ingredients WHERE name = ?`,
            [ingredientName]
          );
          if (!ingredientRow) {
            throw new Error(`Ingredient row not found after insert (name=${ingredientName})`);
          }

          await db.run(
            `INSERT OR IGNORE INTO meal_ingredients (idMeal, idIngredient, measure)
             VALUES (?, ?, ?)`,
            [internalMealId, ingredientRow.id, measureText]
          );
        }
      } catch (error) {
        totalErrors++;
        console.error(`Seeder error inserting meal "${meal.strMeal}" (idMeal=${meal.idMeal}):`, error);
      }
    }
  }

  await db.close();
  console.log(`DB: ${dbPath}`);
  console.log("Total meals fetched from API:", totalMealsSeen);
  console.log("Total new meals inserted:", totalMealsInserted);
  console.log("Total errors:", totalErrors);
}

mealToDb().catch((error) => {
  console.error("Seeder failed:", error);
  process.exit(1);
});
