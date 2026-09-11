'use client';

import { useState } from 'react';
import { categoryColor } from '../chartColors';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarDatum[];
  valueFormatter?: (value: number) => string;
  height?: number;
}

const VIEW_WIDTH = 600;
const PAD_LEFT = 4;
const PAD_RIGHT = 4;
const PAD_TOP = 22;
const PAD_BOTTOM = 24;
const GRID_LINES = 4;
const BAR_GAP_RATIO = 0.38;

/** Vertical categorical bar chart — one color per category in the site's fixed order, direct value labels, hover highlight. */
export default function SimpleBarChart({ data, valueFormatter = (v) => `${v}`, height = 220 }: SimpleBarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data yet</div>;
  }

  const innerWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = height - PAD_TOP - PAD_BOTTOM;
  // API-sourced values can arrive null/undefined despite the declared type — normalize once here
  // so a missing field renders as a zero-height bar instead of propagating NaN through the chart.
  const values = data.map((d) => d.value ?? 0);
  const maxValue = Math.max(...values, 1);
  const slot = innerWidth / data.length;
  const barWidth = slot * (1 - BAR_GAP_RATIO);

  const gridValues = Array.from({ length: GRID_LINES + 1 }, (_, i) => (maxValue * (GRID_LINES - i)) / GRID_LINES);

  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${height}`} preserveAspectRatio="none" className="h-auto w-full" style={{ height }}>
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

      {data.map((d, i) => {
        const barHeight = (values[i] / maxValue) * innerHeight;
        const x = PAD_LEFT + slot * i + (slot - barWidth) / 2;
        const y = PAD_TOP + innerHeight - barHeight;
        const fill = d.color ?? categoryColor(i);
        const active = hoverIndex === i;
        return (
          <g
            key={d.label}
            onPointerEnter={() => setHoverIndex(i)}
            onPointerLeave={() => setHoverIndex((h) => (h === i ? null : h))}
            className="cursor-pointer"
          >
            <rect x={x} y={PAD_TOP} width={barWidth} height={innerHeight} fill="transparent" />
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx={4}
              fill={fill}
              opacity={active ? 1 : 0.88}
              className="transition-opacity duration-150"
            />
            <text x={x + barWidth / 2} y={y - 6} fontSize={10} textAnchor="middle" className={active ? 'fill-slate-900 font-semibold' : 'fill-slate-500'}>
              {valueFormatter(values[i])}
            </text>
            <text x={x + barWidth / 2} y={height - 6} fontSize={10} textAnchor="middle" className="fill-slate-500">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
