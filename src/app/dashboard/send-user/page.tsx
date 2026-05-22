import { requireUser } from "@/lib/auth";
import { ASSET_LIST, type AssetSymbol } from "@/lib/assets";
import { P2PForm } from "./P2PForm";

export default async function SendUserPage() {
  const user = await requireUser();

  const balances: Record<AssetSymbol, number> = {
    BTC: 0,
    ETH: 0,
    USDC: 0,
    SOL: 0,
    LTC: 0,
  };
  for (const b of user.balances) {
    if (b.asset in balances) {
      balances[b.asset as AssetSymbol] = b.amount;
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-mono text-cyan-400 mb-2">/ enviar a usuario</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Pagar a otro usuario
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Transferencia instantánea entre cuentas Skypay, gratis y sin tocar
          la blockchain. Solo necesitas su correo.
        </p>
      </div>

      <P2PForm balances={balances} assets={ASSET_LIST} />
    </div>
  );
}
