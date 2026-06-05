/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog, shell } = require("electron");
const { createRequire } = require("node:module");
const { createServer } = require("node:net");
const { spawn } = require("node:child_process");
const { existsSync, readFileSync, readdirSync } = require("node:fs");
const path = require("node:path");
const { scrypt } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);
let serverProcess;

function getAppRoot() {
  return app.isPackaged ? path.join(process.resourcesPath, "app") : app.getAppPath();
}

function getStandaloneDir() {
  return path.join(getAppRoot(), ".next", "standalone");
}

function databaseUrl() {
  const dbPath = path.join(app.getPath("userData"), "focusboard.db");
  return `file:${dbPath.replace(/\\/g, "/")}`;
}

function splitSqlStatements(sql) {
  return sql
    .split(";")
    .map((statement) =>
      statement
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

function listMigrationFiles(standaloneDir) {
  const migrationsDir = path.join(standaloneDir, "prisma", "migrations");

  if (!existsSync(migrationsDir)) {
    return [];
  }

  return readdirSync(migrationsDir)
    .sort()
    .map((name) => ({
      name,
      path: path.join(migrationsDir, name, "migration.sql"),
    }))
    .filter((migration) => existsSync(migration.path));
}

async function hashPassword(password) {
  const salt = "demo-seed-salt";
  const derivedKey = await scryptAsync(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

function day(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function seedDesktopData(prisma) {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash: await hashPassword("password123"),
    },
  });

  const salary = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Salary",
      type: "income",
      color: "#0f766e",
    },
  });

  const food = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Food",
      type: "expense",
      color: "#f97316",
    },
  });

  const transport = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Transport",
      type: "expense",
      color: "#2563eb",
    },
  });

  await prisma.todo.createMany({
    data: [
      {
        userId: user.id,
        title: "Review today's priorities",
        description: "Pick the three tasks that matter most.",
        dueDate: day("2026-06-04"),
        completed: false,
        priority: "high",
      },
      {
        userId: user.id,
        title: "Pay electricity bill",
        dueDate: day("2026-06-04"),
        completed: true,
        priority: "medium",
      },
      {
        userId: user.id,
        title: "Plan weekend groceries",
        dueDate: day("2026-06-05"),
        completed: false,
        priority: "low",
      },
    ],
  });

  const morningWalk = await prisma.habit.create({
    data: {
      userId: user.id,
      name: "Morning walk",
      description: "Walk outside before work.",
      targetFrequency: "daily",
    },
  });

  const reading = await prisma.habit.create({
    data: {
      userId: user.id,
      name: "Read 20 minutes",
      description: "Read a book or long-form article.",
      targetFrequency: "daily",
    },
  });

  await prisma.habitCheckIn.createMany({
    data: [
      { userId: user.id, habitId: morningWalk.id, date: day("2026-06-02") },
      { userId: user.id, habitId: morningWalk.id, date: day("2026-06-03") },
      { userId: user.id, habitId: morningWalk.id, date: day("2026-06-04") },
      { userId: user.id, habitId: reading.id, date: day("2026-06-03") },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        categoryId: salary.id,
        type: "income",
        amount: 120000,
        note: "Part-time payment",
        date: day("2026-06-02"),
      },
      {
        userId: user.id,
        categoryId: food.id,
        type: "expense",
        amount: 4280,
        note: "Lunch and coffee",
        date: day("2026-06-04"),
      },
      {
        userId: user.id,
        categoryId: transport.id,
        type: "expense",
        amount: 8650,
        note: "Metro card top-up",
        date: day("2026-06-01"),
      },
    ],
  });

  await prisma.marketAsset.createMany({
    data: [
      {
        userId: user.id,
        symbol: "AAPL",
        name: "Apple",
        type: "stock",
      },
      {
        userId: user.id,
        symbol: "BTC",
        name: "Bitcoin",
        type: "crypto",
      },
    ],
  });
}

async function initializeDesktopDatabase() {
  const standaloneDir = getStandaloneDir();
  const requireFromServer = createRequire(path.join(standaloneDir, "server.js"));
  const { PrismaClient } = requireFromServer("@prisma/client");
  const prisma = new PrismaClient();

  try {
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "_local_migrations" ("name" TEXT NOT NULL PRIMARY KEY, "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
    );

    const rows = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='User'",
    );
    const hasUserTable = rows.length > 0;
    const wasApplied = async (name) => {
      const appliedRows = await prisma.$queryRawUnsafe(
        'SELECT "name" FROM "_local_migrations" WHERE "name" = ?',
        name,
      );

      return appliedRows.length > 0;
    };
    const markApplied = (name) =>
      prisma.$executeRawUnsafe('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)', name);

    for (const migration of listMigrationFiles(standaloneDir)) {
      if (await wasApplied(migration.name)) {
        continue;
      }

      if (hasUserTable && migration.name === "20260604031000_add_productivity_models") {
        await markApplied(migration.name);
        continue;
      }

      const migrationSql = readFileSync(migration.path, "utf8");

      for (const statement of splitSqlStatements(migrationSql)) {
        await prisma.$executeRawUnsafe(statement);
      }

      await markApplied(migration.name);
    }

    await seedDesktopData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function waitForServer(url) {
  const deadline = Date.now() + 30000;

  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const response = await fetch(url);

        if (response.ok || response.status < 500) {
          resolve();
          return;
        }
      } catch {
        // Server is still starting.
      }

      if (Date.now() > deadline) {
        reject(new Error("The local FocusBoard server did not start in time."));
        return;
      }

      setTimeout(check, 350);
    };

    check();
  });
}

async function startServer() {
  const devUrl = process.env.FOCUSBOARD_DESKTOP_DEV_URL;

  if (devUrl) {
    await waitForServer(devUrl);
    return devUrl;
  }

  const standaloneDir = getStandaloneDir();
  const serverPath = path.join(standaloneDir, "server.js");

  if (!existsSync(serverPath)) {
    throw new Error("Desktop build is missing. Run npm run desktop:prepare first.");
  }

  process.env.DATABASE_URL = databaseUrl();
  process.env.FOCUSBOARD_DESKTOP = "1";
  await initializeDesktopDatabase();

  const port = await getAvailablePort();
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl(),
    ELECTRON_RUN_AS_NODE: "1",
    FOCUSBOARD_DESKTOP: "1",
    HOSTNAME: "127.0.0.1",
    NEXT_TELEMETRY_DISABLED: "1",
    NODE_ENV: "production",
    PORT: String(port),
  };

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: standaloneDir,
    env,
    stdio: "ignore",
    windowsHide: true,
  });

  serverProcess.once("exit", (code) => {
    if (code && !app.isQuitting) {
      dialog.showErrorBox("FocusBoard stopped", "The local app server stopped unexpectedly.");
      app.quit();
    }
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);

  return url;
}

function createWindow(url) {
  const window = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 860,
    minHeight: 640,
    show: false,
    title: "FocusBoard",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.removeMenu();
  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: "deny" };
  });
  window.loadURL(url);
}

const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
  app.quit();
}

app.whenReady().then(async () => {
  try {
    const url = await startServer();
    createWindow(url);
  } catch (error) {
    dialog.showErrorBox("FocusBoard could not start", error.message);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  app.isQuitting = true;

  if (serverProcess) {
    serverProcess.kill();
  }
});
