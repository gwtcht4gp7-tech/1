export const todoPriorities = ["low", "medium", "high"] as const;
export type TodoPriorityValue = (typeof todoPriorities)[number];

export const targetFrequencies = ["daily", "weekly"] as const;
export type TargetFrequencyValue = (typeof targetFrequencies)[number];

export const transactionTypes = ["income", "expense"] as const;
export type TransactionTypeValue = (typeof transactionTypes)[number];

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function formatMonthInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function parseMonthInput(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return { start, end };
}

export function normalizeTodoInput(input: {
  title: string;
  description?: string;
  dueDate?: string;
  priority: string;
}): ValidationResult<{
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: TodoPriorityValue;
}> {
  const title = input.title.trim();

  if (title.length < 2) {
    return { ok: false, error: "Todo title must be at least 2 characters." };
  }

  if (!todoPriorities.includes(input.priority as TodoPriorityValue)) {
    return { ok: false, error: "Choose a valid priority." };
  }

  const dueDate = input.dueDate ? parseDateInput(input.dueDate) : null;

  if (input.dueDate && !dueDate) {
    return { ok: false, error: "Choose a valid due date." };
  }

  return {
    ok: true,
    value: {
      title,
      description: input.description?.trim() || null,
      dueDate,
      priority: input.priority as TodoPriorityValue,
    },
  };
}

export function normalizeHabitInput(input: {
  name: string;
  description?: string;
  targetFrequency: string;
}): ValidationResult<{
  name: string;
  description: string | null;
  targetFrequency: TargetFrequencyValue;
}> {
  const name = input.name.trim();

  if (name.length < 2) {
    return { ok: false, error: "Habit name must be at least 2 characters." };
  }

  if (!targetFrequencies.includes(input.targetFrequency as TargetFrequencyValue)) {
    return { ok: false, error: "Choose a valid target frequency." };
  }

  return {
    ok: true,
    value: {
      name,
      description: input.description?.trim() || null,
      targetFrequency: input.targetFrequency as TargetFrequencyValue,
    },
  };
}

export function normalizeMoneyAmount(value: string): ValidationResult<number> {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, error: "Amount is required." };
  }

  const amount = Number(trimmed);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  return { ok: true, value: Math.round(amount * 100) };
}

export function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function normalizeTransactionInput(input: {
  amount: string;
  type: string;
  categoryId: string;
  note?: string;
  date: string;
}): ValidationResult<{
  amount: number;
  type: TransactionTypeValue;
  categoryId: string;
  note: string | null;
  date: Date;
}> {
  const amount = normalizeMoneyAmount(input.amount);

  if (!amount.ok) {
    return amount;
  }

  if (!transactionTypes.includes(input.type as TransactionTypeValue)) {
    return { ok: false, error: "Choose income or expense." };
  }

  if (!input.categoryId.trim()) {
    return { ok: false, error: "Choose a category." };
  }

  const date = parseDateInput(input.date);

  if (!date) {
    return { ok: false, error: "Choose a valid date." };
  }

  return {
    ok: true,
    value: {
      amount: amount.value,
      type: input.type as TransactionTypeValue,
      categoryId: input.categoryId,
      note: input.note?.trim() || null,
      date,
    },
  };
}

export function normalizeCategoryInput(input: {
  name: string;
  type: string;
  color: string;
}): ValidationResult<{
  name: string;
  type: TransactionTypeValue;
  color: string;
}> {
  const name = input.name.trim();

  if (name.length < 2) {
    return { ok: false, error: "Category name must be at least 2 characters." };
  }

  if (!transactionTypes.includes(input.type as TransactionTypeValue)) {
    return { ok: false, error: "Choose income or expense." };
  }

  const color = input.color.trim();

  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { ok: false, error: "Choose a valid color." };
  }

  return {
    ok: true,
    value: {
      name,
      type: input.type as TransactionTypeValue,
      color,
    },
  };
}

export function calculateCurrentStreak(checkInDates: Date[], today: Date) {
  const checkedDays = new Set(checkInDates.map((date) => formatDateInput(date)));
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;

  while (checkedDays.has(formatDateInput(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getRecentSevenDays(today: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
}
