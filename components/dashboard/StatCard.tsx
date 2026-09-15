import type { LucideIcon } from 'lucide-react';

type Color = 'brand' | 'indigo' | 'amber' | 'emerald' | 'violet' | 'sky' | 'rose';

const COLOR_STYLES: Record<Color, { icon: string; bar: string; glow: string }> = {
  brand: { icon: 'bg-brand-50 text-brand-600 ring-brand-100', bar: 'from-brand-500 to-brand-300', glow: 'hover:shadow-glow-brand-lg' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600 ring-indigo-100', bar: 'from-indigo-500 to-indigo-300', glow: 'hover:shadow-glow-indigo-lg' },
  amber: { icon: 'bg-amber-50 text-amber-600 ring-amber-100', bar: 'from-amber-400 to-amber-200', glow: 'hover:shadow-glow-amber-lg' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100', bar: 'from-emerald-500 to-emerald-300', glow: 'hover:shadow-glow-emerald-lg' },
  violet: { icon: 'bg-violet-50 text-violet-600 ring-violet-100', bar: 'from-violet-500 to-violet-300', glow: 'hover:shadow-glow-violet-lg' },
  sky: { icon: 'bg-sky-50 text-sky-600 ring-sky-100', bar: 'from-sky-500 to-sky-300', glow: 'hover:shadow-glow-sky-lg' },
  rose: { icon: 'bg-rose-50 text-rose-600 ring-rose-100', bar: 'from-rose-500 to-rose-300', glow: 'hover:shadow-glow-rose-lg' },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  index = 0,
  color = 'brand',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Position within a grid — staggers the entrance animation. */
  index?: number;
  /** Accent for the icon badge. Defaults to the panel's brand green so a stat row reads as one set. */
  color?: Color;
}) {
  const c = COLOR_STYLES[color];

  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className={`card-premium animate-fade-in-up group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 ${c.glow}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.bar} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="flex items-start gap-3.5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-4 transition-transform duration-300 group-hover:scale-110 ${c.icon}`}
        >
          <Icon size={19} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
