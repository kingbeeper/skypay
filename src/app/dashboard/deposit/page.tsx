import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { fetchPrices } from "@/lib/prices";
import { ASSET_LIST, type AssetSymbol } from "@/lib/assets";
import { DepositForm } from "./DepositForm";
import { KycRequired } from "../KycRequired";

export const revalidate = 30;

export default async function DepositPage() {
  const user = await requireUser();
  if (user.kycStatus !== "approved") {
    return <KycRequired feature="depositar" />;
  }
  const prices = await fetchPrices();

  const balances: Record<AssetSymbol, number> = {
    BTC: 0,
    ETH: 0,
    USDC: 0,
    SOL: 0,
    LTC: 0,
  };
  for (const b of user.balances) {
    if (b.asset in balances) balances[b.asset as AssetSymbol] = b.amount;
  }

  const priceSnapshot: Record<AssetSymbol, number> = {
    BTC: prices.BTC.usd,
    ETH: prices.ETH.usd,
    USDC: prices.USDC.usd,
    SOL: prices.SOL.usd,
    LTC: prices.LTC.usd,
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors mb-3 inline-block"
        >
          ← Dashboard
        </Link>
        <p className="text-sm font-mono text-cyan-400 mb-2">/ depositar</p>
        <h1 className="text-3xl font-semibold tracking-tight">Añadir fondos</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Modo demo: el saldo se acredita al instante para que pruebes la
          plataforma. En producción, transferencia bancaria 1–2 días, tarjeta y
          cripto al instante.
        </p>
      </div>

      <DepositForm
        balances={balances}
        prices={priceSnapshot}
        assets={ASSET_LIST}
      />
    </div>
  );
}
