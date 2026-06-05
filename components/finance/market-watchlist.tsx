"use client";

import type { MarketAsset } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { deleteMarketAssetAction } from "@/app/actions/market";
import { ConfirmSubmitButton } from "@/components/form-buttons";
import { buildSparklinePath, formatMarketPrice, getPriceChange } from "@/lib/market";
import type { MarketQuote } from "@/types/market";

type QuoteState =
  | { status: "loading" }
  | { error: string; status: "error" }
  | { quote: MarketQuote; status: "ready" };

function useMarketQuote(asset: MarketAsset) {
  const [state, setState] = useState<QuoteState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuote() {
      setState({ status: "loading" });

      try {
        const params = new URLSearchParams({
          symbol: asset.symbol,
          type: asset.type,
        });
        const response = await fetch(`/api/market/quote?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as MarketQuote | { error?: string };

        if (!response.ok) {
          throw new Error("error" in data && data.error ? data.error : "Market data is unavailable.");
        }

        setState({ quote: data as MarketQuote, status: "ready" });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setState({
          error: error instanceof Error ? error.message : "Market data is unavailable.",
          status: "error",
        });
      }
    }

    void loadQuote();

    return () => controller.abort();
  }, [asset.symbol, asset.type]);

  return state;
}

function MarketAssetCard({ asset, zh = false }: Readonly<{ asset: MarketAsset; zh?: boolean }>) {
  const state = useMarketQuote(asset);
  const change = state.status === "ready" ? getPriceChange(state.quote.points) : null;
  const path = useMemo(
    () => (state.status === "ready" ? buildSparklinePath(state.quote.points) : ""),
    [state],
  );
  const isUp = (change?.absolute ?? 0) >= 0;

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold">{asset.name || asset.symbol}</h3>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
              {asset.type === "stock" ? (zh ? "股票" : "Stock") : zh ? "虚拟币" : "Crypto"}
            </span>
          </div>
          <p className="mt-1 text-xs uppercase text-zinc-500">{asset.symbol}</p>
        </div>
        <form action={deleteMarketAssetAction}>
          <input name="id" type="hidden" value={asset.id} />
          <ConfirmSubmitButton
            className="h-8 rounded-md border border-red-200 px-3 text-xs font-medium text-red-700"
            message={zh ? "删除这个关注标的吗？" : "Delete this watched asset?"}
          >
            {zh ? "删除" : "Delete"}
          </ConfirmSubmitButton>
        </form>
      </div>

      {state.status === "loading" ? (
        <div className="mt-4 h-28 animate-pulse rounded-md bg-zinc-100" aria-label={zh ? "行情加载中" : "Loading quote"} />
      ) : null}

      {state.status === "error" ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <div className="mt-4 grid gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold">
                {formatMarketPrice(state.quote.latestPrice, state.quote.currency)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {zh ? "数据源" : "Source"}: {state.quote.provider}
              </p>
            </div>
            {change ? (
              <p className={`text-sm font-semibold ${isUp ? "text-teal-700" : "text-red-700"}`}>
                {isUp ? "+" : ""}
                {change.percent.toFixed(2)}%
              </p>
            ) : null}
          </div>

          <svg
            aria-label={zh ? "近 30 天价格走势" : "30 day price trend"}
            className="h-24 w-full overflow-visible"
            preserveAspectRatio="none"
            role="img"
            viewBox="0 0 240 72"
          >
            <path d="M 0 72 L 240 72" fill="none" stroke="#e4e4e7" strokeWidth="1" />
            <path d={path} fill="none" stroke={isUp ? "#0f766e" : "#b91c1c"} strokeLinecap="round" strokeWidth="3" />
          </svg>
        </div>
      ) : null}
    </article>
  );
}

export function MarketWatchlist({
  assets,
  zh = false,
}: Readonly<{
  assets: MarketAsset[];
  zh?: boolean;
}>) {
  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">{zh ? "还没有关注的行情" : "No watched assets yet"}</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {zh
            ? "添加股票代码或常见虚拟币代码后，这里会显示近 30 天价格走势。"
            : "Add a stock ticker or common crypto symbol to see a 30 day trend."}
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {assets.map((asset) => (
        <MarketAssetCard asset={asset} key={asset.id} zh={zh} />
      ))}
    </section>
  );
}
