"use client";

import { useActionState, useState } from "react";
import { buyTicketsAction, type BuyTicketsResult } from "@/app/actions";
import { formatUsd } from "@/lib/assets";

type Props = {
  ticketPriceUsd: number;
  usdBalance: number;
  disabled?: boolean;
};

const PRESETS = [1, 5, 10, 25, 100];

export function BuyTicketsForm({
  ticketPriceUsd,
  usdBalance,
  disabled,
}: Props) {
  const [tickets, setTickets] = useState<string>("1");
  const [state, formAction, pending] = useActionState<BuyTicketsResult, FormData>(
    buyTicketsAction,
    undefined
  );

  const n = Math.floor(Number(tickets));
  const valid = Number.isFinite(n) && n > 0;
  const cost = valid ? n * ticketPriceUsd : 0;
  const overBalance = valid && cost > usdBalance;
  const submitDisabled = !valid || overBalance || pending || disabled;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tickets" value={tickets} />

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-zinc-500">Cantidad de tickets</span>
          <span className="text-xs font-mono text-zinc-500">
            Saldo USD: {formatUsd(usdBalance)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            placeholder="1"
            value={tickets}
            onChange={(e) => setTickets(e.target.value.replace(/[^\d]/g, ""))}
            className="flex-1 bg-transparent text-3xl font-semibold tracking-tight outline-none text-white"
          />
          <div className="text-sm font-mono text-zinc-500">
            × {formatUsd(ticketPriceUsd)}
          </div>
        </div>
        <div className="mt-2 text-xs font-mono text-zinc-500">
          Total ≈ <span className="text-zinc-300">{formatUsd(cost)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTickets(String(p))}
              className="h-8 px-3 rounded-full border border-white/10 bg-white/[0.02] text-xs font-mono text-zinc-300 hover:bg-white/[0.06] transition-colors"
            >
              +{p}
            </button>
          ))}
        </div>
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
      {overBalance && !state?.ok && (
        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
          No te alcanza el saldo USD para esa cantidad
        </p>
      )}

      <button
        type="submit"
        disabled={submitDisabled}
        className="w-full h-12 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending
          ? "Comprando…"
          : disabled
            ? "Ronda cerrada"
            : `Comprar ${valid ? n : 0} ticket${n === 1 ? "" : "s"} · ${formatUsd(cost)}`}
      </button>
    </form>
  );
}
