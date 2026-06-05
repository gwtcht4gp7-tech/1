import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getHabitsWithRecentCheckIns,
  getMonthlyFinanceSummary,
  getRecentTransactions,
  getTodosByFilter,
} from "@/lib/db";
import { formatDateInput, formatMoney } from "@/lib/domain";
import { getLocale, isChinese } from "@/lib/i18n";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const zh = isChinese(locale);
  const today = new Date();
  const [todos, habits, monthlySummary, transactions] = await Promise.all([
    getTodosByFilter(user.id, "today", today),
    getHabitsWithRecentCheckIns(user.id, today),
    getMonthlyFinanceSummary(user.id, today),
    getRecentTransactions(user.id, 3),
  ]);
  const todayKey = formatDateInput(today);
  const completedHabits = habits.filter((habit) =>
    habit.checkIns.some((checkIn) => formatDateInput(checkIn.date) === todayKey),
  ).length;
  const balance = monthlySummary.income - monthlySummary.expense;
  const openTodos = todos.filter((todo) => !todo.completed);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          {zh ? "今日" : "Today"}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
              {zh ? "今天最需要关注什么？" : "What needs your attention?"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              {zh
                ? "先处理今天未完成的待办，再查看习惯和本月收支。"
                : "Start with today's open todos, then keep your habits and money in view."}
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
            href="/todos"
          >
            {zh ? "新增待办" : "Add todo"}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">{zh ? "今日未完成" : "Open today"}</p>
          <p className="mt-2 text-3xl font-semibold">{openTodos.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">{zh ? "习惯完成" : "Habits done"}</p>
          <p className="mt-2 text-3xl font-semibold">
            {completedHabits}/{habits.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">{zh ? "本月结余" : "Month balance"}</p>
          <p className="mt-2 text-3xl font-semibold">{formatMoney(balance)}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{zh ? "今日待办" : "Today's todos"}</h2>
            <Link className="text-sm font-medium text-teal-700" href="/todos">
              {zh ? "查看全部" : "View all"}
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {todos.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
                {zh ? "今天没有到期待办。可以休息一下，或者添加一个小任务。" : "Nothing due today. Enjoy the breathing room or add a small task."}
              </p>
            ) : (
              todos.map((todo) => (
                <div className="rounded-md border border-zinc-200 p-4" key={todo.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={todo.completed ? "font-medium text-zinc-500 line-through" : "font-medium"}>
                        {todo.title}
                      </p>
                      {todo.description ? (
                        <p className="mt-1 text-sm text-zinc-500">{todo.description}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                      {todo.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{zh ? "最近账目" : "Recent money"}</h2>
            <Link className="text-sm font-medium text-teal-700" href="/finance">
              {zh ? "记账" : "Finance"}
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {transactions.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
                {zh ? "还没有交易记录。" : "No transactions yet."}
              </p>
            ) : (
              transactions.map((transaction) => (
                <div className="flex items-center justify-between gap-3" key={transaction.id}>
                  <div>
                    <p className="text-sm font-medium">{transaction.category.name}</p>
                    <p className="text-xs text-zinc-500">{transaction.note || (zh ? "无备注" : "No note")}</p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      transaction.type === "income" ? "text-teal-700" : "text-zinc-900"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatMoney(transaction.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
