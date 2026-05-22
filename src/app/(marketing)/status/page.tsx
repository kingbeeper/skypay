const SERVICES = [
  { name: "API REST", status: "operational", latency: "42ms" },
  { name: "Dashboard web", status: "operational", latency: "180ms" },
  { name: "Binance WebSocket (precios)", status: "operational", latency: "<10ms" },
  { name: "CoinGecko (precios spot)", status: "operational", latency: "320ms" },
  { name: "Procesador de tarjeta (Visa)", status: "operational", latency: "85ms" },
  { name: "Notificaciones push", status: "degraded", latency: "1.2s" },
  { name: "Webhooks salientes", status: "operational", latency: "120ms" },
];

const INCIDENTS = [
  {
    date: "2026-05-12",
    title: "Latencia elevada en push notifications",
    status: "investigating",
    summary:
      "Estamos viendo retrasos de hasta 2 segundos en notifs push. Origen identificado en el proveedor FCM. Mitigando.",
  },
  {
    date: "2026-04-28",
    title: "Caída breve del WebSocket de Binance",
    status: "resolved",
    summary:
      "Reconexión automática gestionó el incidente. 0 transacciones afectadas. Duración 4 min.",
  },
  {
    date: "2026-04-03",
    title: "Mantenimiento programado · DB",
    status: "resolved",
    summary:
      "Upgrade de Postgres a 17.1 sin downtime gracias al replica failover. Mejoras de p99 ~40ms.",
  },
];

export default function StatusPage() {
  const allOk = SERVICES.every((s) => s.status === "operational");

  return (
    <div className="space-y-12">
      <div>
        <p className="text-sm font-mono text-cyan-400 mb-2">/ status</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            Estado del sistema
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider ${
              allOk
                ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300"
                : "border-amber-500/30 bg-amber-500/[0.08] text-amber-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                allOk ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            {allOk ? "Todo operativo" : "Incidencia en curso"}
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Métricas en vivo de la infraestructura. Actualizado cada 30 segundos.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-5">
          Servicios
        </h2>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
          {SERVICES.map((s) => {
            const ok = s.status === "operational";
            return (
              <div
                key={s.name}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                    ok ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                  }`}
                />
                <span className="flex-1 text-sm font-medium">{s.name}</span>
                <span
                  className={`text-xs font-mono ${
                    ok ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {ok ? "operativo" : "degradado"}
                </span>
                <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                  {s.latency}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-5">
          Incidencias recientes
        </h2>
        <div className="space-y-3">
          {INCIDENTS.map((i) => {
            const ok = i.status === "resolved";
            return (
              <div
                key={i.date}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <span className="font-medium">{i.title}</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider shrink-0 ${
                      ok
                        ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300"
                        : "border-amber-500/30 bg-amber-500/[0.08] text-amber-300"
                    }`}
                  >
                    {i.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-500 mb-2">
                  {i.date}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{i.summary}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
