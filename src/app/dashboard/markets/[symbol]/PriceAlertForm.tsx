"use client";

import { useActionState, useState } from "react";
import {
  createPriceAlertAction,
  deletePriceAlertAction,
  type PriceAlertCreateResult,
} from "@/app/actions";

type Alert = {
  id: string;
  direction: string;
  targetUsd: number;
  triggered: boolean;
  triggeredAt: Date | null;
};

export function PriceAlertForm({
  asset,
  currentUsd,
  alerts,
}: {
  asset: string;
  currentUsd: number;
  alerts: Alert[];
}) {
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState(currentUsd.toFixed(currentUsd < 10 ? 2 : 0));
  const [state, formAction, pending] = useActionState<
    PriceAlertCreateResult,
    FormData
  >(createPriceAlertAction, undefined);

  const handleDelete = (id: string) => {
    const fd = new FormData();
    fd.append("id", id);
    deletePriceAlertAction(fd);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
      <div>
        <div className="font-medium">Alerta de precio</div>
        <div className="text-xs text-zinc-500 mt-1">
          Te notificamos cuando {asset} cruce el umbral.
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="asset" value={asset} />
        <input type="hidden" name="direction" value={direction} />
        <input type="hidden" name="targetUsd" value={target} />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection("above")}
            className={`h-10 rounded-xl text-sm font-medium transition-colors ${
              direction === "above"
                ? "bg-emerald-400/[0.12] border border-emerald-400/40 text-emerald-300"
                : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
            }`}
          >
            ▲ Cuando suba
          </button>
          <button
            type="button"
            onClick={() => setDirection("below")}
            className={`h-10 rounded-xl text-sm font-medium transition-colors ${
              direction === "below"
                ? "bg-red-400/[0.12] border border-red-400/40 text-red-300"
                : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
            }`}
          >
            ▼ Cuando baje
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-500">
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))}
            className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] pl-7 pr-3 text-base font-mono outline-none focus:border-cyan-400/40 transition-colors"
          />
        </div>

        {state?.ok === false && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}
        {state?.ok === true && (
          <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
            ✓ Alerta creada
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full h-10 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40"
        >
          {pending ? "Creando…" : "Crear alerta"}
        </button>
      </form>

      {alerts.length > 0 && (
        <div className="pt-2 border-t border-white/[0.06] space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Tus alertas
          </div>
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 text-xs rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
            >
              <span
                className={`font-mono ${
                  a.direction === "above" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {a.direction === "above" ? "▲" : "▼"}
              </span>
              <span className="font-mono">
                {a.direction === "above" ? "≥" : "≤"} $
                {a.targetUsd.toLocaleString()}
              </span>
              {a.triggered && (
                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/[0.08] px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-amber-300">
                  disparada
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="ml-auto text-zinc-500 hover:text-rose-400 transition-colors"
                aria-label="Eliminar alerta"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
