import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toggleWebhookAction, deleteWebhookAction } from "@/app/actions";
import { CreateWebhookForm } from "./CreateWebhookForm";
import { FireTestButton } from "./FireTestButton";

export default async function WebhooksPage() {
  await requireAdmin();

  const [webhooks, recentEvents] = await Promise.all([
    prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { events: true } } },
    }),
    prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { webhook: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <Link
          href="/dashboard/admin"
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Volver al panel
        </Link>
        <div className="flex items-center gap-2 mt-3 mb-2">
          <p className="text-sm font-mono text-rose-400">
            / admin / webhooks
          </p>
          <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-rose-300">
            interno
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Webhooks e integraciones
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Configura endpoints HTTP que reciban eventos de Skypay. Útil para
          integrar con Slack, Discord, n8n, Zapier u otra cola interna.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-5">
          Crear webhook
        </h2>
        <CreateWebhookForm />
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-xl font-semibold tracking-tight">
            Webhooks configurados ({webhooks.length})
          </h2>
        </div>
        {webhooks.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-sm text-zinc-500">
            Aún no hay webhooks. Crea el primero arriba.
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((w) => (
              <div
                key={w.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{w.name}</span>
                      <span
                        className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                          w.enabled
                            ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300"
                            : "border-zinc-700 bg-zinc-800/40 text-zinc-500"
                        }`}
                      >
                        {w.enabled ? "activo" : "pausado"}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-zinc-400 break-all">
                      {w.url}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-mono text-zinc-500">
                      <span>{w._count.events} eventos enviados</span>
                      {w.lastFiredAt && (
                        <span>
                          último{" "}
                          {new Date(w.lastFiredAt).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {w.secret && <span>· con signature</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <FireTestButton id={w.id} disabled={!w.enabled} />
                    <form action={toggleWebhookAction}>
                      <input type="hidden" name="id" value={w.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={w.enabled ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="h-8 px-3 rounded-full border border-white/10 bg-white/[0.02] text-xs font-mono text-zinc-300 hover:bg-white/[0.06] transition-colors"
                      >
                        {w.enabled ? "Pausar" : "Activar"}
                      </button>
                    </form>
                    <form action={deleteWebhookAction}>
                      <input type="hidden" name="id" value={w.id} />
                      <button
                        type="submit"
                        className="h-8 px-3 rounded-full border border-rose-500/30 bg-rose-500/[0.06] text-xs font-mono text-rose-300 hover:bg-rose-500/[0.12] transition-colors"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-5">
          Últimos eventos enviados
        </h2>
        {recentEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-sm text-zinc-500">
            Sin eventos aún.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {recentEvents.map((e) => {
              const isOk = e.status === "delivered";
              return (
                <div
                  key={e.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <span
                    className={`inline-flex h-6 w-6 shrink-0 rounded-full items-center justify-center font-mono text-[10px] font-semibold ${
                      isOk
                        ? "bg-emerald-400/[0.15] text-emerald-300"
                        : "bg-rose-400/[0.15] text-rose-300"
                    }`}
                  >
                    {isOk ? "✓" : "!"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{e.eventType}</span>
                      <span className="text-zinc-500 ml-2 text-xs">
                        → {e.webhook.name}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600 mt-0.5">
                      {e.status} ·{" "}
                      {new Date(e.createdAt).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
