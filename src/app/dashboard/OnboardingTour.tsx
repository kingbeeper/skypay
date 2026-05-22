"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "skypay-onboarding-done";

type Step = {
  title: string;
  body: string;
  hint?: string;
};

const STEPS: Step[] = [
  {
    title: "Bienvenido a Skypay",
    body: "Esta es una demo de una app de cripto + tarjeta. Te muestro las 4 cosas que importan en 30 segundos. Puedes saltar cuando quieras.",
  },
  {
    title: "Tu portfolio en tiempo real",
    body: "El dashboard muestra tus balances y los precios actualizados al segundo desde Binance WebSocket. Cuando cambia el precio verás un flash verde o rojo.",
    hint: "Verás un punto verde 'en vivo · Binance WS' arriba a la derecha de la tabla.",
  },
  {
    title: "Mueve dinero entre activos",
    body: "Desde el menú: Depositar añade fondos, Swap intercambia entre activos, Enviar y Recibir trabajan con direcciones on-chain (simuladas).",
  },
  {
    title: "Tarjeta + Rifa mensual",
    body: "Pide una tarjeta virtual cuando llegues a $100 USD, configura qué cripto gasta y prueba la simulación de compra. Y no olvides la rifa de 1 BTC al mes.",
    hint: "Hay un atajo en modo demo para saltar al sorteo sin esperar a fin de mes.",
  },
  {
    title: "Listo · ¡a explorar!",
    body: "Si necesitas el tour de nuevo, lo encontrarás en Ajustes. Disfruta.",
  },
];

export function OnboardingTour() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal needs document on mount
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {
      // localStorage blocked → don't show
    }
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const next = () => {
    if (step === STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!mounted || !open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={finish}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-3xl border border-cyan-400/30 bg-[color:var(--background)] shadow-2xl shadow-cyan-500/10 p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">
            Tour · {step + 1} / {STEPS.length}
          </div>
          <button
            type="button"
            onClick={finish}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            saltar
          </button>
        </div>

        <h2 className="text-xl font-semibold tracking-tight">
          {current.title}
        </h2>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          {current.body}
        </p>
        {current.hint && (
          <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] px-3 py-2 text-xs text-cyan-200/90">
            {current.hint}
          </div>
        )}

        <div className="mt-6 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step
                  ? "bg-cyan-400 w-8"
                  : i < step
                    ? "bg-cyan-400/40 w-4"
                    : "bg-white/10 w-4"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="h-11 px-4 rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors"
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="flex-1 h-11 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-semibold hover:opacity-90 transition-opacity"
          >
            {isLast ? "Terminar tour" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
