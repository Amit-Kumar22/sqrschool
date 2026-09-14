'use client';

/** "20+ Years of Excellence" marker used by the template heroes. Renders nothing until the CMS has an established year. */
export default function YearsBadge({ years }: { years: number | null }) {
  if (!years) return null;

  return (
    <div className="flex flex-col items-center rounded-xl bg-primary px-6 py-4 text-center text-white shadow-glow-primary ring-1 ring-button-bg/50">
      <span className="text-3xl font-bold leading-none text-button-bg">{years}+</span>
      <span className="mt-1 text-[11px] font-semibold uppercase leading-tight tracking-wide">
        Years of
        <br />
        Excellence
      </span>
    </div>
  );
}
