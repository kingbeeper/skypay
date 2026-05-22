import { requireUser } from "@/lib/auth";
import { fetchPrices } from "@/lib/prices";
import { ASSET_LIST, type AssetSymbol } from "@/lib/assets";
import { SendForm } from "./SendForm";

export default async function SendPage() {
  const user = await requireUser();
  const prices = await fetchPrices();

  const balances: Record<AssetSymbol, number> = {
    BTC: 0,
    ETH: 0,
    USDC: 0,
    SOL: 0,
  };
  for (const b of user.balances) {
    if (b.asset in balances) {
      balances[b.asset as AssetSymbol] = b.amount;
    }
  }

  const priceSnapshot: Record<AssetSymbol, number> = {
    BTC: prices.BTC.usd,
    ETH: prices.ETH.usd,
    USDC: prices.USDC.usd,
    SOL: prices.SOL.usd,
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-mono text-cyan-400 mb-2">/ enviar</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Enviar cripto
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Transfiere a cualquier wallet externa. Sin comisión durante la demo.
          Verifica siempre la dirección antes de confirmar — las transferencias
          on-chain son irreversibles.
        </p>
      </div>

      <SendForm balances={balances} prices={priceSnapshot} assets={ASSET_LIST} />
    </div>
  );
}
