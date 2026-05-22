import { ASSET_LIST, type AssetSymbol } from "./assets";

export type PriceQuote = {
  usd: number;
  change24h: number;
};

export type PriceMap = Record<AssetSymbol, PriceQuote>;

const COINGECKO_BASE = "https://api.coingecko.com/api/v3/simple/price";

export async function fetchPrices(
  opts: { ttlSeconds?: number } = {},
): Promise<PriceMap> {
  const { ttlSeconds = 60 } = opts;
  const ids = ASSET_LIST
    .filter((a) => a.coingeckoId)
    .map((a) => a.coingeckoId)
    .join(",");

  const url = `${COINGECKO_BASE}?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const prices: PriceMap = {
    BTC: { usd: 0, change24h: 0 },
    ETH: { usd: 0, change24h: 0 },
    USDC: { usd: 1, change24h: 0 },
    SOL: { usd: 0, change24h: 0 },
  };

  try {
    const res = await fetch(url, {
      next: { revalidate: ttlSeconds },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(`CoinGecko returned ${res.status}, using fallback prices`);
      return withFallback(prices);
    }

    const data = (await res.json()) as Record<
      string,
      { usd: number; usd_24h_change: number }
    >;

    for (const asset of ASSET_LIST) {
      if (!asset.coingeckoId) continue;
      const quote = data[asset.coingeckoId];
      if (quote) {
        prices[asset.symbol] = {
          usd: quote.usd,
          change24h: quote.usd_24h_change ?? 0,
        };
      }
    }

    return withFallback(prices);
  } catch (err) {
    console.warn("Failed to fetch prices:", err);
    return withFallback(prices);
  }
}

function withFallback(prices: PriceMap): PriceMap {
  // Approximate fallback prices for offline/rate-limited demos
  if (prices.BTC.usd === 0) prices.BTC = { usd: 97000, change24h: 0 };
  if (prices.ETH.usd === 0) prices.ETH = { usd: 3400, change24h: 0 };
  if (prices.SOL.usd === 0) prices.SOL = { usd: 180, change24h: 0 };
  return prices;
}
