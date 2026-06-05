import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

function readDatabaseUrl() {
  const envFile = readFileSync(".env", "utf8");
  const match = envFile.match(/^DATABASE_URL=(.+)$/m);

  if (!match) {
    throw new Error("DATABASE_URL is missing from .env");
  }

  return match[1].trim().replace(/^"|"$/g, "");
}

function resolveSqlitePath(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Only SQLite file: DATABASE_URL values are supported");
  }

  const filePath = databaseUrl.slice("file:".length);

  if (!filePath) {
    throw new Error("SQLite DATABASE_URL must include a file path");
  }

  return resolve("prisma", filePath);
}

function listMigrationFiles() {
  const migrationsDir = resolve("prisma", "migrations");

  if (!existsSync(migrationsDir)) {
    return [];
  }

  return readdirSync(migrationsDir)
    .sort()
    .map((name) => ({
      name,
      path: join(migrationsDir, name, "migration.sql"),
    }))
    .filter((migration) => existsSync(migration.path));
}

const databasePath = resolveSqlitePath(readDatabaseUrl());
mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS "_local_migrations" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const wasApplied = db.prepare(
  'SELECT "name" FROM "_local_migrations" WHERE "name" = ?',
);
const markApplied = db.prepare(
  'INSERT INTO "_local_migrations" ("name") VALUES (?)',
);

let appliedCount = 0;

for (const migration of listMigrationFiles()) {
  if (wasApplied.get(migration.name)) {
    continue;
  }

  const sql = readFileSync(migration.path, "utf8");
  db.exec(sql);
  markApplied.run(migration.name);
  appliedCount += 1;
}

db.close();

console.log(
  `SQLite database initialized at ${databasePath}; applied ${appliedCount} migration(s).`,
);
