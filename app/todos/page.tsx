import Link from "next/link";
import { redirect } from "next/navigation";
import { TodoForm } from "@/components/todos/todo-form";
import { TodoList } from "@/components/todos/todo-list";
import { getCurrentUser } from "@/lib/auth";
import { getTodosByFilter } from "@/lib/db";
import { getLocale, isChinese } from "@/lib/i18n";
import type { TodoFilter } from "@/types/todos";

const filters: Array<{ value: TodoFilter; label: string }> = [
  { value: "today", label: "Today" },
  { value: "future", label: "Future" },
  { value: "completed", label: "Completed" },
];

function getFilter(value: string | string[] | undefined): TodoFilter {
  return value === "future" || value === "completed" ? value : "today";
}

export default async function TodosPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ filter?: string | string[] }>;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const zh = isChinese(locale);
  const { filter: filterParam } = await searchParams;
  const activeFilter = getFilter(filterParam);
  const todos = await getTodosByFilter(user.id, activeFilter);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            {zh ? "待办" : "Todos"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {zh ? "按日期安排任务" : "Plan by date"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {zh
              ? "新增、编辑、完成和删除待办，数据会保存到 SQLite。"
              : "Add, edit, complete, and delete real todos stored in SQLite."}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{zh ? "新增待办" : "New todo"}</h2>
        <div className="mt-4">
          <TodoForm mode="create" zh={zh} />
        </div>
      </section>

      <nav aria-label="Todo filters" className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = filter.value === activeFilter;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-teal-700 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700"
              }`}
              href={`/todos?filter=${filter.value}`}
              key={filter.value}
            >
              {zh
                ? filter.value === "today"
                  ? "今天"
                  : filter.value === "future"
                    ? "未来"
                    : "已完成"
                : filter.label}
            </Link>
          );
        })}
      </nav>

      <TodoList todos={todos} zh={zh} />
    </div>
  );
}
