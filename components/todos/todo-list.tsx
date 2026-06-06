import type { Todo } from "@prisma/client";
import { deleteTodoAction, toggleTodoAction } from "@/app/actions/todos";
import { ConfirmSubmitButton, SubmitButton } from "@/components/form-buttons";
import { TodoForm } from "@/components/todos/todo-form";
import { formatDateInput } from "@/lib/domain";

function priorityClass(priority: Todo["priority"]) {
  if (priority === "high") {
    return "bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-600";
}

export function TodoList({ todos, zh = false }: Readonly<{ todos: Todo[]; zh?: boolean }>) {
  if (todos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">{zh ? "这里还没有待办" : "No todos here yet"}</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {zh
            ? "添加一个小任务，让今天更清楚一点。"
            : "Add a small next step. Your future self will appreciate the clarity."}
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-3">
      {todos.map((todo) => (
        <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" key={todo.id}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`font-semibold ${todo.completed ? "text-zinc-500 line-through" : ""}`}>
                  {todo.title}
                </h2>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityClass(todo.priority)}`}>
                  {todo.priority}
                </span>
                {todo.completed ? (
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                    done
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-zinc-500">{todo.description || (zh ? "无描述" : "No description")}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {zh ? "截止 " : "Due "}
                {todo.dueDate ? formatDateInput(todo.dueDate) : zh ? "不限" : "Anytime"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <form action={toggleTodoAction}>
                <input name="id" type="hidden" value={todo.id} />
                <input name="completed" type="hidden" value={String(!todo.completed)} />
                <SubmitButton className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium">
                  {todo.completed ? (zh ? "标记未完成" : "Mark open") : zh ? "完成" : "Complete"}
                </SubmitButton>
              </form>
              <details className="w-full sm:w-auto">
                <summary className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium">
                  {zh ? "编辑" : "Edit"}
                </summary>
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:w-96">
                  <TodoForm
                    mode="edit"
                    initialValues={{
                      id: todo.id,
                      title: todo.title,
                      description: todo.description,
                      dueDate: todo.dueDate ? formatDateInput(todo.dueDate) : "",
                      priority: todo.priority,
                    }}
                    zh={zh}
                  />
                </div>
              </details>
              <form action={deleteTodoAction}>
                <input name="id" type="hidden" value={todo.id} />
                <ConfirmSubmitButton
                  className="h-9 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700"
                  confirmLabel={zh ? "确认删除" : "Confirm delete"}
                  message={`Delete "${todo.title}"? This cannot be undone.`}
                  pendingLabel={zh ? "删除中..." : "Deleting..."}
                >
                  {zh ? "删除" : "Delete"}
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
