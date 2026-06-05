import { redirect } from "next/navigation";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitList } from "@/components/habits/habit-list";
import { getCurrentUser } from "@/lib/auth";
import { getHabitsWithRecentCheckIns } from "@/lib/db";
import { getLocale, isChinese } from "@/lib/i18n";

export default async function HabitsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const zh = isChinese(locale);
  const today = new Date();
  const habits = await getHabitsWithRecentCheckIns(user.id, today);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            {zh ? "习惯" : "Habits"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {zh ? "每日打卡" : "Daily check-ins"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {zh
              ? "创建习惯，完成今日打卡，并查看真实连续天数。"
              : "Create habits, check in for today, and keep the streak honest."}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{zh ? "新增习惯" : "New habit"}</h2>
        <div className="mt-4">
          <HabitForm mode="create" zh={zh} />
        </div>
      </section>

      <HabitList habits={habits} today={today} zh={zh} />
    </div>
  );
}
