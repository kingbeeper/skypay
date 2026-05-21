"use client";

import { useActionState, useState } from "react";
import { simulatePurchaseAction, type CardActionResult } from "@/app/actions";

const MERCHANTS: Array<{ name: string; category: string; min: number; max: number }> = [
  { name: "Starbucks", category: "coffee", min: 4, max: 9 },
  { name: "Whole Foods", category: "groceries", min: 35, max: 110 },
  { name: "Uber", category: "transport", min: 8, max: 32 },
  { name: "Netflix", category: "entertainment", min: 16, max: 16 },
  { name: "Apple Store", category: "online", min: 9, max: 299 },
  { name: "Shell Gas", category: "transport", min: 28, max: 65 },
  { name: "Chipotle", category: "food", min: 12, max: 22 },
  { name: "Amazon", category: "online", min: 14, max: 180 },
];

export function SimulatePurchase({
  cardId,
  disabled,
}: {
  cardId: string;
  disabled: boolean;
}) {
  const [merchantIdx, setMerchantIdx] = useState(0);
  const [amount, setAmount] = useState("12.50");

  const [state, formAction, pending] = useActionState<
    CardActionResult,
    FormData
  >(simulatePurchaseAction, undefined);

  const merchant = MERCHANTS[merchantIdx];

  const randomize = () => {
    const m = Math.floor(Math.random() * MERCHANTS.length);
    setMerchantIdx(m);
    const v = MERCHANTS[m];
    const amt = v.min + Math.random() * (v.max - v.min);
    setAmount(amt.toFixed(2));
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Simular compra</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Genera un cargo de prueba para ver el flujo cripto → fiat → comercio.
          </p>
        </div>
        <button
          type="button"
          onClick={randomize}
          className="h-8 rounded-full border border-white/10 px-3 text-xs text-zinc-300 hover:bg-white/[0.04] transition-colors"
        >
          Aleatorio
        </button>
      </div>

      <form action={formAction} className="grid sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
        <input type="hidden" name="cardId" value={cardId} />
        <input type="hidden" name="merchant" value={merchant.name} />
        <input type="hidden" name="category" value={merchant.category} />

        <label className="block">
          <span className="block text-xs text-zinc-400 mb-1.5 font-mono">Comercio</span>
          <select
            value={merchantIdx}
            onChange={(e) => setMerchantIdx(Number(e.target.value))}
            className="w-full h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            {MERCHANTS.map((m, i) => (
              <option key={m.name} value={i}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs text-zinc-400 mb-1.5 font-mono">Importe USD</span>
          <input
            type="text"
            inputMode="decimal"
            name="amount"
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
            className="w-full h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:outline-none focus:border-cyan-400/50"
          />
        </label>

        <button
          type="submit"
          disabled={pending || disabled}
          className="h-11 px-6 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Procesando…" : disabled ? "Tarjeta congelada" : "Cobrar"}
        </button>
      </form>

      {state?.ok === false && (
        <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p className="mt-4 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
          ✓ {state.message}
        </p>
      )}
    </section>
  );
}
