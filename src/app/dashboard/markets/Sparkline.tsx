type Props = {
  values: number[];
  positive: boolean;
  width?: number;
  height?: number;
};

export function Sparkline({
  values,
  positive,
  width = 160,
  height = 44,
}: Props) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const color = positive ? "#34d399" : "#f87171";
  const fillColor = positive ? "rgba(52, 211, 153, 0.12)" : "rgba(248, 113, 113, 0.12)";
  const lastX = (values.length - 1) * stepX;
  const lastY = height - ((values[values.length - 1] - min) / range) * height;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      className="overflow-visible"
      aria-hidden
    >
      <polygon
        points={`0,${height} ${points} ${lastX},${height}`}
        fill={fillColor}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}
