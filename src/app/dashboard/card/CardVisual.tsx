"use client";

import { useState } from "react";
import type { Card } from "@prisma/client";

export function CardVisual({ card }: { card: Card }) {
  const [revealed, setRevealed] = useState(false);

  const formattedPan = revealed
    ? card.pan.replace(/(.{4})/g, "$1 ").trim()
    : `4242 •••• •••• ${card.last4}`;

  const exp = `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`;

  return (
    <div className="space-y-4">
      <div
        className="relative aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl p-7 flex flex-col justify-between text-white"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #6d28d9 60%, #c026d3 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 100% 60% at 30% 30%, rgba(34, 211, 238, 0.4), transparent 50%), radial-gradient(ellipse 80% 50% at 80% 80%, rgba(244, 114, 182, 0.3), transparent 50%)",
          }}
        />
        <div className="relative flex justify-between items-start">
          <div className="flex items-center gap-2 font-semibold tracking-widest text-sm">
            <span className="inline-block h-5 w-5 rounded-md bg-gradient-to-br from-cyan-300 to-white" />
            SKYPAY
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider opacity-80 border border-white/30 rounded-full px-2 py-0.5">
            {card.type === "virtual" ? "virtual" : "physical"}
          </span>
        </div>

        <div className="relative">
          <div className="font-mono text-xl sm:text-2xl tracking-[0.2em] mb-5">
            {formattedPan}
          </div>
          <div className="flex justify-between items-end gap-6">
            <div className="min-w-0">
              <div className="text-[10px] opacity-60 uppercase tracking-wider mb-1">
                Holder
              </div>
              <div className="font-medium text-sm truncate">
                {card.holderName}
              </div>
            </div>
            <div className="shrink-0">
              <div className="text-[10px] opacity-60 uppercase tracking-wider mb-1">
                Exp
              </div>
              <div className="font-mono text-sm">{exp}</div>
            </div>
            <div className="shrink-0">
              <div className="text-[10px] opacity-60 uppercase tracking-wider mb-1">
                CVV
              </div>
              <div className="font-mono text-sm">
                {revealed ? card.cvv : "•••"}
              </div>
            </div>
            <div className="shrink-0 ml-auto">
              <svg viewBox="0 0 60 20" className="h-5">
                <text
                  x="0"
                  y="16"
                  fill="white"
                  fontFamily="Arial Black, sans-serif"
                  fontWeight="900"
                  fontStyle="italic"
                  fontSize="20"
                >
                  VISA
                </text>
              </svg>
            </div>
          </div>
        </div>

        {card.status === "frozen" && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-1">❄</div>
              <div className="text-sm font-mono uppercase tracking-wider">
                Congelada
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="w-full h-10 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-sm font-medium"
      >
        {revealed ? "Ocultar datos" : "Mostrar datos completos"}
      </button>
    </div>
  );
}
