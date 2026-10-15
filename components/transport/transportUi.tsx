import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

// ─── Shared helpers for every transport screen ───────────────────────────────

/** ₹ with Indian thousands separators. */
export const formatMoney = (value: number | null | undefined): string =>
  `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** "yyyy-mm-dd" -> "17 Sep 2026". */
export const formatDate = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** "yyyy-mm-dd" -> "September 2026". */
export const formatMonth = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—';

/** Today as "yyyy-mm-dd" in local time. */
export const todayInput = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** First day of the current month as "yyyy-mm-dd". */
export const monthStartInput = (): string => `${todayInput().slice(0, 7)}-01`;

/** "yyyy-mm" from a month input -> "yyyy-mm-01". */
export const monthInputToDate = (value: string): string => (value ? `${value}-01` : '');

/** Whole days from today until a "yyyy-mm-dd" date (negative once past). */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

/** "AUTO_RICKSHAW" -> "Auto Rickshaw". */
export const enumLabel = (value: string | null | undefined): string =>
  value
    ? value
        .toLowerCase()
        .split('_')
        .map((w) => (w === 'puc' ? 'PUC' : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ')
    : '—';

/** Default academic year label for the current date, e.g. "2026-27" (sessions start in April). */
export function currentAcademicYear(): string {
  const now = new Date();
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

// ─── Badges ──────────────────────────────────────────────────────────────────

const TONES = {
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
} as const;

export type Tone = keyof typeof TONES;

export function Pill({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${TONES[tone]}`}>
      {children}
    </span>
  );
}

const ENUM_TONES: Record<string, Tone> = {
  // vehicle types
  BUS: 'indigo',
  MINI_BUS: 'sky',
  TRAVELLER: 'violet',
  VAN: 'amber',
  AUTO_RICKSHAW: 'emerald',
  CAR: 'slate',
  // employment
  ACTIVE: 'emerald',
  ON_LEAVE: 'amber',
  SUSPENDED: 'red',
  RELIEVED: 'slate',
  // salary
  DRAFT: 'slate',
  GENERATED: 'sky',
  PENDING: 'amber',
  APPROVED: 'violet',
  PAID: 'emerald',
  CANCELLED: 'red',
  // fee
  PARTIAL: 'amber',
  OVERDUE: 'red',
  // expense
  FUEL: 'amber',
  SERVICING: 'sky',
  REPAIR: 'red',
  SPARE_PARTS: 'violet',
  INSURANCE: 'indigo',
  PERMIT_RENEWAL: 'indigo',
  PUC: 'emerald',
  TYRE: 'slate',
  FASTAG_TOLL: 'sky',
  // designations
  BUS_DRIVER: 'indigo',
  TRAVELLER_DRIVER: 'violet',
  VAN_DRIVER: 'sky',
  CONDUCTOR: 'amber',
  TRANSPORT_IN_CHARGE: 'emerald',
  HELPER: 'slate',
};

/** Tinted pill for any transport enum value — unknown values render neutral rather than erroring. */
export function EnumBadge({ value }: { value: string | null | undefined }) {
  return <Pill tone={(value && ENUM_TONES[value]) || 'slate'}>{enumLabel(value)}</Pill>;
}

/** Expiry date plus a coloured "N days left / expired" chip. */
export function ExpiryCell({ date, alertDays = 30 }: { date: string | null | undefined; alertDays?: number }) {
  const days = daysUntil(date);
  if (days === null) return <span className="text-xs text-slate-400">Not set</span>;
  const tone: Tone = days < 0 ? 'red' : days <= alertDays ? 'amber' : 'emerald';
  return (
    <div className="flex flex-col gap-1">
      <span className="whitespace-nowrap text-xs text-slate-600">{formatDate(date)}</span>
      <ExpiryChip days={days} tone={tone} />
    </div>
  );
}

export function ExpiryChip({ days, tone }: { days: number; tone?: Tone }) {
  const t: Tone = tone ?? (days < 0 ? 'red' : days <= 30 ? 'amber' : 'emerald');
  const Icon = t === 'red' ? AlertTriangle : t === 'amber' ? Clock : CheckCircle2;
  const label = days < 0 ? `Expired ${Math.abs(days)}d ago` : days === 0 ? 'Expires today' : `${days}d left`;
  return (
    <Pill tone={t}>
      <Icon size={11} />
      {label}
    </Pill>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>;
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</div>;
}

/** Small uppercase heading that splits long forms into sections. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3.5">
      <legend className="mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Card-shaped filter row that sits between a page header and its table. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="card-premium flex flex-wrap items-end gap-3 px-4 py-3.5">{children}</div>;
}

/** Compact KPI tile for the top of a tab — lighter than the dashboard StatCard. */
export function MiniStat({ label, value, tone = 'slate', hint }: { label: string; value: string; tone?: Tone; hint?: string }) {
  const accent: Record<Tone, string> = {
    slate: 'text-slate-900',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    sky: 'text-sky-700',
    indigo: 'text-indigo-700',
    violet: 'text-violet-700',
  };
  return (
    <div className="card-premium animate-fade-in-up px-4 py-3">
      <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{label}</p>
      <p className={`mt-1 text-xl font-bold tracking-tight tabular-nums ${accent[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
