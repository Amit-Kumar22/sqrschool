import type { LucideIcon } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  index = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Position within a grid — staggers the entrance animation. */
  index?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className="card-premium animate-fade-in-up group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 transition-transform duration-300 group-hover:scale-110">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
