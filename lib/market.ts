import type { MarketAssetType, MarketPoint, MarketQuote } from "@/types/market";

const assetTypes = ["stock", "crypto"] as const;

const cryptoAssets: Record<string, { name: string; symbol: string }> = {
  BTC: { name: "Bitcoin", symbol: "BTC" },
  ETH: { name: "Ethereum", symbol: "ETH" },
  SOL: { name: "Solana", symbol: "SOL" },
  BNB: { name: "BNB", symbol: "BNB" },
  XRP: { name: "XRP", symbol: "XRP" },
  ADA: { name: "Cardano", symbol: "ADA" },
  DOGE: { name: "Dogecoin", symbol: "DOGE" },
};

export type MarketAssetInput = {
  name: string | null;
  symbol: string;
  type: MarketAssetType;
};

export type MarketValidationResult =
  | { ok: true; value: MarketAssetInput }
  | { ok: false; error: string };

export function normalizeMarketAssetInput(input: {
  name?: string;
  symbol: string;
  type: string;
}): MarketValidationResult {
  const type = input.type.trim().toLowerCase();
  const symbol = input.symbol.trim().toUpperCase();

  if (!assetTypes.includes(type as MarketAssetType)) {
    return { ok: false, error: "Choose stock or crypto." };
  }

  if (!/^[A-Z0-9.-]{1,12}$/.test(symbol)) {
    return { ok: false, error: "Use 1-12 letters or numbers for the symbol." };
  }

  return {
    ok: true,
    value: {
      name: input.name?.trim() || null,
      symbol,
      type: type as MarketAssetType,
    },
  };
}

export function formatMarketPrice(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: value >= 100 ? 2 : 4,
    style: "currency",
  }).format(value);
}

export function getPriceChange(points: MarketPoint[]) {
  const first = points[0]?.price;
  const last = points.at(-1)?.price;

  if (typeof first !== "number" || typeof last !== "number") {
    return null;
  }

  const absolute = last - first;
  const percent = first === 0 ? 0 : (absolute / first) * 100;

  return { absolute, percent };
}

export function getMarketStats(points: MarketPoint[]) {
  if (points.length === 0) {
    return null;
  }

  const latest = points.at(-1);
  const previous = points.at(-2);

  if (!latest) {
    return null;
  }

  const latestClose = latest.close ?? latest.price;
  const previousClose = previous ? previous.close ?? previous.price : latestClose;
  const absolute = latestClose - previousClose;
  const percent = previousClose === 0 ? 0 : (absolute / previousClose) * 100;
  const highs = points.map((point) => point.high ?? point.close ?? point.price);
  const lows = points.map((point) => point.low ?? point.close ?? point.price);
  const volumes = points.map((point) => point.volume ?? 0);

  return {
    absolute,
    high: Math.max(...highs),
    latestClose,
    latestDate: latest.date,
    low: Math.min(...lows),
    open: latest.open ?? previousClose,
    percent,
    volume: volumes.at(-1) ?? 0,
  };
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 1 : 2,
    notation: value >= 10000 ? "compact" : "standard",
  }).format(value);
}

export function buildSparklinePath(points: MarketPoint[], width = 240, height = 72) {
  if (points.length < 2) {
    return "";
  }

  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.price - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function parseNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function fetchStockQuote(symbol: string): Promise<MarketQuote> {
  const normalized = symbol.trim().toUpperCase();
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}`);
  url.searchParams.set("range", "1mo");
  url.searchParams.set("interval", "1d");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "FocusBoard/0.1 market watchlist",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Stock data provider is unavailable.");
  }

  const data = (await response.json()) as {
    chart?: {
      result?: Array<{
        indicators?: {
          quote?: Array<{
            close?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
            open?: Array<number | null>;
            volume?: Array<number | null>;
          }>;
        };
        meta?: {
          currency?: string;
          longName?: string;
          regularMarketPrice?: number;
          shortName?: string;
          symbol?: string;
        };
        timestamp?: number[];
      }>;
    };
  };
  const result = data.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  const closes = quote?.close ?? [];
  const highs = quote?.high ?? [];
  const lows = quote?.low ?? [];
  const opens = quote?.open ?? [];
  const volumes = quote?.volume ?? [];
  const points = timestamps
    .map((timestamp, index): MarketPoint | null => {
      const close = parseNumber(closes[index]);
      if (close === null) {
        return null;
      }

      const open = parseNumber(opens[index]) ?? close;
      const high = parseNumber(highs[index]) ?? close;
      const low = parseNumber(lows[index]) ?? close;
      const volume = parseNumber(volumes[index]) ?? 0;

      return {
        close,
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        high,
        low,
        open,
        price: close,
        volume,
      };
    })
    .filter((point): point is MarketPoint => point !== null)
    .slice(-30);

  if (points.length === 0) {
    throw new Error("No stock data found. Try symbols like AAPL or TSLA.");
  }

  return {
    assetName: result?.meta?.shortName ?? result?.meta?.longName ?? normalized,
    currency: result?.meta?.currency ?? "USD",
    latestPrice: result?.meta?.regularMarketPrice ?? points.at(-1)?.price ?? 0,
    points,
    provider: "Yahoo Finance",
    symbol: result?.meta?.symbol ?? normalized,
    type: "stock",
  };
}

export async function fetchCryptoQuote(symbol: string): Promise<MarketQuote> {
  const normalized = symbol.trim().toUpperCase();
  const asset = cryptoAssets[normalized];

  if (!asset) {
    throw new Error("Unsupported crypto symbol. Try BTC, ETH, SOL, BNB, XRP, ADA, or DOGE.");
  }

  const url = new URL("https://min-api.cryptocompare.com/data/v2/histoday");
  url.searchParams.set("fsym", asset.symbol);
  url.searchParams.set("tsym", "USD");
  url.searchParams.set("limit", "30");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "FocusBoard/0.1 market watchlist",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Crypto data provider is unavailable.");
  }

  const data = (await response.json()) as {
    Data?: {
      Data?: Array<{
        close?: number;
        high?: number;
        low?: number;
        open?: number;
        time?: number;
        volumeto?: number;
      }>;
    };
    Message?: string;
    Response?: string;
  };
  const points = (data.Data?.Data ?? [])
    .map((item) => ({
      close: item.close ?? Number.NaN,
      date: new Date((item.time ?? 0) * 1000).toISOString().slice(0, 10),
      high: item.high ?? item.close ?? Number.NaN,
      low: item.low ?? item.close ?? Number.NaN,
      open: item.open ?? item.close ?? Number.NaN,
      price: item.close ?? Number.NaN,
      volume: item.volumeto ?? 0,
    }))
    .filter((point) => Number.isFinite(point.price))
    .slice(-30);

  if (data.Response === "Error" || points.length === 0) {
    throw new Error(data.Message || "No crypto data found.");
  }

  return {
    assetName: asset.name,
    currency: "USD",
    latestPrice: points.at(-1)?.price ?? 0,
    points,
    provider: "CryptoCompare",
    symbol: asset.symbol,
    type: "crypto",
  };
}

export async function fetchMarketQuote(type: MarketAssetType, symbol: string) {
  return type === "crypto" ? fetchCryptoQuote(symbol) : fetchStockQuote(symbol);
}
