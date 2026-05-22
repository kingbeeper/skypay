"use client";

import { useState, useTransition } from "react";
import { submitKycAction } from "@/app/actions";

type Step = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const STEPS: Step[] = [
  {
    id: "id",
    label: "Documento de identidad",
    description: "Sube el frente y reverso de tu DNI, pasaporte o licencia.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8" cy="11" r="2" />
        <line x1="14" y1="9" x2="18" y2="9" />
        <line x1="14" y1="13" x2="18" y2="13" />
        <line x1="6" y1="16" x2="18" y2="16" />
      </svg>
    ),
  },
  {
    id: "selfie",
    label: "Selfie con verificación de vida",
    description: "Una foto rápida para verificar que eres tú.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    id: "address",
    label: "Comprobante de domicilio",
    description: "Factura de servicios, extracto bancario, etc. (últimos 3 meses)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

type Props = {
  status: string;
};

export function KycVerification({ status }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "approved") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 rounded-full items-center justify-center bg-emerald-500/20 text-emerald-300">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div>
            <div className="font-medium text-emerald-200">
              Identidad verificada
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Tienes acceso completo a todos los límites y funciones. Esta
              verificación es válida indefinidamente salvo que cambies datos
              personales.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allDone = STEPS.every((s) => completed.has(s.id));

  const handleStep = (id: string) => {
    setCompleted((prev) => new Set(prev).add(id));
  };

  const handleSubmit = () => {
    setError(null);
    setSubmitting(true);
    startTransition(async () => {
      // Simula que el documento se procesa (1.5s)
      await new Promise((r) => setTimeout(r, 1500));
      const result = await submitKycAction();
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 rounded-full items-center justify-center bg-amber-500/15 text-amber-300">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <div>
          <div className="font-medium text-amber-200">
            Verificación pendiente
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Algunos límites están reducidos hasta que verifiques tu identidad.
            El proceso dura ~2 minutos y la aprobación es instantánea.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {STEPS.map((step) => {
          const done = completed.has(step.id);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStep(step.id)}
              disabled={done || submitting}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                done
                  ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                  : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
              } disabled:cursor-default`}
            >
              <span
                className={`inline-flex h-9 w-9 shrink-0 rounded-full items-center justify-center ${
                  done
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-white/[0.04] text-zinc-400"
                }`}
              >
                {done ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.icon
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{step.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {step.description}
                </div>
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider shrink-0 ${
                  done ? "text-emerald-300" : "text-zinc-500"
                }`}
              >
                {done ? "listo" : "subir"}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allDone || pending || submitting}
        className="w-full h-11 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting
          ? "Verificando…"
          : allDone
            ? "Enviar para verificación"
            : `Completa ${STEPS.length - completed.size} paso${STEPS.length - completed.size === 1 ? "" : "s"}`}
      </button>

      <p className="text-[10px] text-zinc-600 text-center">
        Demo: los documentos no se almacenan. En producción se procesarían con
        proveedor KYC y revisor humano.
      </p>
    </div>
  );
}
