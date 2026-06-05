import { scrypt } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = "demo-seed-salt";
  const derivedKey = await scryptAsync(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

function day(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {
      name: "Demo User",
    },
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash: await hashPassword("password123"),
    },
  });

  const salary = await prisma.category.upsert({
    where: {
      userId_name_type: {
        userId: user.id,
        name: "Salary",
        type: "income",
      },
    },
    update: {
      color: "#0f766e",
    },
    create: {
      userId: user.id,
      name: "Salary",
      type: "income",
      color: "#0f766e",
    },
  });

  const food = await prisma.category.upsert({
    where: {
      userId_name_type: {
        userId: user.id,
        name: "Food",
        type: "expense",
      },
    },
    update: {
      color: "#f97316",
    },
    create: {
      userId: user.id,
      name: "Food",
      type: "expense",
      color: "#f97316",
    },
  });

  const transport = await prisma.category.upsert({
    where: {
      userId_name_type: {
        userId: user.id,
        name: "Transport",
        type: "expense",
      },
    },
    update: {
      color: "#2563eb",
    },
    create: {
      userId: user.id,
      name: "Transport",
      type: "expense",
      color: "#2563eb",
    },
  });

  await prisma.todo.deleteMany({ where: { userId: user.id } });
  await prisma.habitCheckIn.deleteMany({ where: { userId: user.id } });
  await prisma.habit.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.marketAsset.deleteMany({ where: { userId: user.id } });

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

  console.log("Seed data created for demo@example.com / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
