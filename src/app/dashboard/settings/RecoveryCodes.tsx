"use client";

import { useState, useTransition } from "react";
import {
  regenerateRecoveryCodesAction,
  type RecoveryCodesResult,
} from "@/app/actions";

export function RecoveryCodes({ available }: { available: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RecoveryCodesResult>(undefined);

  const regenerate = () => {
    startTransition(async () => {
      const r = await regenerateRecoveryCodesAction();
      setResult(r);
    });
  };

  if (result?.ok) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-5 space-y-3">
        <div>
          <div className="font-medium">Tus 10 códigos de recuperación</div>
          <div className="text-xs text-zinc-500 mt-1">
            Guárdalos en un sitio seguro. Solo verás esto una vez. Cada código
            sirve <strong>una sola vez</strong> y reemplaza el código 2FA si
            pierdes acceso al autenticador.
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {result.codes.map((c) => (
            <code
              key={c}
              className="px-3 py-2 rounded-lg bg-[color:var(--background)] border border-white/10 font-mono text-sm select-all text-center"
            >
              {c}
            </code>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(result.codes.join("\n"))}
            className="h-8 px-3 rounded-full border border-amber-400/30 bg-amber-400/[0.06] text-xs font-mono text-amber-200 hover:bg-amber-400/[0.12] transition-colors"
          >
            Copiar todos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
      <div>
        <div className="font-medium">Códigos de recuperación</div>
        <div className="text-xs text-zinc-500 mt-1">
          Códigos de un solo uso para acceder si pierdes el autenticador.{" "}
          {available > 0 ? (
            <>
              Tienes{" "}
              <span className="font-mono text-zinc-300">{available}</span>{" "}
              disponibles.
            </>
          ) : (
            <>Aún no has generado ninguno.</>
          )}
        </div>
      </div>
      {result?.ok === false && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {result.error}
        </p>
      )}
      <div>
        <button
          type="button"
          onClick={regenerate}
          disabled={pending}
          className="h-9 px-4 rounded-full border border-white/15 bg-white/[0.02] text-sm font-medium hover:bg-white/[0.06] transition-colors disabled:opacity-40"
        >
          {pending
            ? "Generando…"
            : available > 0
              ? "Regenerar códigos"
              : "Generar 10 códigos"}
        </button>
      </div>
    </div>
  );
}
