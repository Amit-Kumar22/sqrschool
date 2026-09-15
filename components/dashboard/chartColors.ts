// ─── Dashboard chart color tokens ────────────────────────────────────────────
// Fixed categorical set led by the panel's brand green (app/globals.css
// --color-brand-500), then hues distinct enough from it and from each other
// to tell series apart — assigned in this fixed order, never re-picked per render.

export const CATEGORY_COLORS = [
  '#1faa62', // brand green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#0ea5e9', // sky
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
