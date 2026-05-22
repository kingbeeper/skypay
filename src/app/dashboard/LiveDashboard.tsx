"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ASSETS,
  formatAmount,
  formatUsd,
  type AssetSymbol,
} from "@/lib/assets";
import type { PriceMap } from "@/lib/prices";

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
  kycStatus: string;
};

export function LiveDashboard({ balances, initialPrices, kycStatus }: Props) {
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

  const rows = balances
    .map((b) => {
      const symbol = b.asset as AssetSymbol;
      const info = ASSETS[symbol];
      if (!info) return null;
      const price = prices[symbol]?.usd ?? 0;
      const change24h = prices[symbol]?.change24h ?? 0;
      const usdValue = b.amount * price;
      return { symbol, info, amount: b.amount, price, change24h, usdValue };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.usdValue - a.usdValue);

  const totalUsd = rows.reduce((sum, r) => sum + r.usdValue, 0);
  const cryptoOnlyUsd = rows
    .filter((r) => r.info.kind !== "fiat")
    .reduce((sum, r) => sum + r.usdValue, 0);
  const portfolio24h =
    totalUsd === 0
      ? 0
      : rows.reduce((sum, r) => sum + r.usdValue * (r.change24h / 100), 0);
  const portfolio24hPct = totalUsd === 0 ? 0 : (portfolio24h / totalUsd) * 100;

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
          label="Cripto"
          value={formatUsd(cryptoOnlyUsd)}
          sub={`${rows.filter((r) => r.info.kind !== "fiat").length} activos`}
        />
        <Stat
          label="Fiat disponible"
          value={formatUsd(rows.find((r) => r.symbol === "USD")?.amount ?? 0)}
          sub="USD"
        />
        <Stat
          label="KYC"
          value={kycStatus === "approved" ? "Verificado" : "Pendiente"}
          sub={kycStatus === "approved" ? "nivel 2" : "documentos requeridos"}
          accent={kycStatus === "approved"}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold tracking-tight">Activos</h2>
          <LiveBadge connected={connected} />
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-zinc-400 text-xs uppercase tracking-wider font-mono">
              <tr>
                <th className="text-left px-3 sm:px-5 py-3">Activo</th>
                <th className="text-right px-3 sm:px-5 py-3 hidden sm:table-cell">Precio</th>
                <th className="text-right px-3 sm:px-5 py-3 hidden md:table-cell">24h</th>
                <th className="text-right px-3 sm:px-5 py-3 hidden sm:table-cell">Balance</th>
                <th className="text-right px-3 sm:px-5 py-3">Valor USD</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr
                    key={r.symbol}
                    className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-3 sm:px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-8 w-8 shrink-0 rounded-full items-center justify-center font-mono text-xs font-semibold"
                          style={{
                            backgroundColor: r.info.color + "22",
                            color: r.info.color,
                          }}
                        >
                          {r.symbol[0]}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.info.name}</div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {r.symbol}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono sm:hidden mt-0.5">
                            {formatAmount(r.amount, r.symbol)} {r.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-3 sm:px-5 py-4 font-mono hidden sm:table-cell">
                      {r.info.kind === "fiat" ? (
                        "—"
                      ) : (
                        <span
                          key={`p-${flashKey}`}
                          className={`inline-block px-2 py-0.5 -mx-2 -my-0.5 rounded ${flashClass}`}
                        >
                          {formatUsd(r.price)}
                        </span>
                      )}
                    </td>
                    <td className="text-right px-3 sm:px-5 py-4 font-mono hidden md:table-cell">
                      {r.info.kind === "fiat" ? (
                        <span className="text-zinc-600">—</span>
                      ) : (
                        <span
                          className={
                            r.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {r.change24h >= 0 ? "+" : ""}
                          {r.change24h.toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td className="text-right px-3 sm:px-5 py-4 font-mono hidden sm:table-cell">
                      {formatAmount(r.amount, r.symbol)}
                    </td>
                    <td className="text-right px-3 sm:px-5 py-4 font-mono font-medium">
                      {r.info.kind === "fiat" ? (
                        formatUsd(r.usdValue)
                      ) : (
                        <span
                          key={`v-${flashKey}`}
                          className={`inline-block px-2 py-0.5 -mx-2 -my-0.5 rounded ${flashClass}`}
                        >
                          {formatUsd(r.usdValue)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="px-5 py-10 text-center text-zinc-500 text-sm">
              Sin balances todavía. Deposita para empezar.
            </div>
          )}
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
