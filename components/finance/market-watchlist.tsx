"use client";

import type { MarketAsset } from "@prisma/client";
import { useEffect, useState } from "react";
import { deleteMarketAssetAction } from "@/app/actions/market";
import { MarketChart } from "@/components/finance/market-chart";
import { ConfirmSubmitButton } from "@/components/form-buttons";
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

function MarketAssetCard({
  asset,
  compact = false,
  showActions = true,
  zh = false,
}: Readonly<{
  asset: MarketAsset;
  compact?: boolean;
  showActions?: boolean;
  zh?: boolean;
}>) {
  const state = useMarketQuote(asset);

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
        {showActions ? (
          <form action={deleteMarketAssetAction}>
            <input name="id" type="hidden" value={asset.id} />
            <ConfirmSubmitButton
              className="h-8 rounded-md border border-red-200 px-3 text-xs font-medium text-red-700"
              confirmLabel={zh ? "确认删除" : "Confirm delete"}
              message={zh ? "删除这个关注标的吗？" : "Delete this watched asset?"}
              pendingLabel={zh ? "删除中..." : "Deleting..."}
            >
              {zh ? "删除" : "Delete"}
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      {state.status === "loading" ? (
        <div
          aria-label={zh ? "行情加载中" : "Loading quote"}
          className={`mt-4 animate-pulse rounded-md bg-zinc-100 ${compact ? "h-44" : "h-72"}`}
        />
      ) : null}

      {state.status === "error" ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <div className="mt-4">
          <MarketChart compact={compact} quote={state.quote} zh={zh} />
        </div>
      ) : null}
    </article>
  );
}

export function MarketWatchlist({
  assets,
  compact = false,
  maxItems,
  showActions = true,
  zh = false,
}: Readonly<{
  assets: MarketAsset[];
  compact?: boolean;
  maxItems?: number;
  showActions?: boolean;
  zh?: boolean;
}>) {
  const visibleAssets = typeof maxItems === "number" ? assets.slice(0, maxItems) : assets;

  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">{zh ? "还没有关注的行情" : "No watched assets yet"}</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {zh
            ? "在记账页添加股票代码或常见虚拟币代码后，这里会显示近 30 天 K 线。"
            : "Add a stock ticker or common crypto symbol in Finance to see a 30 day candlestick chart."}
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {visibleAssets.map((asset) => (
        <MarketAssetCard
          asset={asset}
          compact={compact}
          key={asset.id}
          showActions={showActions}
          zh={zh}
        />
      ))}
    </section>
  );
}
