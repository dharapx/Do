"use client";

interface Props {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}

export function MiniRing({
  value,
  size = 64,
  strokeWidth = 6,
  color = "hsl(var(--primary))",
  bgColor = "hsl(var(--muted))",
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} className="drop-shadow-sm">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-xs font-semibold tabular-nums"
      >
        {clamped}%
      </text>
    </svg>
  );
}
