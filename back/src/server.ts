import express from "express";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
sqlite3.verbose(); // enable better error messages
let db: Database = await open({
    filename: "../database.db",
    driver: sqlite3.Database,
});

export default db;

let app = express();
app.use(express.static("public"));

let port = 3000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});