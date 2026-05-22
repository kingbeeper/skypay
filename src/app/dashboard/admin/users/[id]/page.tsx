import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchPrices } from "@/lib/prices";
import {
  ASSET_LIST,
  formatAmount,
  formatUsd,
  type AssetSymbol,
} from "@/lib/assets";
import { AdjustBalanceForm } from "./AdjustBalanceForm";
import { DangerZone } from "./DangerZone";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      balances: true,
      cards: { include: { _count: { select: { transactions: true } } } },
      raffleEntries: {
        include: {
          round: {
            select: {
              id: true,
              drawsAt: true,
              status: true,
              prizeBtc: true,
              winnerUserId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { transactions: true } },
    },
  });

  if (!user) notFound();

  const [transactions, cardTxs, prices] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.cardTransaction.findMany({
      where: { card: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    fetchPrices(),
  ]);

  // Build merged + sorted timeline
  type TimelineItem = {
    id: string;
    kind: "tx" | "card";
    at: Date;
    title: string;
    sub: string;
    amount: string;
    amountTone: "neutral" | "in" | "out";
    status: string;
  };
  const timeline: TimelineItem[] = [];
  for (const t of transactions) {
    let title = t.type;
    let amount = "—";
    let amountTone: TimelineItem["amountTone"] = "neutral";
    if (t.type === "swap" && t.fromAsset && t.toAsset) {
      title = `Swap ${t.fromAsset} → ${t.toAsset}`;
      if (t.toAmount) {
        amount = `${formatAmount(t.toAmount, t.toAsset as AssetSymbol)} ${t.toAsset}`;
        amountTone = "in";
      }
    } else if (t.type === "deposit" && t.toAsset && t.toAmount) {
      title = `Depósito ${t.toAsset}`;
      amount = `+${formatAmount(t.toAmount, t.toAsset as AssetSymbol)} ${t.toAsset}`;
      amountTone = "in";
    } else if (t.type === "send" && t.fromAsset && t.fromAmount) {
      title = `Envío ${t.fromAsset}`;
      amount = `−${formatAmount(t.fromAmount, t.fromAsset as AssetSymbol)} ${t.fromAsset}`;
      amountTone = "out";
    } else if (t.type === "raffle_buy" && t.fromAmount) {
      title = `Compra tickets rifa`;
      amount = `−${formatUsd(t.fromAmount)}`;
      amountTone = "out";
    } else if (t.type === "raffle_win" && t.toAmount) {
      title = `Premio rifa`;
      amount = `+${t.toAmount} BTC`;
      amountTone = "in";
    } else if (t.type === "admin_adjust") {
      if (t.toAsset && t.toAmount) {
        title = `Admin · crédito ${t.toAsset}`;
        amount = `+${formatAmount(t.toAmount, t.toAsset as AssetSymbol)} ${t.toAsset}`;
        amountTone = "in";
      } else if (t.fromAsset && t.fromAmount) {
        title = `Admin · débito ${t.fromAsset}`;
        amount = `−${formatAmount(t.fromAmount, t.fromAsset as AssetSymbol)} ${t.fromAsset}`;
        amountTone = "out";
      }
    }
    timeline.push({
      id: t.id,
      kind: "tx",
      at: t.createdAt,
      title,
      sub: t.description ?? "",
      amount,
      amountTone,
      status: t.status,
    });
  }
  for (const c of cardTxs) {
    timeline.push({
      id: c.id,
      kind: "card",
      at: c.createdAt,
      title: `Tarjeta · ${c.merchant}`,
      sub: `${c.category} · cobrado en ${c.sourceAsset}`,
      amount: c.status === "approved" ? `−${formatUsd(c.amountUsd)}` : `${formatUsd(c.amountUsd)}`,
      amountTone: c.status === "approved" ? "out" : "neutral",
      status: c.status,
    });
  }
  timeline.sort((a, b) => b.at.getTime() - a.at.getTime());

  // Totals
  const portfolioUsd = user.balances.reduce((sum, b) => {
    const price = prices[b.asset as AssetSymbol]?.usd ?? 0;
    return sum + b.amount * price;
  }, 0);
  const raffleSpent = user.raffleEntries.reduce((s, e) => s + e.spentUsd, 0);
  const raffleWins = user.raffleEntries.filter(
    (e) => e.round.winnerUserId === user.id
  ).length;

  const isMe = user.id === me.id;

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/dashboard/admin"
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Volver al panel
        </Link>
        <div className="flex items-center gap-2 mt-3 mb-2">
          <p className="text-sm font-mono text-rose-400">/ admin / usuario</p>
          {isMe && (
            <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-rose-300">
              eres tú
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight break-all">
          {user.name ?? user.email.split("@")[0]}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono text-zinc-400 break-all">{user.email}</span>
          {user.isAdmin && (
            <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-rose-300">
              admin
            </span>
          )}
          {user.isDemo && (
            <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
              demo
            </span>
          )}
          <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
            kyc:{user.kycStatus}
          </span>
        </div>
        <div className="mt-1 text-xs font-mono text-zinc-600">
          Registrado{" "}
          {new Date(user.createdAt).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Quick KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        <Kpi label="Portfolio" value={formatUsd(portfolioUsd)} />
        <Kpi label="Transacciones" value={user._count.transactions.toLocaleString("es-ES")} />
        <Kpi
          label="Gastado en rifa"
          value={formatUsd(raffleSpent)}
        />
        <Kpi label="Rifas ganadas" value={raffleWins.toLocaleString("es-ES")} accent={raffleWins > 0} />
      </section>

      {/* Balances */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-5">Balances</h2>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-zinc-400 text-xs uppercase tracking-wider font-mono">
              <tr>
                <th className="text-left px-5 py-3">Activo</th>
                <th className="text-right px-5 py-3">Cantidad</th>
                <th className="text-right px-5 py-3 hidden sm:table-cell">Precio</th>
                <th className="text-right px-5 py-3">Valor USD</th>
              </tr>
            </thead>
            <tbody>
              {ASSET_LIST.map((a) => {
                const bal = user.balances.find((b) => b.asset === a.symbol);
                const amount = bal?.amount ?? 0;
                const price = prices[a.symbol]?.usd ?? 0;
                const usdValue = amount * price;
                return (
                  <tr
                    key={a.symbol}
                    className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-7 w-7 shrink-0 rounded-full items-center justify-center font-mono text-xs font-semibold"
                          style={{
                            backgroundColor: a.color + "22",
                            color: a.color,
                          }}
                        >
                          {a.symbol[0]}
                        </span>
                        <div>
                          <div className="font-medium">{a.name}</div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {a.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono tabular-nums">
                      {formatAmount(amount, a.symbol)}
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono text-zinc-400 hidden sm:table-cell">
                      {a.kind === "fiat" ? "—" : formatUsd(price)}
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono font-medium tabular-nums">
                      {formatUsd(usdValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <AdjustBalanceForm userId={user.id} />
        </div>
      </section>

      {/* Recent transactions */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-xl font-semibold tracking-tight">
            Transacciones recientes
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            últimas {timeline.length}
          </span>
        </div>
        {timeline.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-12 text-center text-sm text-zinc-500">
            Sin actividad
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {timeline.map((t) => (
              <div
                key={`${t.kind}-${t.id}`}
                className="flex items-start gap-4 px-5 py-3.5"
              >
                <span
                  className={`inline-flex h-7 w-7 shrink-0 rounded-full items-center justify-center font-mono text-[10px] font-semibold ${
                    t.kind === "card"
                      ? "bg-indigo-400/[0.15] text-indigo-300"
                      : t.amountTone === "in"
                        ? "bg-emerald-400/[0.15] text-emerald-300"
                        : t.amountTone === "out"
                          ? "bg-pink-400/[0.15] text-pink-300"
                          : "bg-cyan-400/[0.15] text-cyan-300"
                  }`}
                >
                  {t.kind === "card" ? "$" : t.amountTone === "in" ? "↓" : t.amountTone === "out" ? "↑" : "·"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  {t.sub && (
                    <div className="text-xs text-zinc-500 truncate">{t.sub}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-mono tabular-nums ${
                      t.amountTone === "in"
                        ? "text-emerald-300"
                        : t.amountTone === "out"
                          ? "text-pink-300"
                          : "text-zinc-300"
                    }`}
                  >
                    {t.amount}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600">
                    {new Date(t.at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Raffle entries */}
      {user.raffleEntries.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold tracking-tight mb-5">
            Participación en rifas
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-zinc-400 text-xs uppercase tracking-wider font-mono">
                <tr>
                  <th className="text-left px-5 py-3">Ronda</th>
                  <th className="text-right px-5 py-3">Tickets</th>
                  <th className="text-right px-5 py-3">Gastado</th>
                  <th className="text-right px-5 py-3">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {user.raffleEntries.map((e) => {
                  const won = e.round.winnerUserId === user.id;
                  const drawn = e.round.status === "drawn";
                  return (
                    <tr
                      key={e.id}
                      className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">
                        {new Date(e.round.drawsAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <span className="ml-2 text-zinc-600">
                          · {e.round.prizeBtc} BTC
                        </span>
                      </td>
                      <td className="text-right px-5 py-3.5 font-mono tabular-nums">
                        {e.tickets.toLocaleString("es-ES")}
                      </td>
                      <td className="text-right px-5 py-3.5 font-mono tabular-nums">
                        {formatUsd(e.spentUsd)}
                      </td>
                      <td className="text-right px-5 py-3.5">
                        {!drawn ? (
                          <span className="text-xs font-mono text-amber-300">
                            en curso
                          </span>
                        ) : won ? (
                          <span className="text-xs font-mono text-emerald-300">
                            ★ ganador
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-zinc-500">
                            no ganó
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Danger zone */}
      <DangerZone
        userId={user.id}
        userEmail={user.email}
        isSelf={isMe}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[color:var(--background)] p-5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
        {label}
      </div>
      <div
        className={`text-xl font-semibold tracking-tight tabular-nums ${
          accent ? "text-amber-300" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
