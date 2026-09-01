// Subjects are user-defined data, not a fixed enum, so they can't get a
// per-name color map like Badge.tsx's FEE_TYPE_STYLES. Instead each subject
// id is assigned a stable tint by cycling through this palette — same
// subject always renders the same color across pills and grid cells.
const PALETTE = [
  { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
];

export interface SubjectColor {
  bg: string;
  text: string;
  border: string;
}

/** Stable pastel tint for a subject id — same subject always gets the same color. */
export function subjectColor(subjectId: number): SubjectColor {
  return PALETTE[Math.abs(subjectId) % PALETTE.length];
}
