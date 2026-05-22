"use client";

import { useTransition } from "react";
import { setThemeAction } from "@/app/actions";

type Props = {
  current: "dark" | "light";
};

export function ThemeToggle({ current }: Props) {
  const [pending, startTransition] = useTransition();
  const next = current === "dark" ? "light" : "dark";

  const handleClick = () => {
    // Optimistic UI: flip the attribute on <html> immediately so the user
    // sees the change without a server round-trip flicker.
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
    startTransition(() => setThemeAction(next));
  };

  return (
    <button
      type="button"
      aria-label={current === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={current === "dark" ? "Tema claro" : "Tema oscuro"}
      onClick={handleClick}
      disabled={pending}
      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-colors shrink-0 disabled:opacity-60"
    >
      {current === "dark" ? (
        // Sun icon → click to go light
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
          <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
          <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
        </svg>
      ) : (
        // Moon icon → click to go dark
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
