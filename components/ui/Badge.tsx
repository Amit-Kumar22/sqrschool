interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

/** Small status pill — green dot for active/default records, muted grey otherwise. */
export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-500 ring-slate-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

/** Small neutral pill for labeling a record's role (staff, student, etc). */
export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
      {role}
    </span>
  );
}

// Colors for the school-leads pipeline. The backend enum isn't fully
// documented (only "NEW" is confirmed) — unrecognized values fall back to a
// neutral slate pill instead of breaking, so a status added on the backend
// later just renders untinted rather than erroring.
const LEAD_STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  CONTACTED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  FOLLOW_UP: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  INTERESTED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  NEGOTIATION: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  CONVERTED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  WON: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  LOST: 'bg-red-50 text-red-700 ring-red-600/20',
  NOT_INTERESTED: 'bg-red-50 text-red-700 ring-red-600/20',
  ON_HOLD: 'bg-slate-100 text-slate-600 ring-slate-200',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-200',
};

/** Pill for a school lead's pipeline status — tinted by known stage, neutral for anything else. */
export function LeadStatusBadge({ status }: { status: string }) {
  const style = LEAD_STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
  const label = status
    ? status
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unknown';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}

// Only "DRAFT" is confirmed by the exam API spec — unrecognized values fall
// back to a neutral slate pill instead of breaking, same approach as
// LEAD_STATUS_STYLES above.
const EXAM_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-200',
  PUBLISHED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  ONGOING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
};

/** Pill for an exam's lifecycle status — tinted by known stage, neutral for anything else. */
export function ExamStatusBadge({ status }: { status: string }) {
  const style = EXAM_STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
  const label = status
    ? status
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unknown';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}
