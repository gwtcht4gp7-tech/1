"use client";

import { useActionState } from "react";
import { clearDemoDataAction } from "@/app/actions/settings";
import type { SettingsActionState } from "@/app/actions/settings";
import { SubmitButton } from "@/components/form-buttons";

export function ClearDataForm({ zh = false }: Readonly<{ zh?: boolean }>) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(
    clearDemoDataAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="grid gap-3"
      onSubmit={(event) => {
        const message = zh
          ? "确定清空当前账号的所有演示数据吗？此操作无法撤销。"
          : "Clear all demo data for this account? This cannot be undone.";

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
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
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {zh
          ? "这会永久删除你的待办、习惯、打卡、交易和分类。"
          : "This permanently removes your todos, habits, check-ins, transactions, categories, and market watchlist."}
      </div>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        {zh ? "输入 CLEAR 确认" : "Type CLEAR to confirm"}
        <input
          className="h-10 rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
          name="confirm"
          required
        />
      </label>
      <SubmitButton
        className="h-10 rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700"
        pendingLabel="Clearing..."
      >
        {zh ? "清空演示数据" : "Clear demo data"}
      </SubmitButton>
    </form>
  );
}
