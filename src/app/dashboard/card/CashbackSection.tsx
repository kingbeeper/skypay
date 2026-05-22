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

  const recent = transactions.filter((t) => t.cashbackUsd > 0).slice(0, 5);

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

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-cyan-500/[0.03] p-5">
          <div className="mb-3">
            <div className="font-medium">Ganado total</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              acumulado en todas las compras
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-emerald-300">
            {formatUsd(totalEarned)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="mb-3">
            <div className="font-medium">Este mes</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              desde el día 1 del mes en curso
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatUsd(thisMonth)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="mb-3">
            <div className="font-medium">Cómo funciona</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              cripto sin convertir, USDC en tu balance
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Recibes el{" "}
            <span className="text-emerald-300 font-mono">
              {cashbackPercent.toFixed(1)}%
            </span>{" "}
            de cada compra en USDC al instante. Sin límite mensual.
          </p>
        </div>
      </div>

      <div className="mt-5">
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
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
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
