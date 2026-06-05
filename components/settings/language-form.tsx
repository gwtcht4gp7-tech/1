import { setLocaleAction } from "@/app/actions/settings";
import type { Locale } from "@/lib/i18n";

export function LanguageForm({ locale }: Readonly<{ locale: Locale }>) {
  return (
    <form action={setLocaleAction} className="grid gap-3 sm:grid-cols-2">
      <button
        className={`h-10 rounded-md border px-4 text-sm font-semibold ${
          locale === "zh"
            ? "border-teal-700 bg-teal-700 text-white"
            : "border-zinc-300 bg-white text-zinc-800"
        }`}
        name="locale"
        type="submit"
        value="zh"
      >
        中文模式
      </button>
      <button
        className={`h-10 rounded-md border px-4 text-sm font-semibold ${
          locale === "en"
            ? "border-teal-700 bg-teal-700 text-white"
            : "border-zinc-300 bg-white text-zinc-800"
        }`}
        name="locale"
        type="submit"
        value="en"
      >
        English
      </button>
    </form>
  );
}
