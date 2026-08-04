import { Sparkles } from 'lucide-react';

export default function ComingSoonPanel({ items }: { items: string[] }) {
  return (
    <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-transparent p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <Sparkles size={15} className="animate-float" />
        </span>
        More on the way
      </div>
      <p className="mt-2 text-sm text-slate-500">
        This panel is ready — these modules will appear here once their APIs are connected.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item, idx) => (
          <li
            key={item}
            style={{ animationDelay: `${idx * 50}ms` }}
            className="animate-fade-in-up rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-premium-sm transition-colors hover:border-indigo-200 hover:text-slate-900"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
