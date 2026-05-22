import { requireUser } from "@/lib/auth";
import { fetchPrices } from "@/lib/prices";
import { ASSET_LIST, type AssetSymbol } from "@/lib/assets";
import { SwapForm } from "./SwapForm";
import { KycRequired } from "../KycRequired";

export const revalidate = 30;

export default async function SwapPage() {
  const user = await requireUser();
  if (user.kycStatus !== "approved") {
    return <KycRequired feature="hacer swap" />;
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
    if ((ASSET_LIST.map((a) => a.symbol) as string[]).includes(b.asset)) {
      balances[b.asset as AssetSymbol] = b.amount;
    }
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
        <p className="text-sm font-mono text-cyan-400 mb-2">/ swap</p>
        <h1 className="text-3xl font-semibold tracking-tight">Intercambiar</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Convierte entre activos al precio del mercado. Sin comisión durante la demo.
        </p>
      </div>

      <SwapForm balances={balances} prices={priceSnapshot} />
    </div>
  );
}
