const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      profilePicture TEXT,
      preferences TEXT,
      hasCompletedPreferences INTEGER DEFAULT 0
    )
  `);

  // Add columns if they don't exist, for existing databases
  db.run("ALTER TABLE users ADD COLUMN profilePicture TEXT", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("Error adding profilePicture column:", err);
    }
  });
  db.run("ALTER TABLE users ADD COLUMN preferences TEXT", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("Error adding preferences column:", err);
    }
  });
});

module.exports = db;
