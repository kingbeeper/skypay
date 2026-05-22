"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./nav";

type Props = {
  label: string;
  items: NavItem[];
};

export function NavDropdown({ label, items }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const activeChild = items.find((item) => pathname === item.href);

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
        aria-haspopup="true"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
          activeChild || open
            ? "text-white bg-white/[0.06]"
            : "text-zinc-300 hover:text-white hover:bg-white/[0.04]"
        }`}
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-white/[0.1] bg-[color:var(--background)] shadow-2xl shadow-black/40 overflow-hidden z-40 py-1"
        >
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                role="menuitem"
                href={item.soon ? "#" : item.href}
                onClick={(e) => {
                  if (item.soon) {
                    e.preventDefault();
                    return;
                  }
                  setOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 mx-1 rounded-lg text-sm transition-colors ${
                  item.soon
                    ? "text-zinc-600 cursor-not-allowed"
                    : active
                      ? "bg-white/[0.06] text-white"
                      : "text-zinc-300 hover:bg-white/[0.04]"
                }`}
              >
                <span className="font-medium">{item.label}</span>
                {item.soon && (
                  <span className="text-[10px] font-mono text-zinc-600">
                    soon
                  </span>
                )}
                {item.highlight && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
