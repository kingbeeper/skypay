"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ASSETS,
  ASSET_LIST,
  formatAmount,
  formatUsd,
  type AssetSymbol,
} from "@/lib/assets";
import type { PriceMap } from "@/lib/prices";
import { CryptoIcon } from "@/components/CryptoIcon";

type Balance = { asset: string; amount: number };
type Flash = { dir: "up" | "down"; tick: number };

const BINANCE_STREAM_SYMBOLS: Record<string, AssetSymbol> = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  SOLUSDT: "SOL",
};

type Props = {
  balances: Balance[];
  initialPrices: PriceMap;
};

export function LiveDashboard({ balances, initialPrices }: Props) {
  const [prices, setPrices] = useState<PriceMap>(initialPrices);
  const [flashes, setFlashes] = useState<Record<string, Flash>>({});
  const [connected, setConnected] = useState(false);
  const prevPricesRef = useRef<PriceMap>(initialPrices);
  const tickCountersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let disposed = false;

    const streams = Object.keys(BINANCE_STREAM_SYMBOLS)
      .map((s) => `${s.toLowerCase()}@ticker`)
      .join("/");
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    const connect = () => {
      if (disposed || document.hidden) return;
      ws = new WebSocket(url);

      ws.onopen = () => {
        attempts = 0;
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            data: { s: string; c: string; P: string };
          };
          const symbol = BINANCE_STREAM_SYMBOLS[msg.data.s];
          if (!symbol) return;
          const usd = parseFloat(msg.data.c);
          const change24h = parseFloat(msg.data.P);
          if (!Number.isFinite(usd)) return;

          const prevUsd = prevPricesRef.current[symbol]?.usd ?? 0;
          if (prevUsd !== 0 && prevUsd !== usd) {
            const counter = (tickCountersRef.current[symbol] ?? 0) + 1;
            tickCountersRef.current[symbol] = counter;
            setFlashes((f) => ({
              ...f,
              [symbol]: { dir: usd > prevUsd ? "up" : "down", tick: counter },
            }));
          }
          prevPricesRef.current = {
            ...prevPricesRef.current,
            [symbol]: { usd, change24h },
          };
          setPrices((prev) => ({
            ...prev,
            [symbol]: { usd, change24h },
          }));
        } catch {
          // malformed frame — ignore
        }
      };

      ws.onerror = () => ws?.close();

      ws.onclose = () => {
        setConnected(false);
        if (disposed) return;
        attempts += 1;
        const delay = Math.min(1000 * 2 ** Math.min(attempts, 5), 30000);
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        ws?.close();
      } else {
        attempts = 0;
        connect();
      }
    };

    connect();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Show ALL supported cryptos (BTC, ETH, USDC, SOL) always — regardless of
  // whether the user holds any. The user's balance per asset is looked up;
  // missing entries default to 0. This keeps the "Activos" panel useful as a
  // live price board even for accounts with no holdings yet.
  const balanceMap = new Map(balances.map((b) => [b.asset, b.amount]));
  const rows = ASSET_LIST.map((info) => {
    const amount = balanceMap.get(info.symbol) ?? 0;
    const price = prices[info.symbol]?.usd ?? 0;
    const change24h = prices[info.symbol]?.change24h ?? 0;
    const usdValue = amount * price;
    return {
      symbol: info.symbol,
      info,
      amount,
      price,
      change24h,
      usdValue,
      holding: amount > 0,
    };
  });
  // Sort holdings first by USD value desc, then non-holdings alphabetically
  rows.sort((a, b) => {
    if (a.holding !== b.holding) return a.holding ? -1 : 1;
    if (a.holding) return b.usdValue - a.usdValue;
    return a.symbol.localeCompare(b.symbol);
  });

  const totalUsd = rows.reduce((sum, r) => sum + r.usdValue, 0);
  const heldRows = rows.filter((r) => r.holding);
  const heldCount = heldRows.length;
  const portfolio24h =
    totalUsd === 0
      ? 0
      : rows.reduce((sum, r) => sum + r.usdValue * (r.change24h / 100), 0);
  const portfolio24hPct = totalUsd === 0 ? 0 : (portfolio24h / totalUsd) * 100;
  // Top mover among all listed cryptos (not just held) — useful at-a-glance
  const topMover = [...rows].sort(
    (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)
  )[0];

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-mono text-cyan-400 mb-2">/ portfolio</p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="text-5xl sm:text-6xl font-semibold tracking-tight">
              {formatUsd(totalUsd)}
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span
                className={`font-mono ${
                  portfolio24h >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {portfolio24h >= 0 ? "▲" : "▼"} {formatUsd(Math.abs(portfolio24h))}{" "}
                ({portfolio24hPct.toFixed(2)}%)
              </span>
              <span className="text-zinc-500 text-xs font-mono">24h</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 sm:w-auto sm:flex">
            <ActionIcon
              href="/dashboard/deposit"
              label="Depositar"
              primary
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M12 3v12" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="4" y1="20" x2="20" y2="20" />
                </svg>
              }
            />
            <ActionIcon
              href="/dashboard/swap"
              label="Swap"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <polyline points="7 4 7 20 3 16" />
                  <polyline points="17 20 17 4 21 8" />
                </svg>
              }
            />
            <ActionIcon
              href="/dashboard/send"
              label="Enviar"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              }
            />
            <ActionIcon
              href="/dashboard/receive"
              label="Recibir"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <line x1="14" y1="14" x2="14" y2="17" />
                  <line x1="14" y1="20" x2="14" y2="21" />
                  <line x1="17" y1="14" x2="21" y2="14" />
                  <line x1="20" y1="17" x2="21" y2="17" />
                  <line x1="17" y1="21" x2="21" y2="21" />
                  <line x1="17" y1="17" x2="17" y2="17" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        <Stat
          label="Total cripto"
          value={formatUsd(totalUsd)}
          sub={`${heldCount} ${heldCount === 1 ? "activo" : "activos"} en cartera`}
        />
        <Stat
          label="Cambio 24h"
          value={`${portfolio24h >= 0 ? "+" : ""}${formatUsd(portfolio24h).replace("-", "")}`}
          sub={`${portfolio24h >= 0 ? "▲" : "▼"} ${Math.abs(portfolio24hPct).toFixed(2)}%`}
          accent={portfolio24h >= 0}
        />
        {topMover ? (
          <Stat
            label="Top movimiento 24h"
            value={`${topMover.symbol} · ${topMover.change24h >= 0 ? "+" : ""}${topMover.change24h.toFixed(2)}%`}
            sub={topMover.info.name}
          />
        ) : (
          <Stat label="Top movimiento 24h" value="—" sub="cargando precios" />
        )}
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Mercado</h2>
            <p className="text-xs font-mono text-zinc-500 mt-1">
              Precios en vivo · todas las criptos soportadas
            </p>
          </div>
          <LiveBadge connected={connected} />
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
          {rows.map((r) => {
            const flash = flashes[r.symbol];
            const flashClass =
              flash?.dir === "up"
                ? "price-flash-up"
                : flash?.dir === "down"
                  ? "price-flash-down"
                  : "";
            const flashKey = flash ? `${r.symbol}-${flash.tick}` : r.symbol;
            return (
              <Link
                key={r.symbol}
                href={`/dashboard/markets/${r.symbol}`}
                className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-white/[0.02] transition-colors group"
              >
                <CryptoIcon symbol={r.symbol} size={36} className="shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{r.info.name}</span>
                    {r.holding && (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300">
                        en cartera
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 tabular-nums mt-0.5">
                    {r.symbol}
                    {r.holding && (
                      <>
                        <span className="text-zinc-700 mx-1.5">·</span>
                        <span className="text-zinc-400">
                          {formatAmount(r.amount, r.symbol)} {r.symbol}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price + change */}
                <div className="text-right shrink-0 min-w-[100px]">
                  <div className="font-mono font-medium tabular-nums">
                    <span
                      key={`p-${flashKey}`}
                      className={`inline-block px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded ${flashClass}`}
                    >
                      {formatUsd(r.price)}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                      r.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {r.change24h >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(r.change24h).toFixed(2)}%
                  </div>
                </div>

                {/* Holding value (only if holds) */}
                <div className="text-right shrink-0 hidden sm:block min-w-[110px] border-l border-white/[0.04] pl-4">
                  {r.holding ? (
                    <>
                      <div className="font-mono font-semibold tabular-nums">
                        <span
                          key={`v-${flashKey}`}
                          className={`inline-block px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded ${flashClass}`}
                        >
                          {formatUsd(r.usdValue)}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        tu posición
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] font-mono text-zinc-600">
                      sin posición
                    </div>
                  )}
                </div>

                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function LiveBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
          <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        en vivo · Binance WS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs font-mono text-amber-400/80">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      reconectando…
    </span>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[color:var(--background)] p-6">
      <div className="text-xs font-mono text-zinc-500 mb-2">{label}</div>
      <div
        className={`text-2xl font-semibold tracking-tight ${
          accent ? "text-cyan-300" : ""
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{sub}</div>
    </div>
  );
}

function ActionIcon({
  href,
  label,
  icon,
  primary,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="group flex flex-col items-center gap-1.5 select-none"
    >
      <span
        className={`inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all ${
          primary
            ? "bg-gradient-to-br from-cyan-400 to-indigo-500 text-black group-hover:opacity-90 group-hover:scale-105 shadow-lg shadow-cyan-500/20"
            : "border border-white/15 bg-white/[0.03] text-zinc-200 group-hover:bg-white/[0.08] group-hover:scale-105 group-hover:border-white/25"
        }`}
      >
        {icon}
      </span>
      <span className="text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors">
        {label}
      </span>
    </Link>
  );
}
