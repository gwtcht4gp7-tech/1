"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { normalizeTodoInput } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export type TodoActionState = {
  error?: string;
  success?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireUserId() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return user.id;
}

function revalidateTodos() {
  revalidatePath("/");
  revalidatePath("/todos");
}

export async function createTodoAction(
  _previousState: TodoActionState,
  formData: FormData,
): Promise<TodoActionState> {
  const userId = await requireUserId();

  if (!userId) {
    return { error: "Please log in before creating todos." };
  }

  const parsed = normalizeTodoInput({
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    dueDate: readString(formData, "dueDate"),
    priority: readString(formData, "priority"),
  });

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  try {
    await prisma.todo.create({
      data: {
        ...parsed.value,
        userId,
      },
    });
  } catch {
    return { error: "Todo could not be saved. Please try again." };
  }

  revalidateTodos();
  return { success: "Todo created." };
}

export async function updateTodoAction(
  _previousState: TodoActionState,
  formData: FormData,
): Promise<TodoActionState> {
  const userId = await requireUserId();
  const id = readString(formData, "id");

  if (!userId) {
    return { error: "Please log in before editing todos." };
  }

  if (!id) {
    return { error: "Todo was not found." };
  }

  const parsed = normalizeTodoInput({
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    dueDate: readString(formData, "dueDate"),
    priority: readString(formData, "priority"),
  });

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  let result;

  try {
    result = await prisma.todo.updateMany({
      where: { id, userId },
      data: parsed.value,
    });
  } catch {
    return { error: "Todo could not be updated. Please try again." };
  }

  if (result.count === 0) {
    return { error: "Todo was not found." };
  }

  revalidateTodos();
  return { success: "Todo updated." };
}

export async function toggleTodoAction(formData: FormData) {
  const userId = await requireUserId();
  const id = readString(formData, "id");
  const completed = readString(formData, "completed") === "true";

  if (!userId || !id) {
    return;
  }

  try {
    await prisma.todo.updateMany({
      where: { id, userId },
      data: { completed },
    });
  } catch {
    return;
  }

  revalidateTodos();
}

export async function deleteTodoAction(formData: FormData) {
  const userId = await requireUserId();
  const id = readString(formData, "id");

  if (!userId || !id) {
    return;
  }

  try {
    await prisma.todo.deleteMany({
      where: { id, userId },
    });
  } catch {
    return;
  }

  revalidateTodos();
}
