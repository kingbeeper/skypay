type Props = {
  values: number[];
  positive: boolean;
};

export function PriceChart({ values, positive }: Props) {
  if (values.length < 2) return null;

  const width = 720;
  const height = 280;
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 48;
  const padRight = 16;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = chartW / (values.length - 1);

  const points = values.map((v, i) => ({
    x: padLeft + i * stepX,
    y: padTop + chartH - ((v - min) / range) * chartH,
  }));
  const pathD =
    "M " + points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L ");
  const fillD =
    `${pathD} L ${points[points.length - 1].x.toFixed(2)},${padTop + chartH} L ${points[0].x.toFixed(2)},${padTop + chartH} Z`;

  const line = positive ? "#34d399" : "#f87171";
  const fillStart = positive ? "rgba(52,211,153,0.32)" : "rgba(248,113,113,0.32)";
  const gridColor = "rgba(255,255,255,0.06)";
  const labelColor = "rgba(161,161,170,0.8)";

  // 5 horizontal grid lines
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padTop + (chartH * i) / 4;
    const value = max - (range * i) / 4;
    return { y, value };
  });

  const lastX = points[points.length - 1].x;
  const lastY = points[points.length - 1].y;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fillStart} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={padLeft}
            x2={width - padRight}
            y1={g.y}
            y2={g.y}
            stroke={gridColor}
            strokeWidth="1"
          />
          <text
            x={padLeft - 8}
            y={g.y + 4}
            textAnchor="end"
            fontSize="10"
            fontFamily="ui-monospace, monospace"
            fill={labelColor}
          >
            {g.value < 1
              ? g.value.toFixed(3)
              : g.value < 100
                ? g.value.toFixed(2)
                : Math.round(g.value).toLocaleString("en-US")}
          </text>
        </g>
      ))}

      <path d={fillD} fill="url(#chart-fill)" />
      <path
        d={pathD}
        fill="none"
        stroke={line}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="4" fill={line} />
      <circle cx={lastX} cy={lastY} r="8" fill={line} fillOpacity="0.2" />
    </svg>
  );
}
