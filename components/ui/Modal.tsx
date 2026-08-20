import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from './Button';

type Accent = 'indigo' | 'amber' | 'emerald' | 'rose';

const ACCENT_BAR: Record<Accent, string> = {
  indigo: 'from-indigo-500 via-violet-400 to-indigo-500',
  amber: 'from-amber-400 via-orange-400 to-amber-400',
  emerald: 'from-emerald-500 via-teal-400 to-emerald-500',
  rose: 'from-rose-500 via-red-400 to-rose-500',
};

const ACCENT_BADGE: Record<Accent, string> = {
  indigo: 'from-indigo-600 to-indigo-700',
  amber: 'from-amber-400 to-amber-600',
  emerald: 'from-emerald-500 to-emerald-700',
  rose: 'from-rose-500 to-rose-700',
};

type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

interface ModalProps {
  icon?: LucideIcon;
  title: ReactNode;
  subtitle?: string;
  /** Small status/role pill shown inline next to the title (e.g. StatusBadge, RoleBadge). */
  badge?: ReactNode;
  accent?: Accent;
  size?: Size;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Shared modal shell for the admin panel — colorful top accent, icon badge,
 * icon-only close button, scrollable body (so long forms never overflow the
 * viewport) and an optional sticky footer for actions.
 */
export default function Modal({ icon: Icon, title, subtitle, badge, accent = 'indigo', size = 'md', onClose, footer, children }: ModalProps) {
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className={`animate-scale-in relative w-full ${SIZE_CLASSES[size]} overflow-hidden rounded-2xl bg-white shadow-premium-lg`}>
        <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${ACCENT_BAR[accent]}`} />

        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pt-6 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span
                className={`animate-pop-in flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-premium-sm ${ACCENT_BADGE[accent]}`}
              >
                <Icon size={18} />
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
                {badge}
              </div>
              {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        <div className="scrollbar-thin max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}
