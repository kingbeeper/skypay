import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchPrices } from "@/lib/prices";
import { ASSET_LIST, type AssetSymbol, formatUsd, formatAmount, ASSETS } from "@/lib/assets";
import { CardVisual } from "./CardVisual";
import { CardControls } from "./CardControls";
import { SimulatePurchase } from "./SimulatePurchase";
import { CardRequestLanding } from "./CardRequestLanding";
import { WalletButtons } from "./WalletButtons";
import { CardLimitsForm } from "./CardLimitsForm";
import { CardColorPicker } from "./CardColorPicker";
import { CashbackSection } from "./CashbackSection";

export default async function CardPage() {
  const user = await requireUser();
  const card = await prisma.card.findFirst({ where: { userId: user.id } });

  if (!card) {
    const usdcBalance =
      user.balances.find((b) => b.asset === "USDC")?.amount ?? 0;
    return <CardRequestLanding usdBalance={usdcBalance} />;
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
          <CardColorPicker cardId={card.id} current={card.colorTheme} />
        </div>
        <div className="space-y-6">
          <CardControls
            card={card}
            assets={ASSET_LIST}
            balances={balances}
            sourcePrice={sourcePrice}
            sourceUsdValue={sourceUsdValue}
          />
          <CardLimitsForm
            cardId={card.id}
            monthlyLimit={card.monthlyLimit}
            dailyPurchaseLimit={card.dailyPurchaseLimit}
            dailyWithdrawalLimit={card.dailyWithdrawalLimit}
          />
        </div>
      </div>

      <section className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="mb-3">
            <div className="font-medium">Gastado este mes</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              de {formatUsd(card.monthlyLimit)} límite mensual
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums mb-3">
            {formatUsd(monthlySpent)}
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-[width]"
              style={{
                width: `${Math.min(100, (monthlySpent / card.monthlyLimit) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-1.5 text-[10px] font-mono text-zinc-600 text-right">
            {((monthlySpent / card.monthlyLimit) * 100).toFixed(1)}% usado
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="mb-3">
            <div className="font-medium">Fuente de gasto</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              cripto desde donde se cobran las compras
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-2xl font-semibold tracking-tight">
              {card.spendingSource}
            </div>
            <div className="text-xs font-mono text-zinc-500 tabular-nums">
              {formatUsd(sourceUsdValue)}
            </div>
          </div>
          <div className="text-xs font-mono text-zinc-500 tabular-nums">
            saldo {formatAmount(balances[source], source)} {source}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="mb-3">
            <div className="font-medium">Estado</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {card.type === "virtual" ? "Tarjeta virtual" : "Tarjeta física"}
              {card.physicalRequested &&
                card.type === "virtual" &&
                " · física en camino"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                card.status === "active"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400"
              }`}
            />
            <div
              className={`text-2xl font-semibold tracking-tight ${
                card.status === "active" ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {card.status === "active" ? "Activa" : "Congelada"}
            </div>
          </div>
        </div>
      </section>

      <CashbackSection
        cashbackPercent={card.cashbackPercent}
        transactions={transactions.map((t) => ({
          id: t.id,
          merchant: t.merchant,
          category: t.category,
          amountUsd: t.amountUsd,
          cashbackUsd: t.cashbackUsd,
          createdAt: t.createdAt,
        }))}
      />

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
