"use client";

import { useSyncExternalStore } from "react";

type Props = { target: string };
type Parts = { d: number; h: number; m: number; s: number; over: boolean };

function diffParts(targetMs: number, nowMs: number): Parts {
  const ms = Math.max(0, targetMs - nowMs);
  const totalSec = Math.floor(ms / 1000);
  return {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
    over: ms === 0,
  };
}

// Shared clock with cached snapshot — useSyncExternalStore requires getSnapshot
// to return a stable value between tick notifications, otherwise React thinks
// the store changed on every render and loops forever.
let cachedNow = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (intervalId === null) {
    cachedNow = Date.now();
    intervalId = setInterval(() => {
      cachedNow = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
function getClientNow() {
  if (cachedNow === 0) cachedNow = Date.now();
  return cachedNow;
}
function getServerNow() {
  return 0;
}

export function Countdown({ target }: Props) {
  const targetMs = new Date(target).getTime();
  const now = useSyncExternalStore(subscribe, getClientNow, getServerNow);

  // Server snapshot returns 0 so the SSR HTML doesn't depend on wall-clock;
  // first client render replaces it with the real countdown.
  if (now === 0) {
    return (
      <div className="flex items-center gap-3 font-mono">
        <Cell value={0} label="días" />
        <Sep />
        <Cell value={0} label="horas" />
        <Sep />
        <Cell value={0} label="min" />
        <Sep />
        <Cell value={0} label="seg" />
      </div>
    );
  }

  const parts = diffParts(targetMs, now);

  if (parts.over) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-mono text-amber-300">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
        sorteo disponible
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 font-mono">
      <Cell value={parts.d} label="días" />
      <Sep />
      <Cell value={parts.h} label="horas" />
      <Sep />
      <Cell value={parts.m} label="min" />
      <Sep />
      <Cell value={parts.s} label="seg" />
    </div>
  );
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function Sep() {
  return <div className="text-2xl text-zinc-700 -mt-3">:</div>;
}
