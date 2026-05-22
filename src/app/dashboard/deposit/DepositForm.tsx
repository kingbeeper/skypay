"use client";

import { useActionState, useState } from "react";
import { depositAction, type DepositResult } from "@/app/actions";
import {
  ASSETS,
  formatAmount,
  formatUsd,
  type AssetInfo,
  type AssetSymbol,
} from "@/lib/assets";

type Props = {
  balances: Record<AssetSymbol, number>;
  prices: Record<AssetSymbol, number>;
  assets: AssetInfo[];
};

type Method = "bank" | "card" | "crypto";

const METHODS: Array<{ id: Method; label: string; sub: string }> = [
  { id: "bank", label: "Transferencia", sub: "1–2 días · gratis" },
  { id: "card", label: "Tarjeta", sub: "instantáneo · 1.5%" },
  { id: "crypto", label: "Depósito cripto", sub: "instantáneo · gratis" },
];

const PRESETS_STABLE = [100, 500, 1000, 5000];
const PRESETS_CRYPTO: Record<Exclude<AssetSymbol, "USDC">, number[]> = {
  BTC: [0.01, 0.05, 0.1, 0.5],
  ETH: [0.1, 0.5, 1, 5],
  SOL: [1, 5, 10, 50],
};

export function DepositForm({ balances, prices, assets }: Props) {
  const [asset, setAsset] = useState<AssetSymbol>("USDC");
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<Method>("bank");

  const [state, formAction, pending] = useActionState<DepositResult, FormData>(
    depositAction,
    undefined
  );

  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric > 0;
  const usdValue = valid ? numeric * (prices[asset] ?? 0) : 0;

  const presets: number[] =
    asset === "USDC"
      ? PRESETS_STABLE
      : PRESETS_CRYPTO[asset as Exclude<AssetSymbol, "USDC">] ?? [];

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="asset" value={asset} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="method" value={method} />

      <div>
        <div className="text-xs font-mono text-zinc-500 mb-2">Método</div>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => {
            const selected = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`text-left rounded-xl border px-3 py-3 transition-colors ${
                  selected
                    ? "border-cyan-400/40 bg-cyan-400/[0.08]"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {m.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-zinc-500">Cantidad</span>
          <span className="text-xs font-mono text-zinc-500">
            Saldo actual: {formatAmount(balances[asset], asset)} {asset}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d.]/g, "");
              const parts = cleaned.split(".");
              const safe =
                parts.length > 2
                  ? `${parts[0]}.${parts.slice(1).join("")}`
                  : cleaned;
              setAmount(safe);
            }}
            className="flex-1 bg-transparent text-3xl font-semibold tracking-tight outline-none text-white"
          />
          <select
            value={asset}
            onChange={(e) => {
              setAsset(e.target.value as AssetSymbol);
              setAmount("");
            }}
            className="h-11 rounded-full border border-white/10 bg-white/[0.04] px-4 pr-8 text-sm font-medium appearance-none cursor-pointer hover:bg-white/[0.07] transition-colors"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23a1a1aa' stroke-width='2' viewBox='0 0 24 24'><path d='M6 9l6 6 6-6'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            {assets.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 text-xs font-mono text-zinc-500">
          ≈ {formatUsd(usdValue)}{" "}
          <span className="ml-2 text-zinc-600">{ASSETS[asset].name}</span>
        </div>

        {presets.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(p))}
                className="h-8 px-3 rounded-full border border-white/10 bg-white/[0.02] text-xs font-mono text-zinc-300 hover:bg-white/[0.06] transition-colors"
              >
                {asset === "USDC" ? "$" : ""}
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {state?.ok === false && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
          ✓ {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!valid || pending}
        className="w-full h-12 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "Acreditando…" : "Depositar"}
      </button>
    </form>
  );
}
