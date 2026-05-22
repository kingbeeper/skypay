"use client";

import { useActionState, useState } from "react";
import { sendP2PAction, type P2PSendResult } from "@/app/actions";
import {
  ASSETS,
  formatAmount,
  type AssetInfo,
  type AssetSymbol,
} from "@/lib/assets";

type Props = {
  balances: Record<AssetSymbol, number>;
  assets: AssetInfo[];
};

export function P2PForm({ balances, assets }: Props) {
  const [asset, setAsset] = useState<AssetSymbol>("USDC");
  const [amount, setAmount] = useState("");
  const [state, formAction, pending] = useActionState<
    P2PSendResult,
    FormData
  >(sendP2PAction, undefined);

  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric > 0;
  const overBalance = valid && numeric > balances[asset];

  const handleMax = () => {
    const max = balances[asset];
    if (max > 0) {
      const precision = ASSETS[asset].precision;
      setAmount(max.toFixed(precision).replace(/\.?0+$/, ""));
    }
  };

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-2xl">
            ✓
          </div>
          <div className="mt-4 text-xs font-mono uppercase tracking-wider text-emerald-300/80">
            Transferencia instantánea
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {formatAmount(state.amount, state.asset as AssetSymbol)}{" "}
            <span className="text-emerald-300">{state.asset}</span>
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            enviado a{" "}
            <span className="font-mono text-zinc-200">
              {state.recipientLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full h-11 rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors"
        >
          Enviar otra
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
        <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          Correo del destinatario
        </label>
        <input
          name="recipientEmail"
          type="email"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="usuario@skypay.app"
          className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-mono outline-none focus:border-cyan-400/40 transition-colors"
        />
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-zinc-500">Cantidad</span>
          <span className="text-xs font-mono text-zinc-500">
            Balance: {formatAmount(balances[asset], asset)} {asset}
            {balances[asset] > 0 && (
              <button
                type="button"
                onClick={handleMax}
                className="ml-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Max
              </button>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            name="amount"
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d.]/g, "");
              const parts = cleaned.split(".");
              setAmount(
                parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned
              );
            }}
            className="flex-1 bg-transparent text-3xl font-semibold tracking-tight outline-none text-white"
          />
          <select
            name="asset"
            value={asset}
            onChange={(e) => setAsset(e.target.value as AssetSymbol)}
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
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-2">
          Mensaje (opcional)
        </label>
        <input
          name="note"
          type="text"
          maxLength={120}
          placeholder="Cena del viernes 🍕"
          className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm outline-none focus:border-cyan-400/40 transition-colors"
        />
      </div>

      {state?.ok === false && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {overBalance && !state?.ok && (
        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
          Excede tu saldo disponible
        </p>
      )}

      <button
        type="submit"
        disabled={!valid || overBalance || pending}
        className="w-full h-12 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "Enviando…" : "Enviar"}
      </button>

      <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
        Las transferencias P2P son instantáneas y gratuitas — quedan en
        Skypay sin tocar la blockchain.
      </p>
    </form>
  );
}
