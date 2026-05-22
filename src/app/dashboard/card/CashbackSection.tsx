import { formatUsd } from "@/lib/assets";

type CardTx = {
  id: string;
  merchant: string;
  category: string;
  amountUsd: number;
  cashbackUsd: number;
  createdAt: Date;
};

type Props = {
  cashbackPercent: number;
  transactions: CardTx[];
};

export function CashbackSection({ cashbackPercent, transactions }: Props) {
  const totalEarned = transactions.reduce((s, t) => s + (t.cashbackUsd ?? 0), 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = transactions
    .filter((t) => t.createdAt >= monthStart && t.cashbackUsd > 0)
    .reduce((s, t) => s + t.cashbackUsd, 0);

  const recent = transactions
    .filter((t) => t.cashbackUsd > 0)
    .slice(0, 5);

  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          Cashback
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
            {cashbackPercent.toFixed(1)}%
          </span>
        </h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06] mb-5">
        <Stat
          label="Ganado total"
          value={formatUsd(totalEarned)}
          accent
        />
        <Stat
          label="Este mes"
          value={formatUsd(thisMonth)}
        />
        <Stat
          label="Tasa actual"
          value={`${cashbackPercent.toFixed(1)}% USD`}
        />
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-cyan-500/[0.03] p-5 mb-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 rounded-full items-center justify-center bg-emerald-400/[0.15] text-emerald-300 text-lg">
            $
          </span>
          <div>
            <div className="font-medium">¿Cómo funciona?</div>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Por cada compra aprobada con la tarjeta recibes el{" "}
              <strong>{cashbackPercent.toFixed(1)}%</strong> del importe en USD
              acreditado al instante en tu balance. Sin límites mensuales. Se
              acumula automáticamente.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
          Últimos cashbacks
        </h3>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-sm text-zinc-500">
            Aún no has ganado cashback. Haz una compra simulada con la tarjeta.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {recent.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="inline-flex h-8 w-8 shrink-0 rounded-full items-center justify-center bg-emerald-400/[0.12] text-emerald-300 font-mono text-xs font-semibold">
                  +$
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {t.merchant}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {t.category} ·{" "}
                    {new Date(t.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono text-emerald-300 tabular-nums">
                    +{formatUsd(t.cashbackUsd)}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600">
                    de {formatUsd(t.amountUsd)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({
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
      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
        {label}
      </div>
      <div
        className={`text-xl font-semibold tracking-tight tabular-nums ${
          accent ? "text-emerald-300" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
