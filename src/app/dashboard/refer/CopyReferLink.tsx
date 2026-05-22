"use client";

import { useEffect, useState } from "react";

export function CopyReferLink({ code }: { code: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time on mount
  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const link = origin ? `${origin}/signup?ref=${code}` : "";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-[color:var(--background)]/60 px-3 py-2 font-mono text-xs break-all">
        {link || "cargando…"}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => copy(link)}
          disabled={!link}
          className="flex-1 h-10 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40"
        >
          {copied ? "✓ Copiado" : "Copiar link"}
        </button>
        <button
          type="button"
          onClick={() => copy(code)}
          className="h-10 px-4 rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors"
        >
          Copiar código
        </button>
      </div>
    </div>
  );
}
