import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchPrices } from "@/lib/prices";
import { formatUsd } from "@/lib/assets";
import { AdminToggleButton } from "./AdminToggleButton";

export default async function AdminPage() {
  const me = await requireAdmin();

  const [users, currentRound, pastRounds, raffleTotals, raffleEntriesTotal] =
    await Promise.all([
      prisma.user.findMany({
        include: {
          balances: true,
          _count: { select: { transactions: true, raffleEntries: true } },
          raffleEntries: {
            include: {
              round: { select: { id: true, status: true, drawsAt: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.raffleRound.findFirst({
        where: { status: "open" },
        orderBy: { drawsAt: "asc" },
        include: {
          entries: {
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
            orderBy: { tickets: "desc" },
          },
        },
      }),
      prisma.raffleRound.findMany({
        where: { status: "drawn" },
        orderBy: { drawnAt: "desc" },
        include: {
          winner: { select: { email: true, name: true } },
          entries: {
            select: { tickets: true, spentUsd: true },
          },
        },
        take: 12,
      }),
      prisma.raffleEntry.aggregate({
        _sum: { spentUsd: true, tickets: true },
        _count: { userId: true },
      }),
      prisma.raffleEntry.count(),
    ]);

  const prices = await fetchPrices();
  const btcPrice = prices.BTC?.usd ?? 0;

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.isAdmin).length;
  const totalDemo = users.filter((u) => u.isDemo).length;
  const totalRevenueUsd = raffleTotals._sum.spentUsd ?? 0;
  const totalTicketsSoldAllRounds = raffleTotals._sum.tickets ?? 0;

  const currentEntries = currentRound?.entries ?? [];
  const currentRealTickets = currentEntries.reduce((s, e) => s + e.tickets, 0);
  const currentRevenueUsd = currentEntries.reduce(
    (s, e) => s + e.spentUsd,
    0
  );

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-mono text-rose-400">/ admin</p>
          <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-rose-300">
            interno
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Panel de administración
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Acceso restringido. Logged in as{" "}
          <span className="font-mono text-zinc-300">{me.email}</span>.
        </p>
      </div>

      {/* High-level KPIs */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        <Kpi
          label="Usuarios"
          value={totalUsers.toLocaleString("es-ES")}
          sub={`${totalAdmins} admin · ${totalDemo} demo`}
        />
        <Kpi
          label="Ingresos rifa (total)"
          value={formatUsd(totalRevenueUsd)}
          sub={`${totalTicketsSoldAllRounds.toLocaleString("es-ES")} tickets vendidos`}
          accent="emerald"
        />
        <Kpi
          label="Entradas activas"
          value={(raffleEntriesTotal ?? 0).toLocaleString("es-ES")}
          sub="rows en RaffleEntry"
        />
        <Kpi
          label="Ronda actual"
          value={
            currentRound
              ? formatUsd(currentRevenueUsd)
              : "—"
          }
          sub={
            currentRound
              ? `${currentRealTickets.toLocaleString("es-ES")} tickets reales · cierra ${currentRound.drawsAt.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
              : "sin ronda abierta"
          }
          accent="amber"
        />
      </section>

      {/* Current round detail */}
      {currentRound && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Ronda actual · {currentRound.prizeBtc} BTC
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              cierra{" "}
              {currentRound.drawsAt.toLocaleString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="grid lg:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06] mb-6">
            <Kpi
              label="Tickets reales vendidos"
              value={currentRealTickets.toLocaleString("es-ES")}
              sub={`a ${formatUsd(currentRound.ticketPriceUsd)} c/u`}
            />
            <Kpi
              label="Ingresos esta ronda"
              value={formatUsd(currentRevenueUsd)}
              sub={`de ${currentEntries.length} ${currentEntries.length === 1 ? "comprador" : "compradores"} reales`}
              accent="emerald"
            />
            <Kpi
              label="Pool sintético"
              value={currentRound.syntheticTickets.toLocaleString("es-ES")}
              sub="tickets ficticios para la draw"
            />
          </div>

          <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">
            Compradores reales
          </h3>
          {currentEntries.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-sm text-zinc-500">
              Aún no hay tickets reales vendidos en esta ronda.
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.02] text-zinc-400 text-xs uppercase tracking-wider font-mono">
                  <tr>
                    <th className="text-left px-5 py-3">Usuario</th>
                    <th className="text-right px-5 py-3">Tickets</th>
                    <th className="text-right px-5 py-3">Gastado USD</th>
                    <th className="text-right px-5 py-3 hidden sm:table-cell">
                      Compra
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.map((e) => (
                    <tr
                      key={e.id}
                      className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium truncate">
                          {e.user.name ?? e.user.email.split("@")[0]}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono truncate">
                          {e.user.email}
                        </div>
                      </td>
                      <td className="text-right px-5 py-3.5 font-mono tabular-nums">
                        {e.tickets.toLocaleString("es-ES")}
                      </td>
                      <td className="text-right px-5 py-3.5 font-mono font-medium tabular-nums">
                        {formatUsd(e.spentUsd)}
                      </td>
                      <td className="text-right px-5 py-3.5 hidden sm:table-cell text-zinc-500 font-mono text-xs">
                        {new Date(e.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Past rounds */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-5">
          Rondas anteriores
        </h2>
        {pastRounds.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-sm text-zinc-500">
            Aún no se ha sorteado ninguna ronda.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-zinc-400 text-xs uppercase tracking-wider font-mono">
                <tr>
                  <th className="text-left px-5 py-3">Sorteo</th>
                  <th className="text-right px-5 py-3">Premio</th>
                  <th className="text-right px-5 py-3 hidden sm:table-cell">
                    Tickets reales
                  </th>
                  <th className="text-right px-5 py-3">Ingresos</th>
                  <th className="text-left px-5 py-3">Ganador</th>
                </tr>
              </thead>
              <tbody>
                {pastRounds.map((r) => {
                  const realTickets = r.entries.reduce(
                    (s, e) => s + e.tickets,
                    0
                  );
                  const revenue = r.entries.reduce(
                    (s, e) => s + e.spentUsd,
                    0
                  );
                  const winnerLabel = r.winnerUserId
                    ? r.winner?.name ?? r.winner?.email ?? "Usuario"
                    : r.winnerHandle ?? "—";
                  const isReal = !!r.winnerUserId;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">
                        {r.drawnAt
                          ? new Date(r.drawnAt).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="text-right px-5 py-3.5 font-mono font-medium text-amber-300">
                        {r.prizeBtc} BTC
                      </td>
                      <td className="text-right px-5 py-3.5 hidden sm:table-cell font-mono tabular-nums">
                        {realTickets.toLocaleString("es-ES")}
                      </td>
                      <td className="text-right px-5 py-3.5 font-mono tabular-nums">
                        {formatUsd(revenue)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-medium ${
                            isReal ? "text-emerald-300" : "text-zinc-400"
                          }`}
                        >
                          {winnerLabel}
                        </span>
                        <span
                          className={`ml-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-mono ${
                            isReal
                              ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300"
                              : "border-zinc-700 bg-zinc-800/40 text-zinc-500"
                          }`}
                        >
                          {isReal ? "real" : "sintético"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Users table */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-xl font-semibold tracking-tight">
            Usuarios ({totalUsers})
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            ordenados por fecha de registro · más recientes primero
          </span>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-white/[0.02] text-zinc-400 text-xs uppercase tracking-wider font-mono">
              <tr>
                <th className="text-left px-5 py-3">Usuario</th>
                <th className="text-left px-5 py-3">Roles</th>
                <th className="text-right px-5 py-3">USD</th>
                <th className="text-right px-5 py-3">BTC</th>
                <th className="text-right px-5 py-3">Tx</th>
                <th className="text-right px-5 py-3">Tickets ronda</th>
                <th className="text-right px-5 py-3">Gastado rifa</th>
                <th className="text-right px-5 py-3">Registro</th>
                <th className="text-right px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const usd =
                  u.balances.find((b) => b.asset === "USD")?.amount ?? 0;
                const btc =
                  u.balances.find((b) => b.asset === "BTC")?.amount ?? 0;
                const btcValue = btc * btcPrice;
                const currentRoundEntry = u.raffleEntries.find(
                  (e) => e.round.status === "open"
                );
                const totalSpentInRaffles = u.raffleEntries.reduce(
                  (s, e) => s + e.spentUsd,
                  0
                );
                const isMe = u.id === me.id;
                return (
                  <tr
                    key={u.id}
                    className={`border-t border-white/[0.04] transition-colors ${
                      isMe
                        ? "bg-rose-500/[0.04] hover:bg-rose-500/[0.07]"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium truncate">
                        {u.name ?? u.email.split("@")[0]}
                        {isMe && (
                          <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-rose-300">
                            tú
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono truncate">
                        {u.email}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.isAdmin && <Pill color="rose">admin</Pill>}
                        {u.isDemo && <Pill color="cyan">demo</Pill>}
                        {u.kycStatus !== "approved" && (
                          <Pill color="amber">kyc:{u.kycStatus}</Pill>
                        )}
                      </div>
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono tabular-nums">
                      {formatUsd(usd)}
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono tabular-nums">
                      <div>{btc.toFixed(4)}</div>
                      <div className="text-[10px] text-zinc-600">
                        {formatUsd(btcValue)}
                      </div>
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono tabular-nums text-zinc-400">
                      {u._count.transactions}
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono tabular-nums">
                      {currentRoundEntry
                        ? currentRoundEntry.tickets.toLocaleString("es-ES")
                        : "—"}
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono tabular-nums">
                      {totalSpentInRaffles > 0
                        ? formatUsd(totalSpentInRaffles)
                        : "—"}
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono text-xs text-zinc-500">
                      {new Date(u.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="text-right px-5 py-3.5">
                      <AdminToggleButton
                        userId={u.id}
                        isAdmin={u.isAdmin}
                        isSelf={isMe}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          No puedes cambiar tu propio rol admin (para evitar bloqueos). Si
          necesitas hacerlo, usa Prisma Studio:{" "}
          <code className="font-mono text-zinc-400">npm run db:studio</code>.
        </p>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "emerald" | "amber" | "rose";
}) {
  const colorClass =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "amber"
        ? "text-amber-300"
        : accent === "rose"
          ? "text-rose-300"
          : "";
  return (
    <div className="bg-[color:var(--background)] p-6">
      <div className="text-xs font-mono text-zinc-500 mb-2">{label}</div>
      <div
        className={`text-2xl font-semibold tracking-tight ${colorClass}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{sub}</div>
    </div>
  );
}

function Pill({
  color,
  children,
}: {
  color: "rose" | "cyan" | "amber" | "emerald";
  children: React.ReactNode;
}) {
  const styles: Record<typeof color, string> = {
    rose: "border-rose-500/30 bg-rose-500/[0.08] text-rose-300",
    cyan: "border-cyan-500/30 bg-cyan-500/[0.08] text-cyan-300",
    amber: "border-amber-500/30 bg-amber-500/[0.08] text-amber-300",
    emerald: "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-mono ${styles[color]}`}
    >
      {children}
    </span>
  );
}

