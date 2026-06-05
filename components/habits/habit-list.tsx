import type { Habit, HabitCheckIn } from "@prisma/client";
import {
  cancelHabitCheckInAction,
  checkInHabitAction,
  deleteHabitAction,
} from "@/app/actions/habits";
import { ConfirmSubmitButton, SubmitButton } from "@/components/form-buttons";
import { HabitForm } from "@/components/habits/habit-form";
import {
  calculateCurrentStreak,
  formatDateInput,
  getRecentSevenDays,
} from "@/lib/domain";

type HabitWithCheckIns = Habit & {
  checkIns: HabitCheckIn[];
};

export function HabitList({
  habits,
  today,
  zh = false,
}: Readonly<{
  habits: HabitWithCheckIns[];
  today: Date;
  zh?: boolean;
}>) {
  const days = getRecentSevenDays(today);
  const todayKey = formatDateInput(today);

  if (habits.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">{zh ? "还没有习惯" : "No habits yet"}</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {zh
            ? "先创建一个今天就能完成的小习惯。"
            : "Start with one tiny habit you can check off today."}
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {habits.map((habit) => {
        const checkedDays = new Set(habit.checkIns.map((checkIn) => formatDateInput(checkIn.date)));
        const checkedToday = checkedDays.has(todayKey);
        const streak = calculateCurrentStreak(
          habit.checkIns.map((checkIn) => checkIn.date),
          today,
        );

        return (
          <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={habit.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{habit.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">{habit.description || (zh ? "无描述" : "No description")}</p>
                <p className="mt-2 text-sm font-medium text-teal-700">
                  {zh ? `连续 ${streak} 天` : `${streak} day streak`}
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                {habit.targetFrequency}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2" aria-label={`${habit.name} recent 7 days`}>
              {days.map((day) => {
                const key = formatDateInput(day);
                const done = checkedDays.has(key);

                return (
                  <div className="grid gap-1 text-center" key={key}>
                    <span className="text-[11px] text-zinc-500">{key.slice(5)}</span>
                    <span
                      className={`h-7 rounded-md border text-xs leading-7 ${
                        done
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-zinc-200 bg-zinc-50 text-zinc-400"
                      }`}
                    >
                      {done ? "✓" : "-"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <form action={checkedToday ? cancelHabitCheckInAction : checkInHabitAction}>
                <input name="habitId" type="hidden" value={habit.id} />
                <SubmitButton className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium">
                  {checkedToday ? (zh ? "取消今日打卡" : "Undo today") : zh ? "今日打卡" : "Check in"}
                </SubmitButton>
              </form>
              <details className="w-full sm:w-auto">
                <summary className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium">
                  {zh ? "编辑" : "Edit"}
                </summary>
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:w-96">
                  <HabitForm
                    mode="edit"
                    initialValues={{
                      id: habit.id,
                      name: habit.name,
                      description: habit.description,
                      targetFrequency: habit.targetFrequency,
                    }}
                    zh={zh}
                  />
                </div>
              </details>
              <form action={deleteHabitAction}>
                <input name="id" type="hidden" value={habit.id} />
                <ConfirmSubmitButton
                  className="h-9 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700"
                  message={`Delete "${habit.name}" and its check-ins?`}
                >
                  {zh ? "删除" : "Delete"}
                </ConfirmSubmitButton>
              </form>
            </div>
          </article>
        );
      })}
    </section>
  );
}
