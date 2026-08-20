import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white shadow-glow-indigo hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-glow-indigo-lg',
  secondary: 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white shadow-premium-sm hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-premium',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-1.5',
};

/** Labeled action button — icon + text, used for primary/secondary CTAs (e.g. "Add class", form Save/Cancel). */
export default function Button({
  icon: Icon,
  loading = false,
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 disabled:shadow-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className ?? ''}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 13 : 15} />
      ) : null}
      {children}
    </button>
  );
}

type IconVariant = 'default' | 'primary' | 'danger' | 'inverse';
type IconSize = 'sm' | 'md';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Used as both the tooltip (title) and the accessible name — icon-only buttons need it. */
  label: string;
  variant?: IconVariant;
  size?: IconSize;
  loading?: boolean;
}

const ICON_VARIANT_CLASSES: Record<IconVariant, string> = {
  default: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
  primary: 'text-indigo-600 hover:bg-indigo-50',
  danger: 'text-red-500 hover:bg-red-50',
  inverse: 'text-slate-300 hover:bg-white/10 hover:text-white',
};

const ICON_SIZE_CLASSES: Record<IconSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
};

/** Icon-only action button (edit/delete/close/view etc). Always carries a tooltip + aria-label via `label`. */
export function IconButton({
  icon: Icon,
  label,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg transition-all duration-150 active:scale-90 disabled:cursor-not-allowed disabled:pointer-events-none disabled:scale-100 disabled:opacity-30 ${ICON_VARIANT_CLASSES[variant]} ${ICON_SIZE_CLASSES[size]} ${className ?? ''}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />
      ) : (
        <Icon size={size === 'sm' ? 14 : 16} />
      )}
    </button>
  );
}
