CREATE TABLE meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    rating INTEGER,
    createdBy TEXT
);

CREATE TABLE ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
);

CREATE TABLE meal_ingredients (
    idMeal INTEGER,
    idIngredient INTEGER,
    measure TEXT,
    PRIMARY KEY (idMeal, idIngredient),
    FOREIGN KEY (idMeal) REFERENCES meals(id),
    FOREIGN KEY (idIngredient) REFERENCES ingredients(id)
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    password_hash TEXT NOT NULL
);

CREATE TABLE user_favorites (
    user_id INTEGER NOT NULL,
    meal_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, meal_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (meal_id) REFERENCES meals(id)
);

CREATE TABLE user_restrictions (
    user_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, ingredient_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
); 

CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    parent_id INTEGER,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    edited_at TEXT,
    deleted_at TEXT,
    FOREIGN KEY(recipe_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY(parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE comment_votes (
    comment_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    value INTEGER NOT NULL CHECK(value IN (-1, 1)),
    created_at TEXT NOT NULL,
    PRIMARY KEY (comment_id, username),
    FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE
);

INSERT INTO users (username, email, password_hash)
VALUES (
  'admin',
  'sylas.serpens@gmail.com',
  '$argon2id$v=19$m=65536,t=3,p=4$XP5zZMDRLAWb8g4qIkUgaQ$IjwOxVicBx1xdCFwHyoVDnt4f3pIUCrZ1ydNa2SnPl4'
);
