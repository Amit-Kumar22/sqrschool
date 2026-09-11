'use client';

import { useId, useRef, useState } from 'react';

export interface AreaTrendPoint {
  label: string;
  value: number;
  /** Optional secondary count shown alongside the value in the tooltip (e.g. payment count for a revenue point). */
  secondary?: number;
  secondaryLabel?: string;
}

interface AreaTrendChartProps {
  data: AreaTrendPoint[];
  color?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
}

const VIEW_WIDTH = 600;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const GRID_LINES = 4;

/** Builds a smoothed SVG path through the given points using Catmull-Rom-derived cubic bezier control points. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return points.length === 1 ? `M ${points[0].x} ${points[0].y}` : '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Smooth gradient-fill area/line chart for a single trend series — revenue, attendance counts, etc. Scales via viewBox, no fixed pixel width. */
export default function AreaTrendChart({ data, color = '#4f63e5', valueFormatter = (v) => `${v}`, height = 220 }: AreaTrendChartProps) {
  const gradientId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data yet</div>;
  }

  const innerWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = height - PAD_TOP - PAD_BOTTOM;
  // API-sourced values can arrive null/undefined despite the declared type — normalize once here
  // so a missing field degrades to a flat 0 point instead of propagating NaN through the whole chart.
  const values = data.map((d) => d.value ?? 0);
  const maxValue = Math.max(...values, 1);

  const points = values.map((value, i) => ({
    x: PAD_LEFT + (data.length === 1 ? innerWidth / 2 : (innerWidth * i) / (data.length - 1)),
    y: PAD_TOP + innerHeight - (value / maxValue) * innerHeight,
  }));

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD_TOP + innerHeight} L ${points[0].x} ${PAD_TOP + innerHeight} Z`;

  const gridValues = Array.from({ length: GRID_LINES + 1 }, (_, i) => (maxValue * (GRID_LINES - i)) / GRID_LINES);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fraction = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const index = Math.round(fraction * (data.length - 1));
    setHoverIndex(index);
  };

  const active = hoverIndex !== null ? data[hoverIndex] : null;
  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;
  const tooltipPct = activePoint ? (activePoint.x / VIEW_WIDTH) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className="relative w-full touch-none select-none"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverIndex(null)}
    >
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${height}`} preserveAspectRatio="none" className="h-auto w-full" style={{ height }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridValues.map((v, i) => {
          const y = PAD_TOP + (innerHeight * i) / GRID_LINES;
          return (
            <g key={i}>
              <line x1={PAD_LEFT} y1={y} x2={VIEW_WIDTH - PAD_RIGHT} y2={y} stroke="currentColor" className="text-slate-100" strokeWidth={1} strokeDasharray="4 4" />
              <text x={0} y={y - 3} fontSize={9} className="fill-slate-400">
                {valueFormatter(Math.round(v))}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {activePoint && (
          <line x1={activePoint.x} y1={PAD_TOP} x2={activePoint.x} y2={PAD_TOP + innerHeight} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        )}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === i ? 4.5 : 0}
            fill="white"
            stroke={color}
            strokeWidth={2}
            className="transition-all duration-150"
          />
        ))}

        {data.map((d, i) => (
          <text
            key={d.label}
            x={points[i].x}
            y={height - 6}
            fontSize={10}
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
            className="fill-slate-500"
          >
            {d.label}
          </text>
        ))}
      </svg>

      {active && activePoint && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-premium"
          style={{ left: `${Math.min(Math.max(tooltipPct, 12), 88)}%` }}
        >
          <p className="font-semibold text-slate-900">{valueFormatter(active.value ?? 0)}</p>
          {active.secondary !== undefined && (
            <p className="text-slate-500">
              {active.secondaryLabel ?? 'count'}: {active.secondary}
            </p>
          )}
          <p className="text-slate-400">{active.label}</p>
        </div>
      )}
    </div>
  );
}
