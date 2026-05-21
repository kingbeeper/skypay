"use client";

import { useActionState, useState } from "react";
import { sendCryptoAction, type SendResult } from "@/app/actions";
import {
  ASSETS,
  formatAmount,
  formatUsd,
  type AssetInfo,
  type AssetSymbol,
} from "@/lib/assets";
import {
  addressPlaceholder,
  isCryptoAsset,
  isValidAddress,
  networkLabel,
  shortenAddress,
  type CryptoAsset,
} from "@/lib/addresses";

type Props = {
  balances: Record<AssetSymbol, number>;
  prices: Record<AssetSymbol, number>;
  assets: AssetInfo[];
};

type Stage = "form" | "review";

export function SendForm({ balances, prices, assets }: Props) {
  const cryptoAssets = assets.filter((a) => a.symbol !== "USD") as (AssetInfo & {
    symbol: CryptoAsset;
  })[];

  const [asset, setAsset] = useState<CryptoAsset>("BTC");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Stage>("form");

  const [state, formAction, pending] = useActionState<SendResult, FormData>(
    sendCryptoAction,
    undefined
  );

  const numeric = Number(amount);
  const validAmount = Number.isFinite(numeric) && numeric > 0;
  const validAddr = isCryptoAsset(asset) && isValidAddress(asset, address);
  const overBalance = validAmount && numeric > balances[asset];
  const canReview = validAmount && validAddr && !overBalance;

  const price = prices[asset] ?? 0;
  const usdValue = validAmount ? numeric * price : 0;

  const handleMax = () => {
    const max = balances[asset];
    if (max > 0) {
      const precision = ASSETS[asset].precision;
      setAmount(max.toFixed(precision).replace(/\.?0+$/, ""));
    }
  };

  const handleAssetChange = (next: CryptoAsset) => {
    setAsset(next);
    setAddress("");
  };

  // Success state
  if (state?.ok === true) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.06] p-7 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-2xl">
            ✓
          </div>
          <div className="mt-4 text-xs font-mono uppercase tracking-wider text-emerald-300/80">
            Transacción enviada
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {formatAmount(state.amount, state.asset as AssetSymbol)}{" "}
            <span className="text-emerald-300">{state.asset}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500 font-mono">
            a {shortenAddress(state.address, 8, 6)}
          </div>
          <div className="mt-5 text-left rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
              Hash de la transacción
            </div>
            <div className="font-mono text-[11px] text-zinc-300 break-all">
              {state.txHash}
            </div>
          </div>
          <p className="mt-4 text-[11px] text-zinc-600">
            En una red real esto se confirmaría en {confirmationTime(state.asset)}.
            Demo · sin broadcast on-chain.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStage("form");
            setAddress("");
            setAmount("");
            // re-mount via reload to reset action state (cleanest)
            window.location.reload();
          }}
          className="w-full h-11 rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors"
        >
          Enviar otra
        </button>
      </div>
    );
  }

  // Review stage
  if (stage === "review") {
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="asset" value={asset} />
        <input type="hidden" name="address" value={address} />
        <input type="hidden" name="amount" value={amount} />

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">
            Revisa los detalles
          </div>
          <Row label="Enviando">
            <div className="text-right">
              <div className="font-mono font-medium">
                {formatAmount(numeric, asset)} {asset}
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                ≈ {formatUsd(usdValue)}
              </div>
            </div>
          </Row>
          <Row label="A la dirección">
            <span className="font-mono text-xs break-all text-right max-w-[60%]">
              {address}
            </span>
          </Row>
          <Row label="Red">{networkLabel(asset)}</Row>
          <Row label="Comisión de red">
            <span className="font-mono text-emerald-400">gratis</span>
          </Row>
          <Row label="Total a debitar" emphasize>
            <span className="font-mono font-semibold">
              {formatAmount(numeric, asset)} {asset}
            </span>
          </Row>
        </div>

        {state?.ok === false && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-xs text-amber-200/90">
          ⚠ Las transferencias on-chain son irreversibles. Verifica la dirección
          y la red antes de confirmar.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStage("form")}
            disabled={pending}
            className="h-12 rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors disabled:opacity-40"
          >
            Atrás
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Enviando…" : "Confirmar envío"}
          </button>
        </div>
      </form>
    );
  }

  // Form stage
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-zinc-500">Activo</span>
          <span className="text-xs font-mono text-zinc-500">
            Balance: {formatAmount(balances[asset], asset)} {asset}
          </span>
        </div>
        <select
          value={asset}
          onChange={(e) => handleAssetChange(e.target.value as CryptoAsset)}
          className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 pr-8 text-sm font-medium appearance-none cursor-pointer hover:bg-white/[0.07] transition-colors"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23a1a1aa' stroke-width='2' viewBox='0 0 24 24'><path d='M6 9l6 6 6-6'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
          }}
        >
          {cryptoAssets.map((a) => (
            <option key={a.symbol} value={a.symbol}>
              {a.symbol} · {a.name}
            </option>
          ))}
        </select>
        <div className="mt-2 text-[11px] font-mono text-zinc-500">
          Red: {networkLabel(asset)}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-zinc-500">
            Dirección de destino
          </span>
          {address && (
            <span
              className={`text-[10px] font-mono ${
                validAddr ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {validAddr ? "✓ formato válido" : "formato no válido"}
            </span>
          )}
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value.trim())}
          placeholder={addressPlaceholder(asset)}
          spellCheck={false}
          autoComplete="off"
          className="w-full bg-transparent font-mono text-sm outline-none border border-white/10 rounded-lg px-3 py-2.5 focus:border-cyan-400/40 transition-colors"
        />
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-zinc-500">Cantidad</span>
          <button
            type="button"
            onClick={handleMax}
            disabled={balances[asset] <= 0}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-30"
          >
            Max
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d.]/g, "");
              const parts = cleaned.split(".");
              const safe =
                parts.length > 2
                  ? `${parts[0]}.${parts.slice(1).join("")}`
                  : cleaned;
              setAmount(safe);
            }}
            className="flex-1 bg-transparent text-3xl font-semibold tracking-tight outline-none text-white"
          />
          <span className="text-sm font-mono text-zinc-400">{asset}</span>
        </div>
        <div className="mt-2 text-xs font-mono text-zinc-500">
          ≈ {formatUsd(usdValue)}
        </div>
      </div>

      {overBalance && (
        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
          Excede tu saldo disponible
        </p>
      )}
      {address && !validAddr && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          Dirección {asset} con formato inválido. Verifica que estés en la red
          correcta.
        </p>
      )}

      <button
        type="button"
        disabled={!canReview}
        onClick={() => setStage("review")}
        className="w-full h-12 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar
      </button>
    </div>
  );
}

function Row({
  label,
  children,
  emphasize,
}: {
  label: string;
  children: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-2.5 ${
        emphasize
          ? "border-t border-white/[0.08] mt-2 pt-3"
          : "border-b border-white/[0.04] last:border-b-0"
      }`}
    >
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function confirmationTime(asset: string): string {
  switch (asset) {
    case "BTC":
      return "~10 min";
    case "ETH":
    case "USDC":
      return "~15 segundos";
    case "SOL":
      return "<1 segundo";
    default:
      return "~minutos";
  }
}
