"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { isGroup, type NavEntry, type NavItem } from "./nav";

export type { NavItem } from "./nav";

type Props = {
  entries: NavEntry[];
  accountItems: NavItem[];
  userEmail: string;
  userName: string | null;
  isDemo: boolean;
  isAdmin: boolean;
};

export function MobileNav({
  entries,
  accountItems,
  userEmail,
  userName,
  isDemo,
  isAdmin,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal requires document.body on mount
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const displayName = userName ?? userEmail.split("@")[0];

  const overlay = (
    <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
        className={`fixed inset-y-0 left-0 z-[110] w-80 max-w-[85vw] bg-[color:var(--background)] border-r border-white/10 flex flex-col md:hidden transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/[0.06] shrink-0">
          <span className="font-mono font-semibold uppercase tracking-[0.2em] text-sm flex items-center gap-2">
            <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-cyan-400 to-indigo-500" />
            SKYPAY
          </span>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          <Section title="Principal">
            {entries.map((entry, i) =>
              isGroup(entry) ? null : (
                <NavLink
                  key={`${entry.href}-${i}`}
                  item={entry}
                  active={pathname === entry.href}
                  onNavigate={() => setOpen(false)}
                />
              )
            )}
          </Section>

          {entries.filter(isGroup).map((group) => (
            <Section key={group.label} title={group.label}>
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </Section>
          ))}

          {accountItems.length > 0 && (
            <Section title="Cuenta">
              {accountItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </Section>
          )}
        </nav>

        <div className="border-t border-white/[0.06] px-4 py-4 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-black font-mono font-semibold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{displayName}</div>
              <div className="text-[11px] font-mono text-zinc-500 truncate">
                {userEmail}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {isDemo && (
              <span className="inline-flex h-6 items-center rounded-full border border-cyan-400/30 bg-cyan-400/[0.08] px-2 text-[10px] font-mono text-cyan-100">
                demo
              </span>
            )}
            {isAdmin && (
              <span className="inline-flex h-6 items-center rounded-full border border-rose-400/30 bg-rose-400/[0.08] px-2 text-[10px] font-mono text-rose-200">
                admin
              </span>
            )}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full h-9 rounded-full border border-rose-500/30 bg-rose-500/[0.06] text-rose-200 text-xs font-medium hover:bg-rose-500/[0.12] transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-colors shrink-0"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <div className="px-3 mb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
        {title}
      </div>
      {children}
    </div>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const base =
    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors";
  const tone = item.soon
    ? "text-zinc-600 cursor-not-allowed"
    : item.admin
      ? active
        ? "bg-rose-400/[0.08] text-rose-200"
        : "text-rose-300 hover:bg-rose-400/[0.06]"
      : item.highlight
        ? active
          ? "bg-amber-400/[0.08] text-amber-200"
          : "text-amber-300 hover:bg-amber-400/[0.06]"
        : active
          ? "bg-white/[0.06] text-white"
          : "text-zinc-300 hover:bg-white/[0.04]";
  return (
    <Link
      href={item.soon ? "#" : item.href}
      onClick={(e) => {
        if (item.soon) {
          e.preventDefault();
          return;
        }
        onNavigate();
      }}
      className={`${base} ${tone}`}
    >
      <span className="font-medium">{item.label}</span>
      <span className="flex items-center gap-1.5">
        {item.soon && (
          <span className="text-[10px] font-mono text-zinc-600">soon</span>
        )}
        {item.highlight && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        )}
        {item.admin && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400/80">
            ★
          </span>
        )}
      </span>
    </Link>
  );
}
