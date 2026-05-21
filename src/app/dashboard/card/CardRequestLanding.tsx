"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestCardAction, type CardRequestResult } from "@/app/actions";
import { formatUsd } from "@/lib/assets";
import { MIN_USD_FOR_CARD } from "@/lib/cards";

const BENEFITS = [
  {
    title: "Cripto sin convertir",
    body: "Elige BTC, ETH, USDC o SOL como fuente de gasto. La tarjeta convierte al precio del mercado en cada cobro.",
  },
  {
    title: "Visa global",
    body: "Aceptada en millones de comercios físicos y online. Compatible con Apple Pay y Google Pay.",
  },
  {
    title: "Control total",
    body: "Congela y descongela al instante desde tu dashboard. Cambia la fuente de gasto cuando quieras.",
  },
];

type Props = {
  usdBalance: number;
};

export function CardRequestLanding({ usdBalance }: Props) {
  const [state, formAction, pending] = useActionState<
    CardRequestResult,
    FormData
  >(requestCardAction, undefined);

  const eligible = usdBalance >= MIN_USD_FOR_CARD;
  const remaining = Math.max(0, MIN_USD_FOR_CARD - usdBalance);
  const progress = Math.min(100, (usdBalance / MIN_USD_FOR_CARD) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <p className="text-sm font-mono text-cyan-400 mb-2">/ tarjeta</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Solicita tu tarjeta virtual
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
          Una Visa virtual que cobra al saldo cripto o fiat que tú elijas. Sin
          comisiones de emisión y sin afectar a tu balance — la conversión solo
          ocurre cuando pagas.
        </p>
      </div>

      {/* Eligibility */}
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Requisito de saldo
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
              eligible
                ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300"
                : "border-amber-500/30 bg-amber-500/[0.08] text-amber-300"
            }`}
          >
            {eligible ? "elegible" : "pendiente"}
          </span>
        </div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-4xl font-semibold tracking-tight tabular-nums">
            {formatUsd(usdBalance)}
          </div>
          <div className="text-sm text-zinc-500 font-mono">
            de {formatUsd(MIN_USD_FOR_CARD)} requeridos
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full transition-[width] duration-500 ${
              eligible
                ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                : "bg-gradient-to-r from-amber-400 to-orange-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {!eligible && (
          <p className="mt-3 text-xs text-zinc-500">
            Te faltan{" "}
            <span className="font-mono text-amber-300">
              {formatUsd(remaining)}
            </span>{" "}
            en USD para alcanzar el mínimo. Puedes depositar fiat o swap desde
            cripto.
          </p>
        )}
        {eligible && (
          <p className="mt-3 text-xs text-zinc-500">
            Cumples el requisito. Al solicitar, emitimos una Visa virtual al
            instante en tu nombre.
          </p>
        )}
      </section>

      {/* Benefits */}
      <section className="grid sm:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        {BENEFITS.map((b) => (
          <div key={b.title} className="bg-[color:var(--background)] p-5">
            <div className="text-xs font-mono text-cyan-400 mb-2">
              / {b.title.toLowerCase().split(" ")[0]}
            </div>
            <div className="font-medium mb-1.5">{b.title}</div>
            <p className="text-xs text-zinc-500 leading-relaxed">{b.body}</p>
          </div>
        ))}
      </section>

      {state?.ok === true && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-5 py-4 text-sm text-emerald-200">
          ✓ {state.message} · últimas 4 cifras{" "}
          <span className="font-mono">{state.last4}</span>. La página se está
          recargando…
        </div>
      )}
      {state?.ok === false && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.08] px-5 py-4 text-sm text-red-300">
          {state.error}
        </div>
      )}

      {eligible ? (
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending || state?.ok === true}
            className="w-full h-12 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending
              ? "Emitiendo tarjeta…"
              : state?.ok === true
                ? "Emitida"
                : "Solicitar tarjeta virtual"}
          </button>
        </form>
      ) : (
        <Link
          href="/dashboard/deposit"
          className="w-full h-12 inline-flex items-center justify-center rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
        >
          Hacer un depósito
        </Link>
      )}

      <p className="text-xs text-zinc-600 text-center max-w-md mx-auto leading-relaxed">
        Emisión instantánea y sin coste. Al solicitar aceptas los Términos del
        programa de tarjetas. Tu saldo no se ve afectado — la tarjeta solo
        descuenta cuando hay un pago.
      </p>
    </div>
  );
}
