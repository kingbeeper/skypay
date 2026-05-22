type Props = {
  size?: number;
  className?: string;
};

/**
 * Skypay logomark — a rounded square with a layered upward chevron, suggesting
 * speed + growth in a financial context. Cyan→indigo gradient matches the
 * existing brand palette.
 *
 * Uses a stable gradient ID. Multiple instances on the same page share the
 * same `<defs>` which is valid for identical content and avoids SSR/hydration
 * mismatches that random IDs would cause.
 */
export function Logomark({ size = 28, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="skypay-logo-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#skypay-logo-grad)" />
      <g
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 20 L16 9 L25 20" />
        <path d="M11 22 L16 16 L21 22" strokeOpacity="0.5" />
      </g>
    </svg>
  );
}
