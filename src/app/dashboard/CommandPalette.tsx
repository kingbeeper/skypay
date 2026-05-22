"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Command = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: string;
  keywords?: string[];
};

const COMMANDS: Command[] = [
  // Navigation
  { id: "nav-dashboard", label: "Ir al Dashboard", href: "/dashboard", group: "Ir a", keywords: ["resumen", "home", "principal"] },
  { id: "nav-markets", label: "Mercados", href: "/dashboard/markets", group: "Ir a", keywords: ["precios", "btc", "eth"] },
  { id: "nav-swap", label: "Swap", href: "/dashboard/swap", group: "Ir a", keywords: ["cambiar", "convertir", "intercambio"] },
  { id: "nav-send", label: "Enviar cripto", href: "/dashboard/send", group: "Ir a", keywords: ["transferir", "withdraw"] },
  { id: "nav-p2p", label: "Pagar a otro usuario", href: "/dashboard/send-user", group: "Ir a", keywords: ["p2p", "venmo", "email"] },
  { id: "nav-receive", label: "Recibir", href: "/dashboard/receive", group: "Ir a", keywords: ["qr", "direccion", "deposito"] },
  { id: "nav-deposit", label: "Depositar", href: "/dashboard/deposit", group: "Ir a", keywords: ["añadir", "agregar fondos"] },
  { id: "nav-card", label: "Tarjeta", href: "/dashboard/card", group: "Ir a", keywords: ["visa", "pagar"] },
  { id: "nav-raffle", label: "Rifa", href: "/dashboard/raffle", group: "Ir a", keywords: ["lottery", "sorteo", "bitcoin"] },
  { id: "nav-history", label: "Historial", href: "/dashboard/history", group: "Ir a", keywords: ["transacciones", "movimientos"] },
  { id: "nav-settings", label: "Ajustes", href: "/dashboard/settings", group: "Ir a", keywords: ["configuracion", "perfil", "seguridad"] },

  // Quick actions
  { id: "act-deposit", label: "Hacer depósito", href: "/dashboard/deposit", group: "Acciones rápidas" },
  { id: "act-swap-btc", label: "Swap a BTC", href: "/dashboard/swap?to=BTC", group: "Acciones rápidas" },
  { id: "act-receive-btc", label: "Mi dirección BTC", href: "/dashboard/receive?asset=BTC", group: "Acciones rápidas" },
  { id: "act-receive-eth", label: "Mi dirección ETH", href: "/dashboard/receive?asset=ETH", group: "Acciones rápidas" },
  { id: "act-receive-usdc", label: "Mi dirección USDC", href: "/dashboard/receive?asset=USDC", group: "Acciones rápidas" },
  { id: "act-receive-sol", label: "Mi dirección SOL", href: "/dashboard/receive?asset=SOL", group: "Acciones rápidas" },
  { id: "act-buy-tickets", label: "Comprar tickets rifa", href: "/dashboard/raffle", group: "Acciones rápidas" },

  // Markets
  { id: "mkt-btc", label: "Bitcoin · BTC", hint: "Detalle + chart", href: "/dashboard/markets/BTC", group: "Mercados" },
  { id: "mkt-eth", label: "Ethereum · ETH", hint: "Detalle + chart", href: "/dashboard/markets/ETH", group: "Mercados" },
  { id: "mkt-usdc", label: "USD Coin · USDC", hint: "Detalle + chart", href: "/dashboard/markets/USDC", group: "Mercados" },
  { id: "mkt-sol", label: "Solana · SOL", hint: "Detalle + chart", href: "/dashboard/markets/SOL", group: "Mercados" },

  // Settings
  { id: "set-theme", label: "Cambiar tema (claro/oscuro)", href: "/dashboard/settings", group: "Ajustes", keywords: ["dark", "light", "color"] },
  { id: "set-password", label: "Cambiar contraseña", href: "/dashboard/settings", group: "Ajustes" },
  { id: "set-2fa", label: "Activar / desactivar 2FA", href: "/dashboard/settings", group: "Ajustes", keywords: ["totp", "seguridad", "google authenticator"] },
  { id: "set-tour", label: "Ver tour de bienvenida", href: "/dashboard/settings", group: "Ajustes" },
  { id: "set-delete", label: "Eliminar mi cuenta", href: "/dashboard/settings", group: "Ajustes" },

  // Marketing
  { id: "mkt-pricing", label: "Precios", href: "/pricing", group: "Sitio" },
  { id: "mkt-faq", label: "FAQ", href: "/faq", group: "Sitio" },
  { id: "mkt-status", label: "Status del sistema", href: "/status", group: "Sitio" },
];

function fuzzyMatch(query: string, command: Command): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const haystack = [
    command.label,
    command.hint ?? "",
    ...(command.keywords ?? []),
    command.group,
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes(q)) {
    // Higher score if match is in the label itself
    if (command.label.toLowerCase().includes(q)) return 2;
    return 1;
  }

  // Subsequence match (e.g. "btc" matches "Bitcoin · BTC")
  let qi = 0;
  for (let i = 0; i < haystack.length && qi < q.length; i++) {
    if (haystack[i] === q[qi]) qi++;
  }
  if (qi === q.length) return 0.5;

  return 0;
}

export function CommandPalette() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal requires document on mount
  useEffect(() => setMounted(true), []);

  // Global Cmd/Ctrl+K binding
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 0);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const filtered = useMemo(() => {
    const scored = COMMANDS.map((c) => ({ cmd: c, score: fuzzyMatch(query, c) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((s) => s.cmd);
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const c of filtered) {
      const list = map.get(c.group) ?? [];
      list.push(c);
      map.set(c.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatList = filtered;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flatList.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = flatList[activeIdx];
      if (cmd) execute(cmd);
    }
  };

  const execute = (cmd: Command) => {
    setOpen(false);
    router.push(cmd.href);
  };

  if (!mounted) return null;

  return (
    <>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[15vh]"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden
            />
            <div
              className="relative w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[color:var(--background)] shadow-2xl shadow-black/40 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-zinc-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIdx(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar acciones, páginas, mercados…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder-zinc-500"
                />
                <kbd className="hidden sm:inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                  esc
                </kbd>
              </div>

              <div
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto py-2"
              >
                {grouped.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-zinc-500">
                    Sin resultados para{" "}
                    <span className="font-mono text-zinc-300">
                      &quot;{query}&quot;
                    </span>
                  </div>
                ) : (
                  grouped.map(([group, items]) => (
                    <div key={group} className="mb-1">
                      <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                        {group}
                      </div>
                      {items.map((cmd) => {
                        const idx = flatList.indexOf(cmd);
                        const active = idx === activeIdx;
                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            onClick={() => execute(cmd)}
                            onMouseEnter={() => setActiveIdx(idx)}
                            className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              active
                                ? "bg-cyan-400/[0.08] text-zinc-100"
                                : "text-zinc-300 hover:bg-white/[0.04]"
                            }`}
                          >
                            <span className="flex-1 truncate">{cmd.label}</span>
                            {cmd.hint && (
                              <span className="text-[10px] font-mono text-zinc-500">
                                {cmd.hint}
                              </span>
                            )}
                            {active && (
                              <kbd className="inline-flex items-center rounded-md border border-cyan-400/30 bg-cyan-400/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                                ↵
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-white/[0.06] px-4 py-2 flex items-center justify-between text-[10px] font-mono text-zinc-600">
                <span>↑↓ navegar · ↵ abrir</span>
                <span>
                  <kbd className="rounded border border-white/10 px-1">⌘</kbd>{" "}
                  <kbd className="rounded border border-white/10 px-1">K</kbd>{" "}
                  para abrir
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
