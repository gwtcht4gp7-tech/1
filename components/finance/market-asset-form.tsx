"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { MarketActionState } from "@/app/actions/market";
import { createMarketAssetAction } from "@/app/actions/market";
import { SubmitButton } from "@/components/form-buttons";

const inputClass =
  "h-10 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

export function MarketAssetForm({ zh = false }: Readonly<{ zh?: boolean }>) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, formAction] = useActionState<MarketActionState, FormData>(createMarketAssetAction, {});

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[140px_1fr_1fr_auto]" ref={formRef}>
      {state.error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-4"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800 sm:col-span-4">
          {state.success}
        </p>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        {zh ? "类型" : "Type"}
        <select className={inputClass} name="type">
          <option value="stock">{zh ? "股票" : "Stock"}</option>
          <option value="crypto">{zh ? "虚拟币" : "Crypto"}</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        {zh ? "代码" : "Symbol"}
        <input
          autoCapitalize="characters"
          className={inputClass}
          maxLength={12}
          name="symbol"
          placeholder="AAPL / BTC"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        {zh ? "备注名" : "Name"}
        <input className={inputClass} maxLength={40} name="name" placeholder={zh ? "可选" : "Optional"} />
      </label>

      <div className="flex items-end">
        <SubmitButton className="h-10 w-full rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400">
          {zh ? "添加关注" : "Add"}
        </SubmitButton>
      </div>
    </form>
  );
}
