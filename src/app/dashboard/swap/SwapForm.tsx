"use client";

import { useActionState, useMemo, useState } from "react";
import { swapAction, type SwapResult } from "@/app/actions";
import { ASSETS, ASSET_LIST, type AssetSymbol, formatAmount, formatUsd } from "@/lib/assets";

type Props = {
  balances: Record<AssetSymbol, number>;
  prices: Record<AssetSymbol, number>;
};

export function SwapForm({ balances, prices }: Props) {
  const [fromAsset, setFromAsset] = useState<AssetSymbol>("USDC");
  const [toAsset, setToAsset] = useState<AssetSymbol>("BTC");
  const [fromAmount, setFromAmount] = useState<string>("");

  const [state, formAction, pending] = useActionState<SwapResult, FormData>(
    swapAction,
    undefined
  );

  const numericFrom = Number(fromAmount);
  const validAmount = Number.isFinite(numericFrom) && numericFrom > 0;
  const fromPrice = prices[fromAsset] ?? 0;
  const toPrice = prices[toAsset] ?? 0;
  const rate = fromPrice && toPrice ? fromPrice / toPrice : 0;
  const estimated = validAmount && rate ? numericFrom * rate : 0;
  const usdValue = validAmount ? numericFrom * fromPrice : 0;

  const overBalance = validAmount && numericFrom > balances[fromAsset];
  const sameAsset = fromAsset === toAsset;
  const disabled = !validAmount || overBalance || sameAsset || pending;

  const fromOptions = useMemo(() => ASSET_LIST, []);
  const toOptions = useMemo(() => ASSET_LIST, []);

  const handleReverse = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setFromAmount("");
  };

  const handleMax = () => {
    const max = balances[fromAsset];
    if (max > 0) {
      const precision = ASSETS[fromAsset].precision;
      setFromAmount(max.toFixed(precision).replace(/\.?0+$/, ""));
    }
  };

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="fromAsset" value={fromAsset} />
      <input type="hidden" name="toAsset" value={toAsset} />
      <input type="hidden" name="fromAmount" value={fromAmount} />

      <AssetPanel
        label="De"
        balance={balances[fromAsset]}
        asset={fromAsset}
        onAssetChange={(v) => {
          setFromAsset(v);
          if (v === toAsset) {
            const fallback = ASSET_LIST.find((a) => a.symbol !== v)?.symbol;
            if (fallback) setToAsset(fallback);
          }
        }}
        options={fromOptions}
        amount={fromAmount}
        onAmountChange={setFromAmount}
        onMax={handleMax}
        usdValue={usdValue}
        editable
      />

      <div className="flex justify-center -my-1">
        <button
          type="button"
          onClick={handleReverse}
          className="h-9 w-9 rounded-full border border-white/10 bg-[color:var(--background)] hover:bg-white/[0.06] transition-colors flex items-center justify-center"
          aria-label="Invertir"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3v18M7 21l-4-4M7 21l4-4M17 21V3M17 3l-4 4M17 3l4 4" />
          </svg>
        </button>
      </div>

      <AssetPanel
        label="A"
        balance={balances[toAsset]}
        asset={toAsset}
        onAssetChange={(v) => {
          setToAsset(v);
          if (v === fromAsset) {
            const fallback = ASSET_LIST.find((a) => a.symbol !== v)?.symbol;
            if (fallback) setFromAsset(fallback);
          }
        }}
        options={toOptions}
        amount={estimated > 0 ? formatAmount(estimated, toAsset) : ""}
        onAmountChange={() => {}}
        usdValue={estimated * toPrice}
        editable={false}
      />

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 mt-4 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Tasa</span>
          <span className="font-mono">
            1 {fromAsset} ={" "}
            {rate > 0 ? formatAmount(rate, toAsset) : "—"} {toAsset}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Comisión</span>
          <span className="font-mono text-emerald-400">$0.00</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Recibirás</span>
          <span className="font-mono font-medium">
            {estimated > 0 ? formatAmount(estimated, toAsset) : "—"} {toAsset}
          </span>
        </div>
      </div>

      {state?.ok === false && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
          ✓ {state.message}
        </p>
      )}
      {overBalance && (
        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
          Excede tu saldo disponible
        </p>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="w-full h-12 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
      >
        {pending ? "Procesando…" : "Confirmar swap"}
      </button>
    </form>
  );
}

type AssetPanelProps = {
  label: string;
  balance: number;
  asset: AssetSymbol;
  onAssetChange: (v: AssetSymbol) => void;
  options: typeof ASSET_LIST;
  amount: string;
  onAmountChange: (v: string) => void;
  onMax?: () => void;
  usdValue: number;
  editable: boolean;
};

function AssetPanel({
  label,
  balance,
  asset,
  onAssetChange,
  options,
  amount,
  onAmountChange,
  onMax,
  usdValue,
  editable,
}: AssetPanelProps) {
  const info = ASSETS[asset];
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-zinc-500">{label}</span>
        <span className="text-xs font-mono text-zinc-500">
          Balance: {formatAmount(balance, asset)} {asset}
          {editable && onMax && balance > 0 && (
            <button
              type="button"
              onClick={onMax}
              className="ml-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Max
            </button>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          readOnly={!editable}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^\d.]/g, "");
            const parts = cleaned.split(".");
            const safe =
              parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
            onAmountChange(safe);
          }}
          className={`flex-1 bg-transparent text-3xl font-semibold tracking-tight outline-none ${
            editable ? "text-white" : "text-zinc-300"
          }`}
        />
        <select
          value={asset}
          onChange={(e) => onAssetChange(e.target.value as AssetSymbol)}
          className="h-11 rounded-full border border-white/10 bg-white/[0.04] px-4 pr-8 text-sm font-medium appearance-none cursor-pointer hover:bg-white/[0.07] transition-colors"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23a1a1aa' stroke-width='2' viewBox='0 0 24 24'><path d='M6 9l6 6 6-6'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
        >
          {options.map((o) => (
            <option key={o.symbol} value={o.symbol}>
              {o.symbol}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2 text-xs font-mono text-zinc-500">
        ≈ {formatUsd(usdValue)}{" "}
        <span className="ml-2 text-zinc-600">{info.name}</span>
      </div>
    </div>
  );
}
