export type MarketAssetType = "stock" | "crypto";

export type MarketPoint = {
  date: string;
  price: number;
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
