import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ACTION_LABELS: Record<string, { label: string; tint: string }> = {
  "user.create": { label: "Usuario creado", tint: "emerald" },
  "user.delete": { label: "Usuario eliminado", tint: "rose" },
  "user.promote_admin": { label: "Promovido a admin", tint: "rose" },
  "user.demote_admin": { label: "Admin revocado", tint: "rose" },
  "balance.adjust": { label: "Balance ajustado", tint: "amber" },
  "impersonate.start": { label: "Inicio impersonate", tint: "amber" },
  "impersonate.stop": { label: "Fin impersonate", tint: "zinc" },
};

const TINTS: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300",
  rose: "border-rose-500/30 bg-rose-500/[0.08] text-rose-300",
  amber: "border-amber-500/30 bg-amber-500/[0.08] text-amber-300",
  zinc: "border-zinc-700 bg-zinc-800/40 text-zinc-400",
};

export default async function AuditLogPage() {
  await requireAdmin();

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

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
          <p className="text-sm font-mono text-rose-400">/ admin / audit</p>
          <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-rose-300">
            interno
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Audit log
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Registro inmutable de acciones administrativas. Últimas 100.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-sm text-zinc-500">
          Sin actividad registrada.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
          {entries.map((e) => {
            const info = ACTION_LABELS[e.action] ?? {
              label: e.action,
              tint: "zinc",
            };
            const meta = e.metadata ? JSON.parse(e.metadata) : null;
            return (
              <div
                key={e.id}
                className="px-5 py-3.5 flex items-start gap-3"
              >
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider shrink-0 ${TINTS[info.tint]}`}
                >
                  {info.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="text-zinc-400">por</span>{" "}
                    <span className="font-mono text-zinc-200">
                      {e.actorEmail}
                    </span>
                    {e.targetLabel && (
                      <>
                        <span className="text-zinc-500"> · sobre </span>
                        <span className="font-mono text-zinc-200 break-all">
                          {e.targetLabel}
                        </span>
                      </>
                    )}
                  </div>
                  {meta && (
                    <div className="text-[10px] font-mono text-zinc-500 mt-1 break-all">
                      {Object.entries(meta as Record<string, unknown>)
                        .filter(([, v]) => v !== null && v !== undefined && v !== "")
                        .map(([k, v]) => `${k}=${String(v)}`)
                        .join(" · ")}
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-mono text-zinc-600 shrink-0 text-right">
                  {new Date(e.createdAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
