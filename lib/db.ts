import "server-only";

import type { Prisma } from "@prisma/client";
import {
  getDayRange,
  getMonthRange,
  getRecentSevenDays,
  parseMonthInput,
} from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import type { FinanceFilters } from "@/types/finance";
import type { TodoFilter } from "@/types/todos";

export async function getTodosByDate(userId: string, date: Date) {
  const { start, end } = getDayRange(date);

  return prisma.todo.findMany({
    where: {
      userId,
      dueDate: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ completed: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
  });
}

export async function getOverdueTodos(userId: string, today = new Date()) {
  const { start } = getDayRange(today);

  return prisma.todo.findMany({
    where: {
      userId,
      completed: false,
      dueDate: {
        lt: start,
      },
    },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
  });
}

export async function getTodosByFilter(userId: string, filter: TodoFilter, today = new Date()) {
  const { start, end } = getDayRange(today);
  const where: Prisma.TodoWhereInput = { userId };

  if (filter === "today") {
    where.dueDate = {
      gte: start,
      lt: end,
    };
  }

  if (filter === "overdue") {
    where.completed = false;
    where.dueDate = {
      lt: start,
    };
  }

  if (filter === "future") {
    where.completed = false;
    where.OR = [{ dueDate: { gte: end } }, { dueDate: null }];
  }

  if (filter === "completed") {
    where.completed = true;
  }

  return prisma.todo.findMany({
    where,
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
}

export async function getHabitsWithTodayCheckIns(userId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.habit.findMany({
    where: {
      userId,
    },
    include: {
      checkIns: {
        where: {
          date: {
            gte: start,
            lt: end,
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getHabitsWithRecentCheckIns(userId: string, today = new Date()) {
  const days = getRecentSevenDays(today);
  const { start } = getDayRange(days[0]);
  const { end } = getDayRange(days[days.length - 1]);

  return prisma.habit.findMany({
    where: {
      userId,
    },
    include: {
      checkIns: {
        where: {
          date: {
            gte: start,
            lt: end,
          },
        },
        orderBy: {
          date: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getMonthlyFinanceSummary(userId: string, month: Date) {
  const { start, end } = getMonthRange(month);

  const totals = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return {
    income: totals.find((item) => item.type === "income")?._sum.amount ?? 0,
    expense: totals.find((item) => item.type === "expense")?._sum.amount ?? 0,
  };
}

const defaultCategories = [
  { name: "餐饮", type: "expense" as const, color: "#f97316" },
  { name: "交通", type: "expense" as const, color: "#2563eb" },
  { name: "购物", type: "expense" as const, color: "#db2777" },
  { name: "工资", type: "income" as const, color: "#0f766e" },
  { name: "其他", type: "expense" as const, color: "#71717a" },
];

export async function ensureDefaultCategories(userId: string) {
  await Promise.all(
    defaultCategories.map((category) =>
      prisma.category.upsert({
        where: {
          userId_name_type: {
            userId,
            name: category.name,
            type: category.type,
          },
        },
        update: {
          color: category.color,
        },
        create: {
          userId,
          ...category,
        },
      }),
    ),
  );
}

export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: {
      userId,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function getTransactionsByFilters(userId: string, filters: FinanceFilters) {
  const month = parseMonthInput(filters.month) ?? new Date();
  const { start, end } = getMonthRange(month);
  const where: Prisma.TransactionWhereInput = {
    userId,
    date: {
      gte: start,
      lt: end,
    },
  };

  if (filters.type && filters.type !== "all") {
    where.type = filters.type;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  return prisma.transaction.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}

export async function getRecentTransactions(userId: string, take = 10) {
  return prisma.transaction.findMany({
    where: {
      userId,
    },
    include: {
      category: true,
    },
    orderBy: {
      date: "desc",
    },
    take,
  });
}

export async function searchUserData(userId: string, query: string) {
  const term = query.trim();

  if (!term) {
    return {
      todos: [],
      habits: [],
      transactions: [],
    };
  }

  const [todos, habits, transactions] = await Promise.all([
    prisma.todo.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: term } },
          { description: { contains: term } },
        ],
      },
      take: 20,
    }),
    prisma.habit.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: term } },
          { description: { contains: term } },
        ],
      },
      take: 20,
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        OR: [
          { note: { contains: term } },
          { category: { name: { contains: term } } },
        ],
      },
      include: {
        category: true,
      },
      take: 20,
    }),
  ]);

  return {
    todos,
    habits,
    transactions,
  };
}
