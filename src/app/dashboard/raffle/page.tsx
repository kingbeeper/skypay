import { fastForwardRaffleAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchPrices } from "@/lib/prices";
import { formatUsd } from "@/lib/assets";
import {
  buildLeaderboard,
  getOrCreateCurrentRound,
  getRecentDrawnRounds,
  getUserEntry,
} from "@/lib/raffle";
import { Countdown } from "./Countdown";
import { BuyTicketsForm } from "./BuyTicketsForm";
import { DrawButton } from "./DrawButton";

export default async function RafflePage() {
  const user = await requireUser();
  const round = await getOrCreateCurrentRound();

  const [userEntry, totals, pastRounds, prices, realEntries] = await Promise.all([
    getUserEntry(round.id, user.id),
    prisma.raffleEntry.aggregate({
      where: { roundId: round.id },
      _sum: { tickets: true, spentUsd: true },
      _count: { userId: true },
    }),
    getRecentDrawnRounds(5),
    fetchPrices(),
    prisma.raffleEntry.findMany({
      where: { roundId: round.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { tickets: "desc" },
    }),
  ]);

  const leaderboard = buildLeaderboard(
    realEntries.map((e) => ({
      label: e.user.name ?? e.user.email.split("@")[0],
      tickets: e.tickets,
      isUser: e.user.id === user.id,
    })),
    round.syntheticTickets,
    round.id,
    10
  );
  const userInTop = leaderboard.some((e) => e.isUser);
  const myLeaderboardEntry =
    userEntry && userEntry.tickets > 0 && !userInTop
      ? {
          label: user.name ?? user.email.split("@")[0],
          tickets: userEntry.tickets,
          isUser: true,
        }
      : null;

  const myTickets = userEntry?.tickets ?? 0;
  const realTickets = totals._sum.tickets ?? 0;
  const totalParticipants = totals._count.userId ?? 0;
  const totalTickets = realTickets + round.syntheticTickets;
  const odds = totalTickets > 0 ? (myTickets / totalTickets) * 100 : 0;

  const usdBalance =
    user.balances.find((b) => b.asset === "USD")?.amount ?? 0;

  const prizeUsdValue = round.prizeBtc * (prices.BTC?.usd ?? 0);

  // eslint-disable-next-line react-hooks/purity -- server component renders once per request; Date.now is the intended time source
  const drawIsOpen = round.drawsAt.getTime() <= Date.now();

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-mono text-amber-400 mb-2">/ rifa</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Rifa mensual de {round.prizeBtc} BTC
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
          Compra tickets a {formatUsd(round.ticketPriceUsd)} cada uno. Cuando
          venza el plazo, un ganador se lleva {round.prizeBtc} BTC directo a su
          balance. Sin trampa: cuantos más tickets, mejores tus probabilidades.
        </p>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-transparent p-8">
        <div
          aria-hidden
          className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"
        />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-300/80 mb-2">
              Premio acumulado
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-5xl sm:text-6xl font-semibold tracking-tight">
                {round.prizeBtc}
              </div>
              <div className="text-2xl font-mono text-amber-300">BTC</div>
            </div>
            <div className="mt-1 text-sm text-zinc-400 font-mono">
              ≈ {formatUsd(prizeUsdValue)}
            </div>
          </div>
          <div className="md:text-right">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
              Próximo sorteo
            </div>
            <Countdown target={round.drawsAt.toISOString()} />
            {!drawIsOpen && (
              <form action={fastForwardRaffleAction} className="mt-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 h-7 rounded-full border border-white/10 bg-white/[0.02] px-3 text-[11px] font-mono text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors"
                  title="Adelantar el reloj y dejar el sorteo listo para realizar (modo demo)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" />
                  </svg>
                  demo · saltar al sorteo
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        <Stat
          label="Tus tickets"
          value={myTickets.toLocaleString("es-ES")}
          sub={
            myTickets > 0
              ? `gastaste ${formatUsd(userEntry?.spentUsd ?? 0)}`
              : "no has comprado todavía"
          }
        />
        <Stat
          label="Tus probabilidades"
          value={odds > 0 ? `${odds.toFixed(odds < 0.01 ? 4 : 2)}%` : "—"}
          sub={
            myTickets > 0
              ? `1 entre ${Math.round(totalTickets / Math.max(myTickets, 1)).toLocaleString("es-ES")}`
              : "compra al menos 1 ticket"
          }
          accent={odds > 0}
        />
        <Stat
          label="Pool total"
          value={totalTickets.toLocaleString("es-ES")}
          sub={`${totalParticipants.toLocaleString("es-ES")} ${
            totalParticipants === 1 ? "participante real" : "participantes reales"
          }`}
        />
      </section>

      <section className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3">
          {drawIsOpen ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Esta ronda ya venció
              </h2>
              <p className="text-sm text-zinc-400">
                Pulsa el botón para realizar el sorteo. La asignación es aleatoria
                y ponderada por tickets — cuantos más compraste, mayor tu opción.
              </p>
              <DrawButton roundId={round.id} prizeBtc={round.prizeBtc} />
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Compra tickets
              </h2>
              <BuyTicketsForm
                ticketPriceUsd={round.ticketPriceUsd}
                usdBalance={usdBalance}
              />
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Cómo funciona</h2>
          <ol className="space-y-3 text-sm">
            {[
              {
                n: "01",
                title: "Compra tickets",
                body: `Cada ticket cuesta ${formatUsd(round.ticketPriceUsd)}, se descuenta de tu saldo USDC.`,
              },
              {
                n: "02",
                title: "Espera al sorteo",
                body: "Las rondas son mensuales. El plazo cierra el primer día del mes a las 00:00 UTC.",
              },
              {
                n: "03",
                title: "Se elige un ticket",
                body: "Un índice aleatorio entre todos los tickets vendidos decide al ganador.",
              },
              {
                n: "04",
                title: "Cobro instantáneo",
                body: `Si tu ticket sale, el ${round.prizeBtc} BTC aparece en tu balance al instante.`,
              },
            ].map((s) => (
              <li
                key={s.n}
                className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <span className="font-mono text-xs text-amber-400/80 shrink-0">
                  {s.n}
                </span>
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    {s.body}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {user.isAdmin && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Ranking de la ronda
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-rose-400/70 mt-1">
                visible solo para admin
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              top 10 · {totalTickets.toLocaleString("es-ES")} tickets en juego
            </span>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {leaderboard.map((row) => (
              <LeaderboardRow
                key={`${row.rank}-${row.label}`}
                rank={row.rank}
                label={row.label}
                tickets={row.tickets}
                poolTotal={totalTickets}
                isUser={row.isUser}
              />
            ))}
            {myLeaderboardEntry && (
              <>
                <div className="px-5 py-2 text-center text-[10px] font-mono text-zinc-600">
                  ···
                </div>
                <LeaderboardRow
                  rank={null}
                  label={myLeaderboardEntry.label}
                  tickets={myLeaderboardEntry.tickets}
                  poolTotal={totalTickets}
                  isUser
                />
              </>
            )}
            {leaderboard.length === 0 && (
              <div className="px-5 py-10 text-center text-zinc-500 text-sm">
                Aún no hay tickets vendidos.
              </div>
            )}
          </div>
        </section>
      )}

      {pastRounds.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold tracking-tight mb-5">
            Sorteos anteriores
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {pastRounds.map((r) => {
              const winnerLabel = r.winnerUserId
                ? r.winner?.name ?? r.winner?.email ?? "Usuario"
                : r.winnerHandle ?? "—";
              const isCurrentUser = r.winnerUserId === user.id;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 rounded-full items-center justify-center font-mono text-sm font-semibold bg-amber-400/[0.15] text-amber-300">
                    ★
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {winnerLabel}
                      {isCurrentUser && (
                        <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-amber-300">
                          tú
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Ticket #
                      {String(r.winnerTickets ?? 0).padStart(6, "0")} de{" "}
                      {(r.totalTicketsAtDraw ?? 0).toLocaleString("es-ES")}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-semibold text-amber-300">
                      {r.prizeBtc} BTC
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600">
                      {r.drawnAt
                        ? new Date(r.drawnAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function LeaderboardRow({
  rank,
  label,
  tickets,
  poolTotal,
  isUser,
}: {
  rank: number | null;
  label: string;
  tickets: number;
  poolTotal: number;
  isUser: boolean;
}) {
  const pct = poolTotal > 0 ? (tickets / poolTotal) * 100 : 0;
  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
        isUser
          ? "bg-amber-400/[0.06] hover:bg-amber-400/[0.09]"
          : "hover:bg-white/[0.02]"
      }`}
    >
      <span
        className={`inline-flex h-7 w-7 shrink-0 rounded-full items-center justify-center font-mono text-xs font-semibold ${
          isUser
            ? "bg-amber-400/20 text-amber-200"
            : rank !== null && rank <= 3
              ? "bg-amber-400/10 text-amber-300"
              : "bg-white/[0.04] text-zinc-400"
        }`}
      >
        {rank !== null ? rank : "·"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {label}
          {isUser && (
            <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-amber-300">
              tú
            </span>
          )}
        </div>
        <div className="mt-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className={`h-full ${
              isUser
                ? "bg-gradient-to-r from-amber-400 to-orange-500"
                : "bg-white/20"
            }`}
            style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-mono font-medium tabular-nums">
          {tickets.toLocaleString("es-ES")}
        </div>
        <div className="text-[10px] font-mono text-zinc-500">
          {pct < 0.01 ? "<0.01%" : `${pct.toFixed(2)}%`}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[color:var(--background)] p-6">
      <div className="text-xs font-mono text-zinc-500 mb-2">{label}</div>
      <div
        className={`text-2xl font-semibold tracking-tight ${
          accent ? "text-amber-300" : ""
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{sub}</div>
    </div>
  );
}
