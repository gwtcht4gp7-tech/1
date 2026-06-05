"use client";

import { useActionState } from "react";
import type { FinanceActionState } from "@/app/actions/finance";
import { createCategoryAction } from "@/app/actions/finance";
import { SubmitButton } from "@/components/form-buttons";
import { transactionTypes } from "@/lib/domain";

export function CategoryForm({ zh = false }: Readonly<{ zh?: boolean }>) {
  const [state, formAction] = useActionState<FinanceActionState, FormData>(
    createCategoryAction,
    {},
  );

  return (
    <form action={formAction} className="grid gap-3">
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
      <input
        className="h-10 rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        name="name"
        placeholder={zh ? "分类名称" : "Category name"}
        required
      />
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <select
          className="h-10 rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          name="type"
        >
          {transactionTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          aria-label="Category color"
          className="h-10 w-14 rounded-md border border-zinc-300"
          defaultValue="#71717a"
          name="color"
          type="color"
        />
      </div>
      <SubmitButton className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold">
        {zh ? "新增分类" : "Add category"}
      </SubmitButton>
    </form>
  );
}
