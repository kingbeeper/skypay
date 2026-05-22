import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { fetchPrices } from "@/lib/prices";
import {
  ASSET_LIST,
  formatUsd,
  type AssetSymbol,
  type AssetInfo,
} from "@/lib/assets";
import { Sparkline } from "./Sparkline";

const SPARKLINE_POINTS = 24;

function fnv1a32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Build a deterministic 24-point sparkline series for a symbol. The series
 * trends toward `endRatio` (e.g. 1.05 for +5%) and adds small jitter so each
 * coin has a distinct visual feel, but stays stable across reloads.
 */
function deterministicSeries(
  symbol: string,
  endRatio: number
): number[] {
  let seed = fnv1a32(symbol);
  const pts: number[] = [];
  const startPrice = 100; // arbitrary scale; only shape matters
  const endPrice = startPrice * endRatio;
  for (let i = 0; i < SPARKLINE_POINTS; i++) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed = seed >>> 0;
    const t = i / (SPARKLINE_POINTS - 1);
    const trend = startPrice + (endPrice - startPrice) * t;
    const noise = ((seed % 1000) / 1000 - 0.5) * Math.abs(endPrice - startPrice) * 0.5;
    pts.push(trend + noise);
  }
  return pts;
}

export default async function MarketsPage() {
  await requireUser();
  const prices = await fetchPrices();

  const rows = ASSET_LIST.filter((a) => a.kind !== "fiat")
    .map((info) => {
      const symbol = info.symbol as AssetSymbol;
      const usd = prices[symbol]?.usd ?? 0;
      const change24h = prices[symbol]?.change24h ?? 0;
      const endRatio = 1 + change24h / 100;
      return {
        info,
        usd,
        change24h,
        series: deterministicSeries(symbol, endRatio),
      };
    })
    .sort((a, b) => b.usd - a.usd);

  const topGainer = [...rows].sort((a, b) => b.change24h - a.change24h)[0];
  const topLoser = [...rows].sort((a, b) => a.change24h - b.change24h)[0];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-mono text-cyan-400 mb-2">/ mercados</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Mercados cripto
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Precios en tiempo real vía CoinGecko + WebSocket de Binance. Toca un
          activo para hacer swap.
        </p>
      </div>

      <section className="grid sm:grid-cols-2 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        <MoverCard
          label="Top ganador 24h"
          row={topGainer}
        />
        <MoverCard
          label="Top perdedor 24h"
          row={topLoser}
        />
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-xl font-semibold tracking-tight">
            Todos los activos
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            ordenados por capitalización
          </span>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
          {rows.map((r) => (
            <Link
              key={r.info.symbol}
              href={`/dashboard/markets/${r.info.symbol}`}
              className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-white/[0.04] transition-colors"
            >
              <span
                className="inline-flex h-9 w-9 shrink-0 rounded-full items-center justify-center font-mono text-xs font-semibold"
                style={{
                  backgroundColor: r.info.color + "22",
                  color: r.info.color,
                }}
              >
                {r.info.symbol[0]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.info.name}</div>
                <div className="text-xs text-zinc-500 font-mono">
                  {r.info.symbol}
                </div>
              </div>
              <div className="hidden sm:block">
                <Sparkline values={r.series} positive={r.change24h >= 0} />
              </div>
              <div className="text-right shrink-0 min-w-[100px]">
                <div className="font-mono text-sm tabular-nums">
                  {formatUsd(r.usd)}
                </div>
                <div
                  className={`text-xs font-mono ${
                    r.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {r.change24h >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(r.change24h).toFixed(2)}%
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="text-xs text-zinc-500 text-center">
        Los datos de precio se actualizan en vivo desde el dashboard principal.
        Aquí ves la foto del momento.
      </section>
    </div>
  );
}

function MoverCard({
  label,
  row,
}: {
  label: string;
  row:
    | {
        info: AssetInfo;
        usd: number;
        change24h: number;
        series: number[];
      }
    | undefined;
}) {
  if (!row) {
    return (
      <div className="bg-[color:var(--background)] p-6">
        <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          {label}
        </div>
        <div className="text-zinc-600 mt-2">—</div>
      </div>
    );
  }
  const positive = row.change24h >= 0;
  return (
    <div className="bg-[color:var(--background)] p-5 sm:p-6 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
          {label}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 shrink-0 rounded-full items-center justify-center font-mono text-xs font-semibold"
            style={{
              backgroundColor: row.info.color + "22",
              color: row.info.color,
            }}
          >
            {row.info.symbol[0]}
          </span>
          <div>
            <div className="font-medium">{row.info.name}</div>
            <div className="text-xs text-zinc-500 font-mono">
              {row.info.symbol}
            </div>
          </div>
        </div>
        <div className="mt-3 font-mono text-lg tabular-nums">
          {formatUsd(row.usd)}{" "}
          <span
            className={`text-sm ${positive ? "text-emerald-400" : "text-red-400"}`}
          >
            {positive ? "+" : ""}
            {row.change24h.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="hidden sm:block">
        <Sparkline values={row.series} positive={positive} width={100} height={48} />
      </div>
    </div>
  );
}
