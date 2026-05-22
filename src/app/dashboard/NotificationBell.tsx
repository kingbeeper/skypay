"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const POLL_MS = 30_000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items as Notification[]);
      setUnread(data.unread as number);
    } catch {
      // ignored
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(() => {
      if (!document.hidden) fetchData();
    }, POLL_MS);
    const onVis = () => {
      if (!document.hidden) fetchData();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
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
    document.addEventListener("mousedown", handler);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleMarkOne = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnread((u) => Math.max(0, u - 1));
    startTransition(() => markNotificationReadAction(id));
  };

  const handleMarkAll = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    startTransition(() => markAllNotificationsReadAction());
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-colors shrink-0 relative"
      >
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-mono font-semibold border border-[color:var(--background)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/[0.08] bg-[color:var(--background)] shadow-2xl shadow-black/40 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="text-sm font-semibold">Notificaciones</div>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={pending}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-40"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-white/[0.04]">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-zinc-500">
                Sin notificaciones
              </div>
            ) : (
              items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => {
                    if (!n.read) handleMarkOne(n.id);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const content = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 inline-block h-2 w-2 rounded-full shrink-0 ${
            n.read ? "bg-zinc-700" : "bg-cyan-400"
          }`}
        />
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-medium ${n.read ? "text-zinc-400" : "text-zinc-100"}`}
          >
            {n.title}
          </div>
          {n.body && (
            <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              {n.body}
            </div>
          )}
          <div className="text-[10px] font-mono text-zinc-600 mt-1">
            {relativeTime(n.createdAt)}
          </div>
        </div>
      </div>
    </>
  );

  if (n.link) {
    return (
      <Link
        href={n.link}
        onClick={onClick}
        className="block px-4 py-3 hover:bg-white/[0.04] transition-colors"
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors"
    >
      {content}
    </button>
  );
}

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}
