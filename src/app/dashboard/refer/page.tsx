import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureReferralCode } from "@/lib/referral";
import { CopyReferLink } from "./CopyReferLink";

export default async function ReferPage() {
  const user = await requireUser();
  const code = await ensureReferralCode(user.id);

  const referred = await prisma.user.findMany({
    where: { referredById: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const bonusEarned = referred.length * 10;

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <p className="text-sm font-mono text-cyan-400 mb-2">/ referidos</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Invita amigos · gana $10
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Cuando alguien se registra con tu código, recibís{" "}
          <strong>$10 USD cada uno</strong>. Sin límite.
        </p>
      </div>

      <section className="rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/[0.06] to-indigo-500/[0.04] p-7">
        <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 mb-2">
          Tu código de referido
        </div>
        <div className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.15em] tabular-nums break-all">
          {code}
        </div>
        <div className="mt-5">
          <CopyReferLink code={code} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        <div className="bg-[color:var(--background)] p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Referidos
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            {referred.length}
          </div>
        </div>
        <div className="bg-[color:var(--background)] p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Ganado
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-emerald-300">
            ${bonusEarned}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-5">
          Tus referidos
        </h2>
        {referred.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-sm text-zinc-500">
            Aún no has referido a nadie. Comparte tu código arriba.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {referred.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 px-5 py-3.5"
              >
                <span className="inline-flex h-9 w-9 shrink-0 rounded-full items-center justify-center font-mono text-xs font-semibold bg-emerald-400/[0.15] text-emerald-300">
                  ✓
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {r.name ?? r.email.split("@")[0]}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono truncate">
                    {r.email}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono text-emerald-300">+$10</div>
                  <div className="text-[10px] font-mono text-zinc-600">
                    {new Date(r.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-zinc-600 text-center">
        Los bonos se acreditan al instante en USD cuando el referido completa
        el signup. No hay tope · puedes referir a quien quieras.
      </p>
    </div>
  );
}
