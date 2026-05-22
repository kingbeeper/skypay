"use client";

import { useState, useTransition } from "react";
import { updateCardLimitsAction } from "@/app/actions";
import { formatUsd } from "@/lib/assets";

type Props = {
  cardId: string;
  monthlyLimit: number;
  dailyPurchaseLimit: number;
  dailyWithdrawalLimit: number;
};

export function CardLimitsForm({
  cardId,
  monthlyLimit,
  dailyPurchaseLimit,
  dailyWithdrawalLimit,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [monthly, setMonthly] = useState(String(Math.round(monthlyLimit)));
  const [dailyPurchase, setDailyPurchase] = useState(
    String(Math.round(dailyPurchaseLimit))
  );
  const [dailyWithdrawal, setDailyWithdrawal] = useState(
    String(Math.round(dailyWithdrawalLimit))
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const reset = () => {
    setMonthly(String(Math.round(monthlyLimit)));
    setDailyPurchase(String(Math.round(dailyPurchaseLimit)));
    setDailyWithdrawal(String(Math.round(dailyWithdrawalLimit)));
  };

  const save = () => {
    const fd = new FormData();
    fd.append("cardId", cardId);
    fd.append("monthlyLimit", monthly);
    fd.append("dailyPurchaseLimit", dailyPurchase);
    fd.append("dailyWithdrawalLimit", dailyWithdrawal);
    startTransition(async () => {
      await updateCardLimitsAction(fd);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  if (!editing) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-medium">Límites de la tarjeta</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Configura cuánto puedes gastar.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-8 px-3 rounded-full border border-white/15 bg-white/[0.02] text-xs font-medium hover:bg-white/[0.06] transition-colors"
          >
            Editar
          </button>
        </div>

        <div className="space-y-3">
          <Row label="Mensual" value={formatUsd(monthlyLimit)} />
          <Row label="Compra diaria" value={formatUsd(dailyPurchaseLimit)} />
          <Row label="Retiro diario (ATM)" value={formatUsd(dailyWithdrawalLimit)} />
        </div>

        {saved && (
          <p className="mt-3 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
            ✓ Límites actualizados
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[0.04] p-5 space-y-4">
      <div>
        <div className="font-medium">Editar límites</div>
        <div className="text-xs text-zinc-500 mt-0.5">
          Los cambios aplican inmediatamente.
        </div>
      </div>

      <LimitInput
        label="Límite mensual"
        value={monthly}
        onChange={setMonthly}
        hint="suma de todas las compras del mes"
      />
      <LimitInput
        label="Compra diaria máxima"
        value={dailyPurchase}
        onChange={setDailyPurchase}
        hint="por día, todas las compras"
      />
      <LimitInput
        label="Retiro diario en cajero"
        value={dailyWithdrawal}
        onChange={setDailyWithdrawal}
        hint="0 = retiros deshabilitados"
      />

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={() => {
            reset();
            setEditing(false);
          }}
          disabled={pending}
          className="h-9 px-4 rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="h-9 px-4 rounded-full bg-cyan-400 text-black text-sm font-semibold hover:bg-cyan-300 transition-colors disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function LimitInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
          {label}
        </label>
        {hint && (
          <span className="text-[10px] font-mono text-zinc-600">{hint}</span>
        )}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-500">
          $
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
          className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] pl-7 pr-3 text-sm font-mono tabular-nums outline-none focus:border-cyan-400/40 transition-colors"
        />
      </div>
    </div>
  );
}
