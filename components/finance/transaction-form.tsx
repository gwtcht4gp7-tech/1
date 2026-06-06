"use client";

import type { Category, Transaction } from "@prisma/client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FinanceActionState } from "@/app/actions/finance";
import {
  createTransactionAction,
  updateTransactionAction,
} from "@/app/actions/finance";
import { SubmitButton } from "@/components/form-buttons";
import { formatDateInput, transactionTypes } from "@/lib/domain";

const inputClass =
  "h-10 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

export function TransactionForm({
  categories,
  mode,
  initialValues,
  zh = false,
}: Readonly<{
  categories: Category[];
  mode: "create" | "edit";
  initialValues?: Transaction;
  zh?: boolean;
}>) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const action = mode === "create" ? createTransactionAction : updateTransactionAction;
  const [state, formAction] = useActionState<FinanceActionState, FormData>(action, {});

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
    <form action={formAction} className="grid gap-4" ref={formRef}>
      {initialValues ? <input name="id" type="hidden" value={initialValues.id} /> : null}

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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          {zh ? "金额" : "Amount"}
          <input
            className={inputClass}
            defaultValue={initialValues ? (initialValues.amount / 100).toFixed(2) : ""}
            min="0.01"
            name="amount"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          {zh ? "类型" : "Type"}
          <select className={inputClass} defaultValue={initialValues?.type ?? "expense"} name="type">
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          {zh ? "分类" : "Category"}
          <select className={inputClass} defaultValue={initialValues?.categoryId ?? ""} name="categoryId" required>
            <option value="">{zh ? "选择分类" : "Choose category"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          {zh ? "日期" : "Date"}
          <input
            className={inputClass}
            defaultValue={initialValues ? formatDateInput(initialValues.date) : formatDateInput(new Date())}
            name="date"
            required
            type="date"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        {zh ? "备注" : "Note"}
        <input
          className={inputClass}
          defaultValue={initialValues?.note ?? ""}
          maxLength={200}
          name="note"
        />
      </label>

      <SubmitButton
        className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {mode === "create" ? (zh ? "新增交易" : "Add transaction") : zh ? "保存修改" : "Save changes"}
      </SubmitButton>
    </form>
  );
}
