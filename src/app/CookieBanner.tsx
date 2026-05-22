"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "skypay-cookie-consent";

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- only runs once on mount
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      // localStorage blocked → don't show banner
    }
  }, [mounted]);

  const accept = () => {
    try {
      localStorage.setItem(KEY, "accepted");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[150]">
      <div className="rounded-2xl border border-white/15 bg-[color:var(--background)]/95 backdrop-blur-md shadow-2xl p-4 sm:p-5">
        <div className="text-sm">
          <p className="text-zinc-200">
            Usamos solo cookies esenciales — sesión, preferencia de tema y este
            aviso. Sin tracking ni publicidad.
          </p>
          <p className="mt-1.5 text-xs text-zinc-500">
            Detalles en{" "}
            <Link href="/privacy" className="text-cyan-400 hover:underline">
              Política de privacidad
            </Link>
            .
          </p>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={accept}
            className="h-9 px-4 rounded-full bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
