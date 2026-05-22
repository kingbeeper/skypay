import type { AssetSymbol } from "./assets";

export type CryptoAsset = Exclude<AssetSymbol, "USD">;

export function isCryptoAsset(asset: string): asset is CryptoAsset {
  return (
    asset === "BTC" ||
    asset === "ETH" ||
    asset === "USDC" ||
    asset === "SOL" ||
    asset === "LTC"
  );
}

const BTC_RE = /^(bc1[a-z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const LTC_RE = /^(ltc1[a-z0-9]{25,87}|[LM3][a-km-zA-HJ-NP-Z1-9]{25,34})$/;

export function isValidAddress(asset: CryptoAsset, address: string): boolean {
  const a = address.trim();
  if (!a) return false;
  switch (asset) {
    case "BTC":
      return BTC_RE.test(a);
    case "ETH":
    case "USDC":
      return EVM_RE.test(a);
    case "SOL":
      return SOL_RE.test(a);
    case "LTC":
      return LTC_RE.test(a);
  }
}

export function networkLabel(asset: CryptoAsset): string {
  switch (asset) {
    case "BTC":
      return "Bitcoin";
    case "ETH":
      return "Ethereum";
    case "USDC":
      return "Ethereum · ERC-20";
    case "SOL":
      return "Solana";
    case "LTC":
      return "Litecoin";
  }
}

export function addressPlaceholder(asset: CryptoAsset): string {
  switch (asset) {
    case "BTC":
      return "bc1q… o 1… / 3…";
    case "ETH":
    case "USDC":
      return "0x…";
    case "SOL":
      return "Dirección Solana";
    case "LTC":
      return "ltc1q… o L… / M…";
  }
}

export function shortenAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 2) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

function randomHex(len: number): string {
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, len);
}

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function randomBase58(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += BASE58_ALPHABET[bytes[i] % BASE58_ALPHABET.length];
  }
  return out;
}

export function generateTxHash(asset: CryptoAsset): string {
  switch (asset) {
    case "BTC":
    case "LTC":
      return randomHex(64);
    case "ETH":
    case "USDC":
      return `0x${randomHex(64)}`;
    case "SOL":
      return randomBase58(88);
  }
}

// ----- Receive networks + deterministic deposit address derivation -----

export type AddressFormat = "btc-bech32" | "evm" | "solana" | "ltc-bech32";

export type ReceiveNetwork = {
  id: string;
  label: string;
  shortLabel: string;
  format: AddressFormat;
  confirmationTime: string;
  warning?: string;
};

export const NETWORKS_BY_ASSET: Record<CryptoAsset, ReceiveNetwork[]> = {
  BTC: [
    {
      id: "bitcoin",
      label: "Bitcoin",
      shortLabel: "Bitcoin",
      format: "btc-bech32",
      confirmationTime: "~10 min · 1 confirmación",
    },
  ],
  ETH: [
    {
      id: "ethereum",
      label: "Ethereum mainnet",
      shortLabel: "Ethereum",
      format: "evm",
      confirmationTime: "~15 segundos",
    },
  ],
  USDC: [
    {
      id: "ethereum",
      label: "Ethereum · ERC-20",
      shortLabel: "Ethereum",
      format: "evm",
      confirmationTime: "~15 segundos",
      warning: "Solo envíes USDC ERC-20 a esta dirección.",
    },
    {
      id: "polygon",
      label: "Polygon · PoS",
      shortLabel: "Polygon",
      format: "evm",
      confirmationTime: "~2 segundos",
      warning: "Solo envíes USDC en red Polygon.",
    },
    {
      id: "base",
      label: "Base",
      shortLabel: "Base",
      format: "evm",
      confirmationTime: "~2 segundos",
      warning: "Solo envíes USDC en red Base.",
    },
    {
      id: "solana",
      label: "Solana · SPL",
      shortLabel: "Solana",
      format: "solana",
      confirmationTime: "<1 segundo",
      warning: "Solo envíes USDC SPL (Solana). USDC de otra red se perderá.",
    },
  ],
  SOL: [
    {
      id: "solana",
      label: "Solana",
      shortLabel: "Solana",
      format: "solana",
      confirmationTime: "<1 segundo",
    },
  ],
  LTC: [
    {
      id: "litecoin",
      label: "Litecoin",
      shortLabel: "Litecoin",
      format: "ltc-bech32",
      confirmationTime: "~2 min · 1 confirmación",
    },
  ],
};

const BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function fnv1a32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function* xorshift32(seed: number): Generator<number> {
  let s = (seed | 0) || 1;
  while (true) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    yield s >>> 0;
  }
}

function pickFromAlphabet(
  rng: Generator<number>,
  alphabet: string,
  count: number
): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    const next = rng.next().value;
    if (typeof next !== "number") break;
    out += alphabet[next % alphabet.length];
  }
  return out;
}

const HEX = "0123456789abcdef";

/**
 * Deterministically derive a format-valid (but on-chain meaningless) demo
 * deposit address from a seed string. Same seed → same address every call.
 */
export function deriveDepositAddress(
  seed: string,
  format: AddressFormat
): string {
  const rng = xorshift32(fnv1a32(seed));
  switch (format) {
    case "btc-bech32":
      return "bc1q" + pickFromAlphabet(rng, BECH32_ALPHABET, 38);
    case "ltc-bech32":
      return "ltc1q" + pickFromAlphabet(rng, BECH32_ALPHABET, 38);
    case "evm":
      return "0x" + pickFromAlphabet(rng, HEX, 40);
    case "solana":
      return pickFromAlphabet(rng, BASE58_ALPHABET, 44);
  }
}
