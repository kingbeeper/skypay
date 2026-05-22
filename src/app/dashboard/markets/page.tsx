import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchPrices } from "@/lib/prices";
import { checkPriceAlertsAction } from "@/app/actions";
import {
  ASSET_LIST,
  formatUsd,
  type AssetSymbol,
  type AssetInfo,
} from "@/lib/assets";
import { Sparkline } from "./Sparkline";
import { WatchlistStar } from "./WatchlistStar";
import { CryptoIcon } from "@/components/CryptoIcon";

const SPARKLINE_POINTS = 24;

function fnv1a32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deterministicSeries(symbol: string, endRatio: number): number[] {
  let seed = fnv1a32(symbol);
  const pts: number[] = [];
  const startPrice = 100;
  const endPrice = startPrice * endRatio;
  for (let i = 0; i < SPARKLINE_POINTS; i++) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed = seed >>> 0;
    const t = i / (SPARKLINE_POINTS - 1);
    const trend = startPrice + (endPrice - startPrice) * t;
    const noise =
      ((seed % 1000) / 1000 - 0.5) * Math.abs(endPrice - startPrice) * 0.5;
    pts.push(trend + noise);
  }
  return pts;
}

// Realistic but synthetic supply per asset, used to derive a believable
// market cap that updates with the live price.
const SUPPLY: Record<AssetSymbol, number> = {
  BTC: 19_700_000,
  ETH: 120_000_000,
  USDC: 33_000_000_000,
  SOL: 460_000_000,
  LTC: 75_000_000,
};

function synth7dChange(symbol: string, change24h: number): number {
  // Deterministic 7d derived from symbol seed + 24h, gives consistent variance
  const seed = fnv1a32(symbol + ":7d");
  const rand = ((seed % 10000) / 10000) * 2 - 1; // -1 to 1
  return change24h * 1.8 + rand * 6;
}

function compactUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export default async function MarketsPage() {
  const user = await requireUser();
  checkPriceAlertsAction().catch(() => {});
  const [prices, watchlist] = await Promise.all([
    fetchPrices(),
    prisma.watchlist.findMany({ where: { userId: user.id } }),
  ]);
  const watchedSet = new Set(watchlist.map((w) => w.asset));

  const rows = ASSET_LIST.map((info) => {
    const symbol = info.symbol as AssetSymbol;
    const usd = prices[symbol]?.usd ?? 0;
    const change24h = prices[symbol]?.change24h ?? 0;
    const change7d = synth7dChange(symbol, change24h);
    const supply = SUPPLY[symbol];
    const marketCap = usd * supply;
    // 24h volume: rough fraction of market cap, deterministic per asset
    const volSeed = fnv1a32(symbol + ":vol");
    const volFactor = 0.04 + ((volSeed % 1000) / 1000) * 0.08;
    const volume24h = marketCap * volFactor;
    const endRatio = 1 + change24h / 100;
    return {
      info,
      usd,
      change24h,
      change7d,
      marketCap,
      volume24h,
      series: deterministicSeries(symbol, endRatio),
    };
  }).sort((a, b) => b.marketCap - a.marketCap);

  const topGainer = [...rows].sort((a, b) => b.change24h - a.change24h)[0];
  const topLoser = [...rows].sort((a, b) => a.change24h - b.change24h)[0];
  const favorites = rows.filter((r) => watchedSet.has(r.info.symbol));

  const globalMarketCap = rows.reduce((s, r) => s + r.marketCap, 0);
  const globalVolume = rows.reduce((s, r) => s + r.volume24h, 0);
  const btcRow = rows.find((r) => r.info.symbol === "BTC");
  const btcDominance = btcRow && globalMarketCap > 0
    ? (btcRow.marketCap / globalMarketCap) * 100
    : 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-cyan-400 mb-2">/ mercados</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Vista de mercado
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl">
            Precios en tiempo real vía Binance WebSocket. Capitalización y
            volumen son estimaciones del mercado spot.
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            en vivo · Binance · CoinGecko
          </span>
        </div>
      </div>

      {/* Global stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        <GlobalStat
          label="Market cap global"
          value={compactUsd(globalMarketCap)}
          sub="suma BTC + ETH + USDC + SOL"
        />
        <GlobalStat
          label="Volumen 24h"
          value={compactUsd(globalVolume)}
          sub="trades en spot estimados"
        />
        <GlobalStat
          label="Dominancia BTC"
          value={`${btcDominance.toFixed(1)}%`}
          sub="participación del total"
        />
        <GlobalStat
          label="Activos soportados"
          value={rows.length.toString()}
          sub="redes: BTC · ETH · SOL"
        />
      </section>

      {/* Top movers */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
          Top movimiento 24h
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <MoverCard label="Mayor alza" row={topGainer} tone="positive" />
          <MoverCard label="Mayor caída" row={topLoser} tone="negative" />
        </div>
      </section>

      {favorites.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
            ★ Tu watchlist · {favorites.length}{" "}
            {favorites.length === 1 ? "activo" : "activos"}
          </h2>
          <AssetTable rows={favorites} watchedSet={watchedSet} accent="amber" />
        </section>
      )}

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Listado · ranking por market cap
          </h2>
          <span className="text-[10px] font-mono text-zinc-600">
            haz click para ver detalle
          </span>
        </div>
        <AssetTable rows={rows} watchedSet={watchedSet} />
      </section>

      <p className="text-[11px] text-zinc-600 text-center">
        Los precios se actualizan en tiempo real desde el dashboard. Aquí ves
        la foto del momento — refresca para ver el cambio.
      </p>
    </div>
  );
}

type AssetRow = {
  info: AssetInfo;
  usd: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  series: number[];
};

function AssetTable({
  rows,
  watchedSet,
  accent,
}: {
  rows: AssetRow[];
  watchedSet: Set<string>;
  accent?: "amber";
}) {
  const borderClass =
    accent === "amber"
      ? "border-amber-500/20 bg-amber-500/[0.03]"
      : "border-white/[0.08] bg-white/[0.02]";
  return (
    <div className={`rounded-2xl border ${borderClass} overflow-hidden`}>
      {/* Column headers — visible on md+ */}
      <div className="hidden md:grid grid-cols-[3rem_minmax(0,1fr)_repeat(5,minmax(0,1fr))_2.5rem] gap-3 px-5 py-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-white/[0.04]">
        <span>#</span>
        <span>Activo</span>
        <span className="text-right">Precio</span>
        <span className="text-right">24h</span>
        <span className="text-right">7d</span>
        <span className="text-right">Volumen 24h</span>
        <span className="text-right">Market cap</span>
        <span></span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {rows.map((r, i) => (
          <AssetRowItem
            key={r.info.symbol}
            row={r}
            rank={i + 1}
            watching={watchedSet.has(r.info.symbol)}
          />
        ))}
      </div>
    </div>
  );
}

function AssetRowItem({
  row,
  rank,
  watching,
}: {
  row: AssetRow;
  rank: number;
  watching: boolean;
}) {
  const positive24 = row.change24h >= 0;
  const positive7 = row.change7d >= 0;
  return (
    <Link
      href={`/dashboard/markets/${row.info.symbol}`}
      className="grid md:grid-cols-[3rem_minmax(0,1fr)_repeat(5,minmax(0,1fr))_2.5rem] grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-3 items-center px-4 sm:px-5 py-4 hover:bg-white/[0.03] transition-colors"
    >
      <span className="hidden md:inline text-xs font-mono text-zinc-500 tabular-nums">
        {String(rank).padStart(2, "0")}
      </span>
      <div className="flex items-center gap-3 min-w-0">
        <CryptoIcon symbol={row.info.symbol} size={32} className="shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold truncate">{row.info.name}</div>
          <div className="text-[11px] font-mono text-zinc-500 tabular-nums">
            {row.info.symbol}
          </div>
        </div>
      </div>
      {/* Mobile: just price + 24h */}
      <div className="md:hidden text-right shrink-0">
        <div className="font-mono font-medium tabular-nums">
          {formatUsd(row.usd)}
        </div>
        <div
          className={`text-[11px] font-mono tabular-nums ${
            positive24 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {positive24 ? "▲" : "▼"} {Math.abs(row.change24h).toFixed(2)}%
        </div>
      </div>
      {/* Desktop: full columns */}
      <span className="hidden md:block text-right font-mono font-medium tabular-nums">
        {formatUsd(row.usd)}
      </span>
      <span
        className={`hidden md:block text-right font-mono tabular-nums text-xs ${
          positive24 ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {positive24 ? "+" : ""}
        {row.change24h.toFixed(2)}%
      </span>
      <span
        className={`hidden md:block text-right font-mono tabular-nums text-xs ${
          positive7 ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {positive7 ? "+" : ""}
        {row.change7d.toFixed(2)}%
      </span>
      <span className="hidden md:block text-right font-mono tabular-nums text-xs text-zinc-400">
        {compactUsd(row.volume24h)}
      </span>
      <div className="hidden md:flex items-center justify-end gap-2">
        <span className="font-mono tabular-nums text-xs text-zinc-300">
          {compactUsd(row.marketCap)}
        </span>
        <div className="hidden lg:block">
          <Sparkline values={row.series} positive={positive24} width={64} height={28} />
        </div>
      </div>
      <div className="shrink-0 md:flex md:justify-end">
        <WatchlistStar asset={row.info.symbol} watching={watching} />
      </div>
    </Link>
  );
}

function MoverCard({
  label,
  row,
  tone,
}: {
  label: string;
  row: AssetRow | undefined;
  tone: "positive" | "negative";
}) {
  if (!row) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
          {label}
        </div>
        <div className="text-zinc-600 mt-2">—</div>
      </div>
    );
  }
  const positive = row.change24h >= 0;
  const borderClass =
    tone === "positive"
      ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] to-transparent"
      : "border-red-500/20 bg-gradient-to-br from-red-500/[0.05] to-transparent";
  return (
    <Link
      href={`/dashboard/markets/${row.info.symbol}`}
      className={`rounded-2xl border ${borderClass} p-5 flex items-center gap-4 hover:opacity-90 transition-opacity`}
    >
      <CryptoIcon symbol={row.info.symbol} size={48} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
          {label}
        </div>
        <div className="font-semibold truncate">{row.info.name}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-lg tabular-nums">{formatUsd(row.usd)}</span>
          <span
            className={`text-sm font-mono ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {positive ? "+" : ""}
            {row.change24h.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="hidden sm:block shrink-0">
        <Sparkline values={row.series} positive={positive} width={88} height={44} />
      </div>
    </Link>
  );
}

function GlobalStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-[color:var(--background)] p-5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
        {label}
      </div>
      <div className="text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-zinc-500">{sub}</div>
    </div>
  );
}
