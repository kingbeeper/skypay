export type AssetSymbol = "USD" | "BTC" | "ETH" | "USDC" | "SOL";

export type AssetInfo = {
  symbol: AssetSymbol;
  name: string;
  kind: "fiat" | "crypto" | "stable";
  coingeckoId?: string;
  precision: number;
  color: string;
};

export const ASSETS: Record<AssetSymbol, AssetInfo> = {
  USD: {
    symbol: "USD",
    name: "US Dollar",
    kind: "fiat",
    precision: 2,
    color: "#22c55e",
  },
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
};

export const ASSET_LIST = Object.values(ASSETS);

export function formatAmount(amount: number, symbol: AssetSymbol): string {
  const info = ASSETS[symbol];
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: info.precision,
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
