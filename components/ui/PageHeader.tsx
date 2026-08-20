import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Shared header for dashboard/admin pages — icon badge, title, description and action slot. Fixed indigo chrome, not theme-bound (see Sidebar.tsx). */
export default function PageHeader({ icon: Icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="card-premium animate-fade-in-up relative flex flex-wrap items-center justify-between gap-3 overflow-hidden px-4 py-3">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-400 to-amber-400" />
      <span className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-400/15 to-amber-400/10 blur-2xl" />

      <div className="relative flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-glow-indigo">
            <Icon size={17} />
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
