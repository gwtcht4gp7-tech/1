"use client";

import { useActionState } from "react";
import type { HabitActionState } from "@/app/actions/habits";
import { createHabitAction, updateHabitAction } from "@/app/actions/habits";
import { SubmitButton } from "@/components/form-buttons";
import { targetFrequencies } from "@/lib/domain";

const inputClass =
  "h-10 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

export function HabitForm({
  mode,
  initialValues,
  zh = false,
}: Readonly<{
  mode: "create" | "edit";
  initialValues?: {
    id?: string;
    name: string;
    description?: string | null;
    targetFrequency: "daily" | "weekly";
  };
  zh?: boolean;
}>) {
  const action = mode === "create" ? createHabitAction : updateHabitAction;
  const [state, formAction] = useActionState<HabitActionState, FormData>(action, {});

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
        {zh ? "名称" : "Name"}
        <input
          className={inputClass}
          defaultValue={initialValues?.name}
          maxLength={120}
          name="name"
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

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        {zh ? "目标频率" : "Target frequency"}
        <select
          className={inputClass}
          defaultValue={initialValues?.targetFrequency ?? "daily"}
          name="targetFrequency"
        >
          {targetFrequencies.map((frequency) => (
            <option key={frequency} value={frequency}>
              {frequency}
            </option>
          ))}
        </select>
      </label>

      <SubmitButton
        className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {mode === "create" ? (zh ? "新增习惯" : "Add habit") : zh ? "保存修改" : "Save changes"}
      </SubmitButton>
    </form>
  );
}
