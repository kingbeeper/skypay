import type { AssetSymbol } from "./assets";

export type CryptoAsset = Exclude<AssetSymbol, "USD">;

export function isCryptoAsset(asset: string): asset is CryptoAsset {
  return asset === "BTC" || asset === "ETH" || asset === "USDC" || asset === "SOL";
}

const BTC_RE = /^(bc1[a-z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

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
      return randomHex(64);
    case "ETH":
    case "USDC":
      return `0x${randomHex(64)}`;
    case "SOL":
      return randomBase58(88);
  }
}
