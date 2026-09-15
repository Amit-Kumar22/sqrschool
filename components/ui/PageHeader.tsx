import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Shared header for dashboard/admin pages — icon badge, title, description and action slot. Fixed brand-green chrome, not theme-bound (see Sidebar.tsx). */
export default function PageHeader({ icon: Icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="card-premium animate-fade-in-up relative flex flex-wrap items-center justify-between gap-3 overflow-hidden px-4 py-3.5">
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-400 to-brand-600" />
      <span className="pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-brand-400/10 blur-2xl" />

      <div className="relative flex items-center gap-3">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{title}</h1>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="relative flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
