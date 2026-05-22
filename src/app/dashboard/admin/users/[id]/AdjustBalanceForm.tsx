"use client";

import { useActionState, useState } from "react";
import {
  adjustBalanceAction,
  type AdjustBalanceResult,
} from "@/app/actions";
import { ASSET_LIST, type AssetSymbol } from "@/lib/assets";

export function AdjustBalanceForm({ userId }: { userId: string }) {
  const [asset, setAsset] = useState<AssetSymbol>("USDC");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState<
    AdjustBalanceResult,
    FormData
  >(adjustBalanceAction, undefined);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-5 space-y-4"
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono uppercase tracking-wider text-rose-300">
          Ajustar balance
        </span>
        <span className="text-[10px] font-mono text-zinc-500">
          admin · crea registro en transacciones
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Activo
          </label>
          <select
            name="asset"
            value={asset}
            onChange={(e) => setAsset(e.target.value as AssetSymbol)}
            className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-medium appearance-none cursor-pointer hover:bg-white/[0.04] transition-colors"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23a1a1aa' stroke-width='2' viewBox='0 0 24 24'><path d='M6 9l6 6 6-6'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            {ASSET_LIST.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Delta (use + ó -)
          </label>
          <input
            type="text"
            name="delta"
            inputMode="decimal"
            value={delta}
            onChange={(e) =>
              setDelta(e.target.value.replace(/[^\d.\-]/g, ""))
            }
            placeholder="100 ó -50"
            className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-mono outline-none focus:border-rose-400/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Motivo (opcional)
          </label>
          <input
            type="text"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="bono, error, refund…"
            className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm outline-none focus:border-rose-400/40 transition-colors"
          />
        </div>
      </div>

      {state?.ok === false && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
          ✓ {state.message} · nuevo balance{" "}
          <span className="font-mono">
            {state.newAmount.toFixed(4)} {state.asset}
          </span>
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !delta}
          className="h-10 px-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm font-medium hover:bg-rose-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Aplicando…" : "Aplicar ajuste"}
        </button>
      </div>
    </form>
  );
}
