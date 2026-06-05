"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthFormState = {
  error?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email").toLowerCase();
  const name = readString(formData, "name");
  const password = readString(formData, "password");

  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: await hashPassword(password),
    },
    select: {
      id: true,
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");

  if (!isValidEmail(email) || !password) {
    return { error: "Email or password is incorrect." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
