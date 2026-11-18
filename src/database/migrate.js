
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

const currentDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

const migrationsDirectory = path.join(
  currentDirectory,
  "migrations"
);

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = fs.readdirSync(migrationsDirectory)
    .filter(file => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = Number(file.split("_")[0]);

    if (!Number.isInteger(version)) {
      throw new Error(`Invalid migration filename: ${file}`);
    }

    const existing = db.prepare(
      "SELECT version FROM schema_migrations WHERE version = ?"
    ).get(version);

    if (existing) {
      continue;
    }

    const sql = fs.readFileSync(
      path.join(migrationsDirectory, file),
      "utf8"
    );

    const applyMigration = db.transaction(() => {
      db.exec(sql);

      db.prepare(`
        INSERT INTO schema_migrations (version, name)
        VALUES (?, ?)
      `).run(version, file);
    });

    applyMigration();

    console.log(`Migration applied: ${file}`);
  }

  console.log("Database migrations completed.");
}
