import type { LucideIcon } from 'lucide-react';

type Color = 'indigo' | 'amber' | 'emerald' | 'violet' | 'sky' | 'rose';

const COLOR_STYLES: Record<Color, { badge: string; bar: string; glow: string }> = {
  indigo: { badge: 'from-indigo-500 to-indigo-700', bar: 'from-indigo-500 to-indigo-300', glow: 'hover:shadow-glow-indigo-lg' },
  amber: { badge: 'from-amber-400 to-amber-600', bar: 'from-amber-400 to-amber-200', glow: 'hover:shadow-glow-amber-lg' },
  emerald: { badge: 'from-emerald-500 to-emerald-700', bar: 'from-emerald-500 to-emerald-300', glow: 'hover:shadow-glow-emerald-lg' },
  violet: { badge: 'from-violet-500 to-violet-700', bar: 'from-violet-500 to-violet-300', glow: 'hover:shadow-glow-violet-lg' },
  sky: { badge: 'from-sky-500 to-sky-700', bar: 'from-sky-500 to-sky-300', glow: 'hover:shadow-glow-sky-lg' },
  rose: { badge: 'from-rose-500 to-rose-700', bar: 'from-rose-500 to-rose-300', glow: 'hover:shadow-glow-rose-lg' },
};

const CYCLE: Color[] = ['indigo', 'amber', 'emerald', 'violet', 'sky', 'rose'];

export default function StatCard({
  icon: Icon,
  label,
  value,
  index = 0,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Position within a grid — staggers the entrance animation and picks the default accent color. */
  index?: number;
  /** Overrides the auto-cycled accent color for this card. */
  color?: Color;
}) {
  const c = COLOR_STYLES[color ?? CYCLE[index % CYCLE.length]];

  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className={`card-premium animate-fade-in-up group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 ${c.glow}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.bar} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-premium-sm transition-transform duration-300 group-hover:scale-110 ${c.badge}`}
        >
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
