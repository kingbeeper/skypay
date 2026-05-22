export type AssetSymbol = "BTC" | "ETH" | "USDC" | "SOL" | "LTC";

export type AssetInfo = {
  symbol: AssetSymbol;
  name: string;
  kind: "crypto" | "stable";
  coingeckoId?: string;
  precision: number;
  color: string;
};

export const ASSETS: Record<AssetSymbol, AssetInfo> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    kind: "crypto",
    coingeckoId: "bitcoin",
    precision: 8,
    color: "#f7931a",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    kind: "crypto",
    coingeckoId: "ethereum",
    precision: 6,
    color: "#627eea",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    kind: "stable",
    coingeckoId: "usd-coin",
    precision: 2,
    color: "#2775ca",
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    kind: "crypto",
    coingeckoId: "solana",
    precision: 4,
    color: "#14f195",
  },
  LTC: {
    symbol: "LTC",
    name: "Litecoin",
    kind: "crypto",
    coingeckoId: "litecoin",
    precision: 8,
    color: "#345d9d",
  },
};

export const ASSET_LIST = Object.values(ASSETS);

export function formatAmount(amount: number, symbol: AssetSymbol): string {
  // Defensive: legacy/unknown symbols fall back to 2-decimal precision instead
  // of throwing. This matters for old transaction rows that may still reference
  // assets we no longer support (e.g. USD before the fiat removal migration).
  const info = ASSETS[symbol] as AssetInfo | undefined;
  const precision = info?.precision ?? 2;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: precision,
  });
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
