import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { searchUserData } from "@/lib/db";
import { formatDateInput, formatMoney } from "@/lib/domain";
import { getLocale, isChinese } from "@/lib/i18n";

export default async function SearchPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ q?: string | string[] }>;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const zh = isChinese(locale);
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const results = await searchUserData(user.id, query);

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          {zh ? "搜索" : "Search"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{zh ? "全局搜索" : "Global search"}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {zh ? "搜索待办、习惯和交易备注。" : "Search todos, habits, and transaction notes."}
        </p>
      </section>

      <form className="flex gap-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <label className="sr-only" htmlFor="global-search-page">
          {zh ? "搜索关键词" : "Search query"}
        </label>
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={query}
          id="global-search-page"
          name="q"
          placeholder={zh ? "搜索全部内容" : "Search everything"}
          type="search"
        />
        <button className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white" type="submit">
          {zh ? "搜索" : "Search"}
        </button>
      </form>

      {!query ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
          {zh ? "输入关键词来查找匹配数据。" : "Enter a search term to find matching data."}
        </div>
      ) : (
        <div className="grid gap-4">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{zh ? "待办" : "Todos"}</h2>
            <div className="mt-3 grid gap-2">
              {results.todos.length === 0 ? (
                <p className="text-sm text-zinc-500">{zh ? "没有找到待办。" : "No todos found."}</p>
              ) : (
                results.todos.map((todo) => (
                  <Link className="text-sm text-teal-700" href="/todos" key={todo.id}>
                    {todo.title}
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{zh ? "习惯" : "Habits"}</h2>
            <div className="mt-3 grid gap-2">
              {results.habits.length === 0 ? (
                <p className="text-sm text-zinc-500">{zh ? "没有找到习惯。" : "No habits found."}</p>
              ) : (
                results.habits.map((habit) => (
                  <Link className="text-sm text-teal-700" href="/habits" key={habit.id}>
                    {habit.name}
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{zh ? "交易" : "Transactions"}</h2>
            <div className="mt-3 grid gap-2">
              {results.transactions.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  {zh ? "没有找到交易记录。" : "No transactions found."}
                </p>
              ) : (
                results.transactions.map((transaction) => (
                  <Link className="text-sm text-teal-700" href="/finance" key={transaction.id}>
                    {formatDateInput(transaction.date)} · {transaction.category.name} ·{" "}
                    {formatMoney(transaction.amount)}
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
