"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TodoActionState } from "@/app/actions/todos";
import { createTodoAction, updateTodoAction } from "@/app/actions/todos";
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
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const action = mode === "create" ? createTodoAction : updateTodoAction;
  const [state, formAction, isPending] = useActionState<TodoActionState, FormData>(action, {});
  const [timedOut, setTimedOut] = useState(false);
  const dueDate = initialValues?.dueDate ?? formatDateInput(new Date());
  const showTimedOut = timedOut && isPending && !state.error && !state.success;

  useEffect(() => {
    if (!isPending) {
      return;
    }

    const timer = window.setTimeout(() => setTimedOut(true), 15000);

    return () => window.clearTimeout(timer);
  }, [isPending]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    if (mode === "create") {
      formRef.current?.reset();
    }

    router.refresh();
  }, [mode, router, state.success]);

  return (
    <form action={formAction} className="grid gap-4" onSubmit={() => setTimedOut(false)} ref={formRef}>
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
      {showTimedOut ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
          {zh ? "保存时间过长。请重试，或刷新页面后再试。" : "Saving is taking too long. Try again or refresh the page."}
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

      <button
        className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        disabled={isPending && !timedOut}
        type="submit"
      >
        {isPending && !timedOut
          ? zh
            ? "保存中..."
            : "Saving..."
          : mode === "create"
            ? zh
              ? "新增待办"
              : "Add todo"
            : zh
              ? "保存修改"
              : "Save changes"}
      </button>
    </form>
  );
}
