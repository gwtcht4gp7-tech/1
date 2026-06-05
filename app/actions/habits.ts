"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDayRange, normalizeHabitInput } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export type HabitActionState = {
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

function revalidateHabits() {
  revalidatePath("/");
  revalidatePath("/habits");
}

export async function createHabitAction(
  _previousState: HabitActionState,
  formData: FormData,
): Promise<HabitActionState> {
  const userId = await requireUserId();

  if (!userId) {
    return { error: "Please log in before creating habits." };
  }

  const parsed = normalizeHabitInput({
    name: readString(formData, "name"),
    description: readString(formData, "description"),
    targetFrequency: readString(formData, "targetFrequency"),
  });

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  await prisma.habit.create({
    data: {
      ...parsed.value,
      userId,
    },
  });

  revalidateHabits();
  return { success: "Habit created." };
}

export async function updateHabitAction(
  _previousState: HabitActionState,
  formData: FormData,
): Promise<HabitActionState> {
  const userId = await requireUserId();
  const id = readString(formData, "id");

  if (!userId) {
    return { error: "Please log in before editing habits." };
  }

  if (!id) {
    return { error: "Habit was not found." };
  }

  const parsed = normalizeHabitInput({
    name: readString(formData, "name"),
    description: readString(formData, "description"),
    targetFrequency: readString(formData, "targetFrequency"),
  });

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const result = await prisma.habit.updateMany({
    where: { id, userId },
    data: parsed.value,
  });

  if (result.count === 0) {
    return { error: "Habit was not found." };
  }

  revalidateHabits();
  return { success: "Habit updated." };
}

export async function deleteHabitAction(formData: FormData) {
  const userId = await requireUserId();
  const id = readString(formData, "id");

  if (!userId || !id) {
    return;
  }

  await prisma.habit.deleteMany({
    where: { id, userId },
  });

  revalidateHabits();
}

export async function checkInHabitAction(formData: FormData) {
  const userId = await requireUserId();
  const habitId = readString(formData, "habitId");

  if (!userId || !habitId) {
    return;
  }

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true },
  });

  if (!habit) {
    return;
  }

  const { start } = getDayRange(new Date());

  try {
    await prisma.habitCheckIn.upsert({
      where: {
        habitId_date: {
          habitId,
          date: start,
        },
      },
      update: {},
      create: {
        habitId,
        userId,
        date: start,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      throw error;
    }
  }

  revalidateHabits();
}

export async function cancelHabitCheckInAction(formData: FormData) {
  const userId = await requireUserId();
  const habitId = readString(formData, "habitId");

  if (!userId || !habitId) {
    return;
  }

  const { start } = getDayRange(new Date());

  await prisma.habitCheckIn.deleteMany({
    where: {
      userId,
      habitId,
      date: start,
    },
  });

  revalidateHabits();
}
