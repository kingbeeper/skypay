"use client";

import { useTransition } from "react";
import { updateCardColorAction } from "@/app/actions";
import { CARD_THEMES } from "./CardVisual";

type Props = {
  cardId: string;
  current: string;
};

export function CardColorPicker({ cardId, current }: Props) {
  const [pending, startTransition] = useTransition();

  const set = (color: string) => {
    const fd = new FormData();
    fd.append("cardId", cardId);
    fd.append("color", color);
    startTransition(() => updateCardColorAction(fd));
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="mb-4">
        <div className="font-medium">Color de la tarjeta</div>
        <div className="text-xs text-zinc-500 mt-0.5">
          Cambia el aspecto visual. No afecta a las transacciones.
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(CARD_THEMES).map(([key, theme]) => {
          const active = key === current;
          return (
            <button
              key={key}
              type="button"
              onClick={() => set(key)}
              disabled={pending}
              aria-label={`Cambiar a tema ${theme.label}`}
              className={`group relative aspect-[1.586/1] rounded-xl overflow-hidden transition-transform ${
                active
                  ? "ring-2 ring-cyan-400 scale-105"
                  : "hover:scale-105 disabled:opacity-60"
              } disabled:cursor-wait`}
              style={{ background: theme.gradient }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(ellipse 100% 60% at 30% 30%, ${theme.accent}, transparent 50%)`,
                }}
              />
              {active && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="h-6 w-6 rounded-full bg-cyan-400 flex items-center justify-center text-black">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
              )}
              <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-white/80 uppercase tracking-wider">
                {theme.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
