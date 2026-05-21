"use client";

import { useTransition } from "react";
import type { Card } from "@prisma/client";
import {
  toggleFreezeAction,
  setSpendingSourceAction,
  requestPhysicalAction,
} from "@/app/actions";
import {
  ASSETS,
  formatAmount,
  formatUsd,
  type AssetInfo,
  type AssetSymbol,
} from "@/lib/assets";

type Props = {
  card: Card;
  assets: AssetInfo[];
  balances: Record<AssetSymbol, number>;
  sourcePrice: number;
  sourceUsdValue: number;
};

export function CardControls({ card, assets, balances }: Props) {
  const [freezePending, startFreeze] = useTransition();
  const [sourcePending, startSource] = useTransition();
  const [physicalPending, startPhysical] = useTransition();

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-medium">Congelar tarjeta</div>
            <div className="text-xs text-zinc-500">
              Bloquea cargos al instante. Puedes descongelar cuando quieras.
            </div>
          </div>
          <button
            type="button"
            disabled={freezePending}
            onClick={() => startFreeze(() => toggleFreezeAction(card.id))}
            className={`shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
              card.status === "frozen"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25"
                : "bg-amber-500/15 border border-amber-500/30 text-amber-200 hover:bg-amber-500/25"
            }`}
          >
            {freezePending
              ? "…"
              : card.status === "frozen"
                ? "Descongelar"
                : "Congelar"}
          </button>
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      <div>
        <div className="text-sm font-medium mb-3">Fuente de gasto</div>
        <p className="text-xs text-zinc-500 mb-3">
          Elige de qué saldo se debita al pagar. La conversión a USD se hace al
          precio del mercado en el momento del cobro.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {assets.map((a) => {
            const selected = card.spendingSource === a.symbol;
            return (
              <button
                key={a.symbol}
                type="button"
                disabled={sourcePending}
                onClick={() =>
                  startSource(() =>
                    setSpendingSourceAction(card.id, a.symbol)
                  )
                }
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 transition-colors disabled:opacity-50 ${
                  selected
                    ? "border-cyan-400/40 bg-cyan-400/[0.08]"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <span
                  className="inline-flex h-7 w-7 rounded-full items-center justify-center font-mono text-xs font-semibold"
                  style={{
                    backgroundColor: a.color + "22",
                    color: a.color,
                  }}
                >
                  {a.symbol[0]}
                </span>
                <span className="text-xs font-mono">{a.symbol}</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {formatAmount(balances[a.symbol], a.symbol)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">
              {card.type === "physical" ? "Tarjeta física activa" : "Tarjeta física"}
            </div>
            <div className="text-xs text-zinc-500">
              {card.physicalRequested
                ? "Solicitada. Llega en 5–7 días hábiles."
                : "Plástico Visa enviado a tu dirección de KYC."}
            </div>
          </div>
          {card.type === "virtual" && (
            <button
              type="button"
              disabled={physicalPending}
              onClick={() =>
                startPhysical(() => requestPhysicalAction(card.id))
              }
              className={`shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                card.physicalRequested
                  ? "border border-white/10 text-zinc-300 hover:bg-white/[0.04]"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {physicalPending
                ? "…"
                : card.physicalRequested
                  ? "Cancelar"
                  : "Solicitar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
