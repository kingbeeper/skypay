import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchPrices } from "@/lib/prices";
import { ASSET_LIST, type AssetSymbol, formatUsd, formatAmount, ASSETS } from "@/lib/assets";
import { CardVisual } from "./CardVisual";
import { CardControls } from "./CardControls";
import { SimulatePurchase } from "./SimulatePurchase";
import { CardRequestLanding } from "./CardRequestLanding";
import { WalletButtons } from "./WalletButtons";

export default async function CardPage() {
  const user = await requireUser();
  const card = await prisma.card.findFirst({ where: { userId: user.id } });

  if (!card) {
    const usdBalance =
      user.balances.find((b) => b.asset === "USD")?.amount ?? 0;
    return <CardRequestLanding usdBalance={usdBalance} />;
  }

  const [transactions, prices] = await Promise.all([
    prisma.cardTransaction.findMany({
      where: { cardId: card.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    fetchPrices(),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthlySpent = transactions
    .filter((t) => t.status === "approved" && t.createdAt >= monthStart)
    .reduce((sum, t) => sum + t.amountUsd, 0);

  const balancesArray = await prisma.balance.findMany({
    where: { userId: user.id },
  });
  const balances: Record<AssetSymbol, number> = {
    USD: 0,
    BTC: 0,
    ETH: 0,
    USDC: 0,
    SOL: 0,
  };
  for (const b of balancesArray) {
    if (b.asset in balances) balances[b.asset as AssetSymbol] = b.amount;
  }

  const source = card.spendingSource as AssetSymbol;
  const sourcePrice = prices[source]?.usd ?? 0;
  const sourceUsdValue = balances[source] * sourcePrice;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-mono text-cyan-400 mb-2">/ tarjeta</p>
        <h1 className="text-3xl font-semibold tracking-tight">Tu tarjeta Skypay</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Una sola tarjeta Visa, cualquier saldo. Gasta cripto sin convertir primero.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <CardVisual card={card} />
          <WalletButtons last4={card.last4} />
        </div>
        <CardControls
          card={card}
          assets={ASSET_LIST}
          balances={balances}
          sourcePrice={sourcePrice}
          sourceUsdValue={sourceUsdValue}
        />
      </div>

      <section className="grid sm:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        <div className="bg-[color:var(--background)] p-6">
          <div className="text-xs font-mono text-zinc-500 mb-2">Gastado este mes</div>
          <div className="text-2xl font-semibold tracking-tight">
            {formatUsd(monthlySpent)}
          </div>
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                style={{
                  width: `${Math.min(100, (monthlySpent / card.monthlyLimit) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1.5 text-xs text-zinc-500 font-mono">
              límite {formatUsd(card.monthlyLimit)}
            </div>
          </div>
        </div>
        <div className="bg-[color:var(--background)] p-6">
          <div className="text-xs font-mono text-zinc-500 mb-2">Fuente de gasto</div>
          <div className="text-2xl font-semibold tracking-tight">
            {card.spendingSource}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {formatAmount(balances[source], source)} {source}
            {source !== "USD" && ` · ${formatUsd(sourceUsdValue)}`}
          </div>
        </div>
        <div className="bg-[color:var(--background)] p-6">
          <div className="text-xs font-mono text-zinc-500 mb-2">Estado</div>
          <div
            className={`text-2xl font-semibold tracking-tight ${
              card.status === "active" ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {card.status === "active" ? "Activa" : "Congelada"}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {card.type === "virtual" ? "Virtual" : "Física"}
            {card.physicalRequested && card.type === "virtual" && " · física en camino"}
          </div>
        </div>
      </section>

      <SimulatePurchase
        cardId={card.id}
        disabled={card.status === "frozen"}
      />

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold tracking-tight">Transacciones</h2>
          <span className="text-xs font-mono text-zinc-500">
            últimas 30
          </span>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          {transactions.length === 0 ? (
            <div className="px-5 py-12 text-center text-zinc-500 text-sm">
              Aún no hay movimientos. Simula una compra arriba.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-zinc-400 text-xs uppercase tracking-wider font-mono">
                <tr>
                  <th className="text-left px-5 py-3">Comercio</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Categoría</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Fecha</th>
                  <th className="text-right px-5 py-3">Importe</th>
                  <th className="text-right px-5 py-3 hidden sm:table-cell">Cobrado en</th>
                  <th className="text-right px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium">{t.merchant}</td>
                    <td className="px-5 py-3.5 text-zinc-400 capitalize hidden sm:table-cell">
                      {t.category}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 font-mono text-xs hidden md:table-cell">
                      {new Date(t.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono font-medium">
                      {formatUsd(t.amountUsd)}
                    </td>
                    <td className="text-right px-5 py-3.5 font-mono text-zinc-400 hidden sm:table-cell">
                      {formatAmount(t.sourceAmount, t.sourceAsset as AssetSymbol)}{" "}
                      <span className="text-zinc-600">{t.sourceAsset}</span>
                    </td>
                    <td className="text-right px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono ${
                          t.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-300 border border-red-500/20"
                        }`}
                      >
                        {t.status === "approved" ? "ok" : "declined"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
