export type MarketAssetType = "stock" | "crypto";

export type MarketPoint = {
  close?: number;
  date: string;
  high?: number;
  low?: number;
  open?: number;
  price: number;
  volume?: number;
};

export type MarketQuote = {
  assetName: string;
  currency: string;
  latestPrice: number;
  points: MarketPoint[];
  provider: string;
  symbol: string;
  type: MarketAssetType;
};
