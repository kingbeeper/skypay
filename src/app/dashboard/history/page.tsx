import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ASSETS,
  formatAmount,
  formatUsd,
  type AssetSymbol,
} from "@/lib/assets";

type Filter = "all" | "swap" | "deposito" | "envio" | "tarjeta";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todo" },
  { key: "swap", label: "Swaps" },
  { key: "deposito", label: "Depósitos" },
  { key: "envio", label: "Envíos" },
  { key: "tarjeta", label: "Tarjeta" },
];

type TimelineEntry =
  | {
      kind: "swap";
      id: string;
      at: Date;
      status: string;
      fromAsset: AssetSymbol;
      toAsset: AssetSymbol;
      fromAmount: number;
      toAmount: number;
      rate: number;
    }
  | {
      kind: "deposit";
      id: string;
      at: Date;
      status: string;
      toAsset: AssetSymbol;
      toAmount: number;
      description: string | null;
    }
  | {
      kind: "send";
      id: string;
      at: Date;
      status: string;
      fromAsset: AssetSymbol;
      fromAmount: number;
      description: string | null;
    }
  | {
      kind: "card";
      id: string;
      at: Date;
      status: string;
      merchant: string;
      category: string;
      amountUsd: number;
      sourceAsset: AssetSymbol;
      sourceAmount: number;
    };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const user = await requireUser();
  const { tipo } = await searchParams;
  const filter: Filter = isFilter(tipo) ? tipo : "all";

  const [transactions, cardTxs] = await Promise.all([
    filter === "tarjeta"
      ? Promise.resolve([])
      : prisma.transaction.findMany({
          where: {
            userId: user.id,
            ...(filter === "swap" && { type: "swap" }),
            ...(filter === "deposito" && { type: "deposit" }),
            ...(filter === "envio" && { type: "send" }),
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
    filter === "swap" || filter === "deposito" || filter === "envio"
      ? Promise.resolve([])
      : prisma.cardTransaction.findMany({
          where: { card: { userId: user.id } },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
  ]);

  const entries: TimelineEntry[] = [];

  for (const t of transactions) {
    if (t.type === "swap" && t.fromAsset && t.toAsset && t.fromAmount && t.toAmount) {
      entries.push({
        kind: "swap",
        id: t.id,
        at: t.createdAt,
        status: t.status,
        fromAsset: t.fromAsset as AssetSymbol,
        toAsset: t.toAsset as AssetSymbol,
        fromAmount: t.fromAmount,
        toAmount: t.toAmount,
        rate: t.rate ?? 0,
      });
    } else if (t.type === "deposit" && t.toAsset && t.toAmount) {
      entries.push({
        kind: "deposit",
        id: t.id,
        at: t.createdAt,
        status: t.status,
        toAsset: t.toAsset as AssetSymbol,
        toAmount: t.toAmount,
        description: t.description,
      });
    } else if (t.type === "send" && t.fromAsset && t.fromAmount) {
      entries.push({
        kind: "send",
        id: t.id,
        at: t.createdAt,
        status: t.status,
        fromAsset: t.fromAsset as AssetSymbol,
        fromAmount: t.fromAmount,
        description: t.description,
      });
    }
  }
  for (const c of cardTxs) {
    entries.push({
      kind: "card",
      id: c.id,
      at: c.createdAt,
      status: c.status,
      merchant: c.merchant,
      category: c.category,
      amountUsd: c.amountUsd,
      sourceAsset: c.sourceAsset as AssetSymbol,
      sourceAmount: c.sourceAmount,
    });
  }
  entries.sort((a, b) => b.at.getTime() - a.at.getTime());

  const groups = groupByDay(entries);

  const counts = {
    all: entries.length,
    swap: entries.filter((e) => e.kind === "swap").length,
    deposito: entries.filter((e) => e.kind === "deposit").length,
    envio: entries.filter((e) => e.kind === "send").length,
    tarjeta: entries.filter((e) => e.kind === "card").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-mono text-cyan-400 mb-2">/ historial</p>
        <h1 className="text-3xl font-semibold tracking-tight">Movimientos</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Swaps, depósitos y pagos con tarjeta. Mostrando los últimos 200.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const href = f.key === "all" ? "/dashboard/history" : `/dashboard/history?tipo=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`inline-flex items-center gap-2 h-8 rounded-full px-3 text-xs font-mono transition-colors ${
                active
                  ? "bg-white text-black"
                  : "border border-white/10 text-zinc-300 hover:bg-white/[0.04]"
              }`}
            >
              {f.label}
              <span
                className={`text-[10px] ${
                  active ? "text-black/50" : "text-zinc-500"
                }`}
              >
                {counts[f.key]}
              </span>
            </Link>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-8">
          {groups.map(([dayLabel, dayEntries]) => (
            <section key={dayLabel}>
              <div className="mb-3 text-xs font-mono uppercase tracking-wider text-zinc-500">
                {dayLabel}
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
                {dayEntries.map((e) => (
                  <EntryRow key={`${e.kind}-${e.id}`} entry={e} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function isFilter(v: string | undefined): v is Filter {
  return (
    v === "swap" ||
    v === "deposito" ||
    v === "envio" ||
    v === "tarjeta" ||
    v === "all"
  );
}

function groupByDay(entries: TimelineEntry[]): [string, TimelineEntry[]][] {
  const out: Record<string, TimelineEntry[]> = {};
  const order: string[] = [];
  for (const e of entries) {
    const label = formatDayLabel(e.at);
    if (!out[label]) {
      out[label] = [];
      order.push(label);
    }
    out[label].push(e);
  }
  return order.map((k) => [k, out[k]]);
}

function formatDayLabel(d: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86_400_000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) {
    return d.toLocaleDateString("es-ES", { weekday: "long" });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  }
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function EntryRow({ entry }: { entry: TimelineEntry }) {
  const time = formatTime(entry.at);
  const failed = entry.status !== "completed" && entry.status !== "approved";

  if (entry.kind === "swap") {
    const fromInfo = ASSETS[entry.fromAsset];
    const toInfo = ASSETS[entry.toAsset];
    return (
      <Row
        time={time}
        icon={<TypeIcon symbol="↔" tint="#22d3ee" />}
        title={
          <>
            Swap{" "}
            <span className="font-mono text-zinc-300">{entry.fromAsset}</span>
            <span className="text-zinc-500 mx-1">→</span>
            <span className="font-mono text-zinc-300">{entry.toAsset}</span>
          </>
        }
        subtitle={
          <>
            {formatAmount(entry.fromAmount, entry.fromAsset)} {fromInfo.name} ·{" "}
            {formatAmount(entry.toAmount, entry.toAsset)} {toInfo.name}
          </>
        }
        amount={
          <span className="font-mono text-zinc-300">
            {formatAmount(entry.toAmount, entry.toAsset)}{" "}
            <span className="text-zinc-500">{entry.toAsset}</span>
          </span>
        }
        status={failed ? "fail" : "ok"}
      />
    );
  }

  if (entry.kind === "deposit") {
    return (
      <Row
        time={time}
        icon={<TypeIcon symbol="↓" tint="#34d399" />}
        title={<>Depósito</>}
        subtitle={entry.description ?? `Acreditado en ${entry.toAsset}`}
        amount={
          <span className="font-mono text-emerald-300">
            +{formatAmount(entry.toAmount, entry.toAsset)}{" "}
            <span className="text-emerald-300/60">{entry.toAsset}</span>
          </span>
        }
        status={failed ? "fail" : "ok"}
      />
    );
  }

  if (entry.kind === "send") {
    return (
      <Row
        time={time}
        icon={<TypeIcon symbol="↑" tint="#f472b6" />}
        title={<>Envío {entry.fromAsset}</>}
        subtitle={entry.description ?? `Salida de ${entry.fromAsset}`}
        amount={
          <span className="font-mono text-pink-300">
            −{formatAmount(entry.fromAmount, entry.fromAsset)}{" "}
            <span className="text-pink-300/60">{entry.fromAsset}</span>
          </span>
        }
        status={failed ? "fail" : "ok"}
      />
    );
  }

  // card
  return (
    <Row
      time={time}
      icon={<TypeIcon symbol="$" tint="#818cf8" />}
      title={<>{entry.merchant}</>}
      subtitle={
        <span className="capitalize">
          {entry.category} · cobrado en {entry.sourceAsset}
        </span>
      }
      amount={
        <span
          className={`font-mono ${
            failed ? "text-zinc-500 line-through" : "text-zinc-300"
          }`}
        >
          −{formatUsd(entry.amountUsd)}
        </span>
      }
      status={failed ? "declined" : "ok"}
    />
  );
}

function Row({
  time,
  icon,
  title,
  subtitle,
  amount,
  status,
}: {
  time: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  amount: React.ReactNode;
  status: "ok" | "fail" | "declined";
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-zinc-500 truncate">{subtitle}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm">{amount}</div>
        <div className="mt-1 flex items-center justify-end gap-2">
          <span className="text-[10px] font-mono text-zinc-600">{time}</span>
          <StatusPill status={status} />
        </div>
      </div>
    </div>
  );
}

function TypeIcon({ symbol, tint }: { symbol: string; tint: string }) {
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 rounded-full items-center justify-center font-mono text-sm font-semibold"
      style={{ backgroundColor: tint + "22", color: tint }}
      aria-hidden
    >
      {symbol}
    </span>
  );
}

function StatusPill({ status }: { status: "ok" | "fail" | "declined" }) {
  const styles =
    status === "ok"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : "bg-red-500/10 text-red-300 border-red-500/20";
  const label = status === "ok" ? "ok" : status === "declined" ? "declined" : "fail";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono ${styles}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const messages: Record<Filter, { title: string; sub: string; cta?: { href: string; label: string } }> = {
    all: {
      title: "Aún no hay movimientos",
      sub: "Cuando hagas un depósito, un swap o pagues con tu tarjeta, lo verás aquí.",
      cta: { href: "/dashboard/deposit", label: "Hacer un depósito" },
    },
    swap: {
      title: "Sin swaps todavía",
      sub: "Convierte entre activos para que aparezcan aquí.",
      cta: { href: "/dashboard/swap", label: "Ir a Swap" },
    },
    deposito: {
      title: "Sin depósitos",
      sub: "Añade fondos a tu cuenta para empezar a operar.",
      cta: { href: "/dashboard/deposit", label: "Depositar" },
    },
    envio: {
      title: "Sin envíos",
      sub: "Transfiere cripto a una wallet externa.",
      cta: { href: "/dashboard/send", label: "Enviar cripto" },
    },
    tarjeta: {
      title: "Sin compras con tarjeta",
      sub: "Simula una compra desde la pestaña de Tarjeta.",
      cta: { href: "/dashboard/card", label: "Ir a Tarjeta" },
    },
  };
  const m = messages[filter];
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
      <div className="text-base font-medium">{m.title}</div>
      <div className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">{m.sub}</div>
      {m.cta && (
        <Link
          href={m.cta.href}
          className="mt-6 inline-flex h-10 items-center rounded-full bg-white text-black px-5 text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          {m.cta.label}
        </Link>
      )}
    </div>
  );
}
