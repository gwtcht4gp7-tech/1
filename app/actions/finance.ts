"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { normalizeCategoryInput, normalizeTransactionInput } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export type FinanceActionState = {
  error?: string;
  success?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireUserId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/finance");
}

async function categoryBelongsToUser(categoryId: string, userId: string, type?: string) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
      ...(type ? { type: type as "income" | "expense" } : {}),
    },
    select: { id: true },
  });
}

export async function createTransactionAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const userId = await requireUserId();

  if (!userId) {
    return { error: "Please log in before adding transactions." };
  }

  const parsed = normalizeTransactionInput({
    amount: readString(formData, "amount"),
    type: readString(formData, "type"),
    categoryId: readString(formData, "categoryId"),
    note: readString(formData, "note"),
    date: readString(formData, "date"),
  });

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  if (!(await categoryBelongsToUser(parsed.value.categoryId, userId, parsed.value.type))) {
    return { error: "Choose a category that matches the transaction type." };
  }

  await prisma.transaction.create({
    data: {
      ...parsed.value,
      userId,
    },
  });

  revalidateFinance();
  return { success: "Transaction added." };
}

export async function updateTransactionAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const userId = await requireUserId();
  const id = readString(formData, "id");

  if (!userId) {
    return { error: "Please log in before editing transactions." };
  }

  if (!id) {
    return { error: "Transaction was not found." };
  }

  const parsed = normalizeTransactionInput({
    amount: readString(formData, "amount"),
    type: readString(formData, "type"),
    categoryId: readString(formData, "categoryId"),
    note: readString(formData, "note"),
    date: readString(formData, "date"),
  });

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  if (!(await categoryBelongsToUser(parsed.value.categoryId, userId, parsed.value.type))) {
    return { error: "Choose a category that matches the transaction type." };
  }

  const result = await prisma.transaction.updateMany({
    where: { id, userId },
    data: parsed.value,
  });

  if (result.count === 0) {
    return { error: "Transaction was not found." };
  }

  revalidateFinance();
  return { success: "Transaction updated." };
}

export async function deleteTransactionAction(formData: FormData) {
  const userId = await requireUserId();
  const id = readString(formData, "id");

  if (!userId || !id) {
    return;
  }

  await prisma.transaction.deleteMany({
    where: { id, userId },
  });

  revalidateFinance();
}

export async function createCategoryAction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const userId = await requireUserId();

  if (!userId) {
    return { error: "Please log in before creating categories." };
  }

  const parsed = normalizeCategoryInput({
    name: readString(formData, "name"),
    type: readString(formData, "type"),
    color: readString(formData, "color") || "#71717a",
  });

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  try {
    await prisma.category.create({
      data: {
        ...parsed.value,
        userId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "That category already exists." };
    }

    throw error;
  }

  revalidateFinance();
  return { success: "Category added." };
}
