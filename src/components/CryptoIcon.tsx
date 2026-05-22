type Props = {
  symbol: string;
  size?: number;
  className?: string;
};

/**
 * Inline SVG logos for the supported cryptocurrencies. Each is a circular
 * coin with the brand color of the protocol and a recognizable glyph.
 * Drawn as paths/shapes (no system fonts) so they look identical everywhere.
 */
export function CryptoIcon({ symbol, size = 32, className = "" }: Props) {
  const common = { size, className };
  switch (symbol.toUpperCase()) {
    case "BTC":
      return <BtcIcon {...common} />;
    case "ETH":
      return <EthIcon {...common} />;
    case "USDC":
      return <UsdcIcon {...common} />;
    case "SOL":
      return <SolIcon {...common} />;
    case "LTC":
      return <LtcIcon {...common} />;
    default:
      return <FallbackIcon symbol={symbol} {...common} />;
  }
}

function BtcIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#f7931a" />
      <path
        d="M21.31 13.92c.29-1.91-1.17-2.94-3.17-3.63l.65-2.6-1.59-.39-.63 2.53c-.42-.1-.84-.2-1.27-.29l.64-2.55-1.58-.4-.65 2.6c-.34-.08-.68-.15-1.01-.23v-.01l-2.19-.55-.42 1.69s1.18.27 1.15.29c.64.16.76.59.74.92l-.75 2.99c.04.01.1.03.18.06l-.18-.05-1.04 4.16c-.08.2-.27.49-.72.38.02.02-1.16-.29-1.16-.29l-.78 1.82 2.07.52c.38.1.76.2 1.13.29l-.66 2.63 1.58.4.65-2.6c.43.12.85.22 1.26.32l-.64 2.6 1.58.4.66-2.63c2.7.51 4.73.31 5.59-2.13.69-1.97-.03-3.1-1.46-3.84 1.04-.24 1.82-.92 2.03-2.32zm-3.62 5.07c-.49 1.97-3.81.91-4.89.64l.87-3.48c1.08.27 4.54.81 4.02 2.84zm.49-5.1c-.45 1.79-3.21.88-4.11.66l.79-3.16c.9.22 3.79.64 3.32 2.5z"
        fill="white"
      />
    </svg>
  );
}

function EthIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#627eea" />
      <g fill="white" fillRule="evenodd">
        <path opacity="0.6" d="M16 4v8.87l7.5 3.35z" />
        <path d="M16 4l-7.5 12.22 7.5-3.35z" />
        <path opacity="0.6" d="M16 21.97v6.03l7.5-10.39z" />
        <path d="M16 28v-6.03l-7.5-4.36z" />
        <path opacity="0.2" d="M16 20.57l7.5-4.35-7.5-3.35z" />
        <path opacity="0.6" d="M8.5 16.22l7.5 4.35v-7.7z" />
      </g>
    </svg>
  );
}

function UsdcIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#2775ca" />
      {/* Stylized $ — vertical stroke + S */}
      <path
        d="M16 7.5v1.6c-2 .2-3.4 1.3-3.4 2.9 0 1.8 1.4 2.5 3.7 3l.4.1c1.8.4 2.5.8 2.5 1.7 0 .9-.9 1.5-2.4 1.5-1.5 0-2.5-.6-2.6-1.6h-2c0 1.9 1.6 3 3.8 3.2v1.6h1.6v-1.6c2.1-.2 3.6-1.4 3.6-3.1 0-1.9-1.4-2.6-3.7-3.1l-.3-.1c-1.8-.4-2.6-.7-2.6-1.6 0-.8.9-1.4 2.3-1.4 1.4 0 2.3.6 2.4 1.5h2c-.1-1.8-1.6-2.9-3.7-3.1V7.5h-1.6z"
        fill="white"
      />
    </svg>
  );
}

function SolIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="sol-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#9945ff" />
          <stop offset="100%" stopColor="#14f195" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="#0a0a0f" />
      <g fill="url(#sol-grad)">
        <path d="M8.5 10.5 L21.5 10.5 L23.5 12.5 L10.5 12.5 Z" />
        <path d="M8.5 14.5 L21.5 14.5 L23.5 16.5 L10.5 16.5 Z" />
        <path d="M8.5 18.5 L21.5 18.5 L23.5 20.5 L10.5 20.5 Z" />
      </g>
    </svg>
  );
}

function LtcIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#345d9d" />
      {/* Stylized Ł — vertical leg + diagonal crossbar + horizontal foot */}
      <path
        d="M 14.5 7 L 17.8 7 L 15.6 14.6 L 19 13.5 L 18.3 16.2 L 14.9 17.3 L 13.6 22 L 22 22 L 21.2 25 L 10 25 L 12 18 L 9.6 18.8 L 10.3 16.1 L 12.7 15.3 L 14.5 7 Z"
        fill="white"
      />
    </svg>
  );
}

function FallbackIcon({
  symbol,
  size,
  className,
}: {
  symbol: string;
  size: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#52525b" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="14"
        fontWeight="600"
        fill="white"
      >
        {symbol.charAt(0).toUpperCase()}
      </text>
    </svg>
  );
}
