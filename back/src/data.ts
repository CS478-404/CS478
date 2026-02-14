import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

interface MealDbAPI {
    meals: Meal[];
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
    dateModified: string;
    [key: `strIngredient${number}`]: string;
    [key: `strMeasure${number}`]: string;
}

async function mealToDb() {
    sqlite3.verbose();
    let db: Database = await open({
        filename: "../database.db",
        driver: sqlite3.Database,
    });

    let alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    let totalMeals = 0;

    for (let letter of alphabet) {
        let res = await fetch(
            `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`
        );
        let data: MealDbAPI = await res.json();

        if (!data.meals) continue;

        for (let meal of data.meals) {
            try {
                await db.run(
                    `INSERT OR IGNORE INTO meals (strMeal, strCategory, strArea, strInstructions, 
                    strMealThumb, strTags, strYoutube, strSource, strImageSource, dateModified) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

                let result = await db.get(`SELECT last_insert_rowid() as id`);
                let mealId = result.id;

                for (let i = 1; i <= 20; i++) {
                    let ingredient = meal[`strIngredient${i}`];
                    let measure = meal[`strMeasure${i}`];

                    if (ingredient && ingredient.trim()) {
                        await db.run(`INSERT OR IGNORE INTO ingredients (name) VALUES (?)`, [ingredient.trim()]);
                        
                        let result = await db.get(`SELECT id FROM ingredients WHERE name = ?`, [ingredient.trim()]);
                        
                        await db.run(
                        `INSERT OR IGNORE INTO meal_ingredients (idMeal, idIngredient, measure) VALUES (?, ?, ?)`,
                        [mealId, result.id, measure?.trim() || ""]
                        );
                    }
                }

                totalMeals++;
            } catch (err) {
                console.error(`Error adding meal ${meal.strMeal}:`, err);
            }
        }
    }
    await db.close();
    console.log("Total meals inserted:", totalMeals);
}

mealToDb().catch((err) => {
    console.error("Error populating database:", err);
});