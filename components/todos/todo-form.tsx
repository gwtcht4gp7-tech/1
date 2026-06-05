"use client";

import { useActionState } from "react";
import type { TodoActionState } from "@/app/actions/todos";
import { createTodoAction, updateTodoAction } from "@/app/actions/todos";
import { SubmitButton } from "@/components/form-buttons";
import { formatDateInput, todoPriorities } from "@/lib/domain";
import type { TodoFormValues } from "@/types/todos";

const inputClass =
  "h-10 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

export function TodoForm({
  mode,
  initialValues,
  zh = false,
}: Readonly<{
  mode: "create" | "edit";
  initialValues?: TodoFormValues;
  zh?: boolean;
}>) {
  const action = mode === "create" ? createTodoAction : updateTodoAction;
  const [state, formAction] = useActionState<TodoActionState, FormData>(action, {});
  const dueDate =
    initialValues?.dueDate ?? formatDateInput(new Date());

  return (
    <form action={formAction} className="grid gap-4">
      {initialValues?.id ? <input name="id" type="hidden" value={initialValues.id} /> : null}

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {state.success}
        </p>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        {zh ? "标题" : "Title"}
        <input
          className={inputClass}
          defaultValue={initialValues?.title}
          maxLength={120}
          name="title"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        {zh ? "描述" : "Description"}
        <textarea
          className="min-h-20 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={initialValues?.description ?? ""}
          maxLength={500}
          name="description"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          {zh ? "截止日期" : "Due date"}
          <input className={inputClass} defaultValue={dueDate} name="dueDate" type="date" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          {zh ? "优先级" : "Priority"}
          <select className={inputClass} defaultValue={initialValues?.priority ?? "medium"} name="priority">
            {todoPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
      </div>

      <SubmitButton
        className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {mode === "create" ? (zh ? "新增待办" : "Add todo") : zh ? "保存修改" : "Save changes"}
      </SubmitButton>
    </form>
  );
}
