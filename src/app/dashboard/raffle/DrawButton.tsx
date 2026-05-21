"use client";

import { useActionState, useEffect, useState } from "react";
import { drawRaffleAction, type DrawRaffleResult } from "@/app/actions";

type Props = {
  roundId: string;
  prizeBtc: number;
};

export function DrawButton({ roundId, prizeBtc }: Props) {
  const [state, formAction, pending] = useActionState<DrawRaffleResult, FormData>(
    drawRaffleAction,
    undefined
  );
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      const id = setTimeout(() => setRevealed(true), 1400);
      return () => clearTimeout(id);
    }
  }, [state]);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
        {!revealed ? (
          <div className="space-y-3">
            <div className="text-sm font-mono text-zinc-500">Eligiendo ticket ganador…</div>
            <div className="text-4xl font-mono tracking-tight tabular-nums">
              <span className="inline-block animate-pulse text-zinc-700">
                #••••••
              </span>
            </div>
          </div>
        ) : state.won ? (
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Resultado
            </div>
            <div className="text-3xl sm:text-4xl font-semibold tracking-tight">
              ¡Felicidades, ganaste!
            </div>
            <div className="text-lg">
              <span className="font-mono font-semibold text-amber-300">
                {prizeBtc} BTC
              </span>{" "}
              acreditados a tu cuenta.
            </div>
            <div className="text-xs font-mono text-zinc-500">
              Ticket #{String(state.winningIndex).padStart(6, "0")} de{" "}
              {state.totalTickets.toLocaleString("es-ES")} · {state.winnerLabel}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Resultado
            </div>
            <div className="text-2xl font-semibold tracking-tight text-zinc-300">
              Esta vez no fue tu turno.
            </div>
            <div className="text-sm text-zinc-400">
              Ganador:{" "}
              <span className="font-mono text-zinc-300">{state.winnerLabel}</span>
            </div>
            <div className="text-xs font-mono text-zinc-500">
              Ticket #{String(state.winningIndex).padStart(6, "0")} de{" "}
              {state.totalTickets.toLocaleString("es-ES")}
            </div>
            <div className="text-xs text-zinc-500 pt-2">
              Ya hay una nueva ronda abierta — recarga la página para verla.
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="roundId" value={roundId} />
      {state?.ok === false && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2 text-center">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-14 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-[length:200%_100%] hover:bg-right transition-[background-position] duration-500 text-black font-semibold text-base disabled:opacity-60"
      >
        {pending ? "Sorteando…" : `Realizar sorteo · ${prizeBtc} BTC en juego`}
      </button>
    </form>
  );
}
