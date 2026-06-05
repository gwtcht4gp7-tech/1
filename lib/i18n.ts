import "server-only";

import { cookies } from "next/headers";

export type Locale = "en" | "zh";

export const localeCookieName = "focusboard-locale";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return cookieStore.get(localeCookieName)?.value === "zh" ? "zh" : "en";
}

export function isChinese(locale: Locale) {
  return locale === "zh";
}
