interface DonutStatProps {
  percentage: number | undefined | null;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
}

/** Compact circular progress ring for a single percentage — collection %, attendance %, etc. */
export default function DonutStat({ percentage, label, sublabel, color = '#4f63e5', size = 128 }: DonutStatProps) {
  const clamped = Math.min(Math.max(percentage ?? 0, 0), 100);
  const stroke = size * 0.11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-100" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{Math.round(clamped)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
      </div>
    </div>
  );
}
