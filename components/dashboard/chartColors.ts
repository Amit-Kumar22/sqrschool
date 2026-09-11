// ─── Dashboard chart color tokens ────────────────────────────────────────────
// Fixed hex mirrors of the site's existing glow-shadow brand colors
// (app/globals.css .shadow-glow-{indigo,amber,emerald,violet,sky,rose}), so
// every chart draws from the same categorical set StatCard already cycles
// through — assigned in this fixed order, never re-picked per render.

export const CATEGORY_COLORS = [
  '#4f63e5', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#0ea5e9', // sky
  '#f43f5e', // rose
] as const;

export function categoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

// Status colors are reserved for state (good/warning/critical/neutral) and
// never reused as "just another category" — used for attendance/fee/leave
// breakdowns where each segment has a fixed real-world meaning.
export const STATUS_COLORS = {
  good: '#10b981', // emerald — present, paid, approved
  warning: '#f59e0b', // amber — late, pending
  critical: '#f43f5e', // rose — absent, overdue, rejected
  neutral: '#8b5cf6', // violet — half-day, partial
} as const;
