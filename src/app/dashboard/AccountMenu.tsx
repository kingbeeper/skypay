"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions";

type Props = {
  email: string;
  name: string | null;
  isDemo: boolean;
  isAdmin: boolean;
};

const ITEMS = [
  {
    href: "/dashboard/history",
    label: "Historial",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/dashboard/refer",
    label: "Referidos",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Ajustes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function AccountMenu({ email, name, isDemo, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initial = (name ?? email).charAt(0).toUpperCase();
  const displayName = name ?? email.split("@")[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Menú de cuenta"
        className={`h-9 w-9 inline-flex items-center justify-center rounded-full font-mono text-sm font-semibold shrink-0 transition-all ${
          open
            ? "bg-gradient-to-br from-cyan-400 to-indigo-500 text-black scale-105"
            : "bg-gradient-to-br from-cyan-400/80 to-indigo-500/80 text-black hover:scale-105"
        }`}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-white/[0.1] bg-[color:var(--background)] shadow-2xl shadow-black/40 overflow-hidden z-40"
        >
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-black font-mono font-semibold">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{displayName}</div>
                <div className="text-[11px] font-mono text-zinc-500 truncate">
                  {email}
                </div>
              </div>
            </div>
            {(isDemo || isAdmin) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {isDemo && (
                  <span className="inline-flex h-5 items-center rounded-full border border-cyan-400/30 bg-cyan-400/[0.08] px-2 text-[10px] font-mono text-cyan-100">
                    demo
                  </span>
                )}
                {isAdmin && (
                  <span className="inline-flex h-5 items-center rounded-full border border-rose-400/30 bg-rose-400/[0.08] px-2 text-[10px] font-mono text-rose-200">
                    admin
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="py-1">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                role="menuitem"
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 mx-1 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <span className="text-zinc-500">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/[0.06] py-1">
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="w-full flex items-center gap-3 mx-1 px-3 py-2 rounded-lg text-sm text-rose-300 hover:bg-rose-400/[0.06] transition-colors"
                style={{ width: "calc(100% - 0.5rem)" }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
