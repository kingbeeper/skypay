import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fetchPrices } from "@/lib/prices";
import {
  ASSETS,
  formatUsd,
  type AssetSymbol,
  type AssetInfo,
} from "@/lib/assets";
import { PriceChart } from "../PriceChart";

const CHART_POINTS = 90;

function fnv1a32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deterministicSeries(
  symbol: string,
  endPrice: number,
  startPrice: number
): number[] {
  let seed = fnv1a32(symbol + ":chart");
  const pts: number[] = [];
  const volatility = Math.abs(endPrice - startPrice) * 0.4 + startPrice * 0.02;
  for (let i = 0; i < CHART_POINTS; i++) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed = seed >>> 0;
    const t = i / (CHART_POINTS - 1);
    const trend = startPrice + (endPrice - startPrice) * t;
    const noise = ((seed % 1000) / 1000 - 0.5) * volatility;
    pts.push(Math.max(0, trend + noise));
  }
  // Anchor end to actual current price
  pts[pts.length - 1] = endPrice;
  return pts;
}

// Synthetic market data deterministic per symbol — looks realistic for demo
function syntheticMarketStats(info: AssetInfo, price: number) {
  const seed = fnv1a32(info.symbol + ":stats");
  const rand = (offset: number) => {
    const s = (seed + offset) >>> 0;
    return ((s % 10000) / 10000) * 0.6 + 0.7; // 0.7 to 1.3 multiplier
  };
  return {
    marketCap: price * (info.symbol === "BTC" ? 19_700_000 : info.symbol === "ETH" ? 120_000_000 : info.symbol === "SOL" ? 460_000_000 : info.symbol === "USDC" ? 60_000_000_000 : 1) * rand(1),
    volume24h: price * (info.symbol === "BTC" ? 25_000 : info.symbol === "ETH" ? 350_000 : 4_000_000) * rand(2),
    high24h: price * (1 + 0.012 * rand(3)),
    low24h: price * (1 - 0.012 * rand(4)),
    ath: price * (info.symbol === "BTC" ? 1.18 : info.symbol === "ETH" ? 1.45 : 1.6) * rand(5),
  };
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  await requireUser();
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam.toUpperCase() as AssetSymbol;

  const info = ASSETS[symbol];
  if (!info || info.kind === "fiat") notFound();

  const prices = await fetchPrices();
  const usd = prices[symbol]?.usd ?? 0;
  const change24h = prices[symbol]?.change24h ?? 0;
  const startPrice = usd / (1 + change24h / 100);

  const series = deterministicSeries(symbol, usd, startPrice * 0.85);
  const stats = syntheticMarketStats(info, usd);

  const positive = change24h >= 0;

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/dashboard/markets"
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Volver a Mercados
        </Link>
        <div className="mt-3 flex items-center gap-4">
          <span
            className="inline-flex h-14 w-14 shrink-0 rounded-full items-center justify-center font-mono text-xl font-bold"
            style={{
              backgroundColor: info.color + "22",
              color: info.color,
            }}
          >
            {info.symbol[0]}
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">
              {info.name}
            </h1>
            <div className="text-sm font-mono text-zinc-500">{info.symbol}</div>
          </div>
          <div className="ml-auto text-right shrink-0">
            <div className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatUsd(usd)}
            </div>
            <div
              className={`text-sm font-mono ${
                positive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {positive ? "▲" : "▼"} {Math.abs(change24h).toFixed(2)}% · 24h
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
            Precio · últimos 90 días (sim)
          </h2>
          <div className="text-[10px] font-mono text-zinc-600">
            Datos históricos sintéticos · puntos finales reales
          </div>
        </div>
        <PriceChart values={series} positive={positive} />
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        <Stat label="Market cap" value={formatUsd(stats.marketCap)} />
        <Stat label="Volumen 24h" value={formatUsd(stats.volume24h)} />
        <Stat
          label="Máximo 24h"
          value={formatUsd(stats.high24h)}
          accent="emerald"
        />
        <Stat
          label="Mínimo 24h"
          value={formatUsd(stats.low24h)}
          accent="red"
        />
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        <Link
          href={`/dashboard/swap`}
          className="rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-400/[0.06] to-indigo-500/[0.04] p-5 hover:opacity-90 transition-opacity"
        >
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-300 mb-1">
            Comprar
          </div>
          <div className="font-medium">Swap a {info.symbol}</div>
        </Link>
        <Link
          href={`/dashboard/receive?asset=${info.symbol}`}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
        >
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Recibir
          </div>
          <div className="font-medium">Tu dirección {info.symbol}</div>
        </Link>
        <Link
          href={`/dashboard/send`}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
        >
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Enviar
          </div>
          <div className="font-medium">A wallet externa</div>
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-3">
          Sobre {info.name}
        </h2>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-sm text-zinc-400 leading-relaxed">
          {info.symbol === "BTC" &&
            "Bitcoin es la primera y mayor criptomoneda por capitalización. Lanzada en 2009 por Satoshi Nakamoto, opera sobre una blockchain Proof-of-Work descentralizada. Suministro máximo: 21M BTC."}
          {info.symbol === "ETH" &&
            "Ethereum es la blockchain de smart contracts líder. Su token ETH paga gas para ejecutar transacciones. Tras The Merge (2022) opera con Proof-of-Stake."}
          {info.symbol === "USDC" &&
            "USDC es un stablecoin respaldado 1:1 por dólares emitido por Circle. Existe en múltiples blockchains (Ethereum, Polygon, Base, Solana...) y se usa para evitar volatilidad."}
          {info.symbol === "SOL" &&
            "Solana es una blockchain de alto rendimiento conocida por su velocidad (<1s) y fees bajos. Su token nativo SOL paga gas y permite staking."}
        </div>
        <div className="mt-2 text-xs font-mono text-zinc-600">
          ATH histórico: {formatUsd(stats.ath)}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "red";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "red"
        ? "text-red-300"
        : "";
  return (
    <div className="bg-[color:var(--background)] p-5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
      </div>
      <div className={`text-lg font-semibold tracking-tight tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  );
}
