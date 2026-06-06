import Link from "next/link";
import { LocalContextCard } from "@/components/dashboard/local-context-card";
import { MarketWatchlist } from "@/components/finance/market-watchlist";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getHabitsWithRecentCheckIns,
  getMarketAssets,
  getMonthlyFinanceSummary,
  getOverdueTodos,
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
  const [todos, overdueTodos, habits, monthlySummary, transactions, marketAssets] = await Promise.all([
    getTodosByFilter(user.id, "today", today),
    getOverdueTodos(user.id, today),
    getHabitsWithRecentCheckIns(user.id, today),
    getMonthlyFinanceSummary(user.id, today),
    getRecentTransactions(user.id, 3),
    getMarketAssets(user.id),
  ]);
  const todayKey = formatDateInput(today);
  const completedHabits = habits.filter((habit) =>
    habit.checkIns.some((checkIn) => formatDateInput(checkIn.date) === todayKey),
  ).length;
  const balance = monthlySummary.income - monthlySummary.expense;
  const openTodos = todos.filter((todo) => !todo.completed);
  const uncheckedHabits = habits.filter(
    (habit) => !habit.checkIns.some((checkIn) => formatDateInput(checkIn.date) === todayKey),
  );
  const attentionItems = [
    ...overdueTodos.slice(0, 3).map((todo) => ({
      href: "/todos?filter=overdue",
      key: `overdue-${todo.id}`,
      label: zh ? "逾期" : "Overdue",
      text: todo.title,
      tone: "red",
    })),
    ...openTodos.slice(0, 3).map((todo) => ({
      href: "/todos?filter=today",
      key: `today-${todo.id}`,
      label: zh ? "今日" : "Today",
      text: todo.title,
      tone: "teal",
    })),
    ...uncheckedHabits.slice(0, 3).map((habit) => ({
      href: "/habits",
      key: `habit-${habit.id}`,
      label: zh ? "习惯" : "Habit",
      text: habit.name,
      tone: "amber",
    })),
  ].slice(0, 6);
  const financeNotice =
    monthlySummary.expense === 0
      ? zh
        ? "本月还没有支出记录。"
        : "No expenses logged this month."
      : balance < 0
        ? zh
          ? "本月支出已超过收入，建议检查最近交易。"
          : "Expenses are above income this month. Review recent transactions."
        : zh
          ? "本月收支仍为正，可以继续保持。"
          : "This month's balance is positive. Keep it steady.";

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

      <LocalContextCard zh={zh} />

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

      <section className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{zh ? "金融行情" : "Market overview"}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {zh
                ? "查看你关注的股票和虚拟币近 30 天 K 线、涨跌和区间价格。"
                : "Track watched stocks and crypto with 30 day candlesticks, movement, and ranges."}
            </p>
          </div>
          <Link className="text-sm font-medium text-teal-700" href="/finance">
            {zh ? "管理关注" : "Manage watchlist"}
          </Link>
        </div>
        <MarketWatchlist
          assets={marketAssets}
          compact
          maxItems={2}
          showActions={false}
          zh={zh}
        />
        {marketAssets.length > 2 ? (
          <Link className="text-sm font-medium text-teal-700" href="/finance">
            {zh ? `查看全部 ${marketAssets.length} 个关注标的` : `View all ${marketAssets.length} watched assets`}
          </Link>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{zh ? "今日行动清单" : "Today action list"}</h2>
              <p className="mt-1 text-sm text-zinc-600">
                {zh
                  ? "优先处理逾期任务、今日任务和未打卡习惯。"
                  : "Prioritized from overdue todos, today's todos, and habits not checked in."}
              </p>
            </div>
            {overdueTodos.length > 0 ? (
              <span className="w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                {zh ? `${overdueTodos.length} 个逾期` : `${overdueTodos.length} overdue`}
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3">
            {attentionItems.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
                {zh
                  ? "今天没有必须马上处理的事项。可以添加一个小任务，或回顾本周计划。"
                  : "No urgent action items right now. Add a small task or review your week."}
              </p>
            ) : (
              attentionItems.map((item) => (
                <Link
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 p-4 transition hover:border-teal-200 hover:bg-teal-50/40 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  href={item.href}
                  key={item.key}
                >
                  <div className="min-w-0">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        item.tone === "red"
                          ? "bg-red-50 text-red-700"
                          : item.tone === "amber"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      {item.label}
                    </span>
                    <p className="mt-2 truncate text-sm font-medium text-zinc-950">{item.text}</p>
                  </div>
                  <span className="text-sm font-medium text-teal-700">{zh ? "处理" : "Open"}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{zh ? "状态提醒" : "Status reminders"}</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-md border border-zinc-200 p-4">
              <p className="font-medium text-zinc-950">{zh ? "习惯完成率" : "Habit completion"}</p>
              <p className="mt-1 text-zinc-600">
                {habits.length === 0
                  ? zh
                    ? "还没有习惯。"
                    : "No habits yet."
                  : zh
                    ? `今天还有 ${uncheckedHabits.length} 个习惯未完成。`
                    : `${uncheckedHabits.length} habits left today.`}
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4">
              <p className="font-medium text-zinc-950">{zh ? "本月财务" : "Monthly finance"}</p>
              <p className="mt-1 text-zinc-600">{financeNotice}</p>
            </div>
          </div>
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
