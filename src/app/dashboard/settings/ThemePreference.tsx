"use client";

import { useTransition } from "react";
import { setThemeAction } from "@/app/actions";
import type { Theme } from "@/lib/theme";

export function ThemePreference({ current }: { current: Theme }) {
  const [pending, startTransition] = useTransition();

  const set = (theme: Theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    startTransition(() => setThemeAction(theme));
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Option
        label="Oscuro"
        description="Por defecto. Tema fondo negro."
        active={current === "dark"}
        onClick={() => set("dark")}
        disabled={pending}
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        }
      />
      <Option
        label="Claro"
        description="Fondo blanco. Para entornos con mucha luz."
        active={current === "light"}
        onClick={() => set("light")}
        disabled={pending}
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
            <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        }
      />
    </div>
  );
}

function Option({
  label,
  description,
  active,
  onClick,
  disabled,
  icon,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-xl border px-4 py-3.5 transition-colors disabled:opacity-60 ${
        active
          ? "border-cyan-400/40 bg-cyan-400/[0.08]"
          : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={active ? "text-cyan-300" : "text-zinc-400"}>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
        {active && (
          <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-cyan-300">
            activo
          </span>
        )}
      </div>
      <div className="text-xs text-zinc-500">{description}</div>
    </button>
  );
}
