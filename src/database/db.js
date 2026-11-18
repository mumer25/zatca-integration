
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.resolve(
  process.cwd(),
  process.env.DB_PATH || "./storage/zatca.sqlite"
);

// Ensure database directory exists
fs.mkdirSync(path.dirname(dbPath), {
  recursive: true
});

const db = new Database(dbPath);

// SQLite configuration
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");
db.pragma("synchronous = FULL");

export default db;
