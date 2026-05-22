import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { ASSET_LIST } from "@/lib/assets";
import { KycRequired } from "../KycRequired";
import {
  NETWORKS_BY_ASSET,
  deriveDepositAddress,
  isCryptoAsset,
  shortenAddress,
  type CryptoAsset,
  type ReceiveNetwork,
} from "@/lib/addresses";
import { CopyAddressButton } from "./CopyAddressButton";

type SearchParams = Promise<{ asset?: string; network?: string }>;

export default async function ReceivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  if (user.kycStatus !== "approved") {
    return <KycRequired feature="recibir cripto" />;
  }
  const { asset: assetParam, network: networkParam } = await searchParams;

  // Step 1: pick crypto
  if (!assetParam || !isCryptoAsset(assetParam)) {
    return <AssetPicker />;
  }

  const asset = assetParam;
  const networks = NETWORKS_BY_ASSET[asset];

  // Auto-pick single-network assets
  if (networks.length === 1 && !networkParam) {
    redirect(`/dashboard/receive?asset=${asset}&network=${networks[0].id}`);
  }

  // Step 2: pick network when multiple
  if (!networkParam || !networks.find((n) => n.id === networkParam)) {
    return <NetworkPicker asset={asset} networks={networks} />;
  }

  const network = networks.find((n) => n.id === networkParam)!;
  const address = deriveDepositAddress(
    `${user.id}:${asset}:${network.id}`,
    network.format
  );

  // Generate QR as SVG string with transparent background and light dots so
  // we can render it on a white card in the dark UI.
  const qrSvg = await QRCode.toString(address, {
    type: "svg",
    margin: 1,
    width: 280,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0a0a0f",
      light: "#ffffff",
    },
  });

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <Header
        crumb={
          <>
            <Link
              href="/dashboard/receive"
              className="hover:text-zinc-300 transition-colors"
            >
              recibir
            </Link>
            {" / "}
            <Link
              href={`/dashboard/receive?asset=${asset}`}
              className="hover:text-zinc-300 transition-colors"
            >
              {asset}
            </Link>
            {" / "}
            <span className="text-zinc-400">{network.shortLabel}</span>
          </>
        }
        title={`Recibir ${asset}`}
        subtitle={`Comparte esta dirección o el QR para recibir ${asset} en la red ${network.label}. Es tu dirección permanente.`}
      />

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
        {/* QR */}
        <div className="flex justify-center">
          <div
            className="rounded-2xl bg-white p-4 shadow-lg shadow-cyan-500/5"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        {/* Network/Asset chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/[0.08] px-3 h-7 text-cyan-200">
            {asset}
          </span>
          <span className="text-zinc-600">en</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 h-7 text-zinc-200">
            {network.label}
          </span>
        </div>

        {/* Address */}
        <div className="mt-6">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
            Tu dirección
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[color:var(--background)] p-4">
            <div className="font-mono text-xs sm:text-sm break-all text-zinc-200">
              {address}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">
              {shortenAddress(address, 10, 8)}
            </span>
            <CopyAddressButton address={address} />
          </div>
        </div>

        {/* Network info */}
        <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <Row label="Red">{network.label}</Row>
          <Row label="Confirmación esperada">{network.confirmationTime}</Row>
          <Row label="Comisión de recepción">
            <span className="text-emerald-400">gratis</span>
          </Row>
        </div>

        {/* Warnings */}
        <div className="mt-5 space-y-2">
          {network.warning && (
            <Warning>{network.warning}</Warning>
          )}
          <Warning tone="amber">
            ⚠ Esta es una dirección de <strong>demo</strong> — no está en
            ninguna blockchain real. No envíes cripto de verdad a esta
            dirección, se perderá.
          </Warning>
        </div>

        {networks.length > 1 && (
          <div className="mt-5 text-center">
            <Link
              href={`/dashboard/receive?asset=${asset}`}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← Cambiar de red
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function AssetPicker() {
  const cryptoAssets = ASSET_LIST as (typeof ASSET_LIST)[number][];

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <Header
        title="Recibir cripto"
        subtitle="Elige qué criptomoneda quieres recibir. Luego elegirás la red."
      />
      <div className="space-y-3">
        {cryptoAssets.map((a) => {
          const networks = NETWORKS_BY_ASSET[a.symbol as CryptoAsset];
          return (
            <Link
              key={a.symbol}
              href={`/dashboard/receive?asset=${a.symbol}`}
              className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.04] hover:border-white/[0.15] transition-colors"
            >
              <span
                className="inline-flex h-11 w-11 shrink-0 rounded-full items-center justify-center font-mono text-sm font-semibold"
                style={{
                  backgroundColor: a.color + "22",
                  color: a.color,
                }}
              >
                {a.symbol[0]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-zinc-500 font-mono">
                  {a.symbol} ·{" "}
                  {networks.length === 1
                    ? networks[0].shortLabel
                    : `${networks.length} redes disponibles`}
                </div>
              </div>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-zinc-500 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NetworkPicker({
  asset,
  networks,
}: {
  asset: CryptoAsset;
  networks: ReceiveNetwork[];
}) {
  return (
    <div className="max-w-xl mx-auto space-y-8">
      <Header
        crumb={
          <>
            <Link
              href="/dashboard/receive"
              className="hover:text-zinc-300 transition-colors"
            >
              recibir
            </Link>
            {" / "}
            <span className="text-zinc-400">{asset}</span>
          </>
        }
        title={`Elige red para ${asset}`}
        subtitle="Asegúrate de que el remitente envía en la misma red — fondos en una red distinta pueden perderse."
      />
      <div className="space-y-3">
        {networks.map((n) => (
          <Link
            key={n.id}
            href={`/dashboard/receive?asset=${asset}&network=${n.id}`}
            className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.04] hover:border-white/[0.15] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium">{n.label}</div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">
                {n.confirmationTime}
              </div>
            </div>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-zinc-500 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Header({
  crumb,
  title,
  subtitle,
}: {
  crumb?: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-sm font-mono text-cyan-400 mb-2">
        {crumb ?? "/ recibir"}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-mono">{children}</span>
    </div>
  );
}

function Warning({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "amber";
}) {
  const styles =
    tone === "amber"
      ? "border-amber-500/30 bg-amber-500/[0.06] text-amber-200/90"
      : "border-rose-500/30 bg-rose-500/[0.06] text-rose-200/90";
  return (
    <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}

