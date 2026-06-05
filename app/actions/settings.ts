"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { localeCookieName } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function clearDemoDataAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Please log in before clearing data." };
  }

  if (readString(formData, "confirm") !== "CLEAR") {
    return { error: "Type CLEAR to confirm this destructive action." };
  }

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId: user.id } }),
    prisma.habitCheckIn.deleteMany({ where: { userId: user.id } }),
    prisma.habit.deleteMany({ where: { userId: user.id } }),
    prisma.todo.deleteMany({ where: { userId: user.id } }),
    prisma.category.deleteMany({ where: { userId: user.id } }),
  ]);

  revalidatePath("/");
  revalidatePath("/todos");
  revalidatePath("/habits");
  revalidatePath("/finance");
  revalidatePath("/settings");

  return { success: "Demo data cleared." };
}

export async function setLocaleAction(formData: FormData) {
  const locale = readString(formData, "locale") === "zh" ? "zh" : "en";
  const cookieStore = await cookies();

  cookieStore.set(localeCookieName, locale, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/");
  revalidatePath("/todos");
  revalidatePath("/habits");
  revalidatePath("/finance");
  revalidatePath("/settings");
  revalidatePath("/search");
  redirect("/settings");
}
