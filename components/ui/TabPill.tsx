'use client';

interface TabPillProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/** Rounded pill tab button — used for the Fee Management page's top-level and report sub-tabs. */
export default function TabPill({ label, active = false, disabled = false, onClick }: TabPillProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? 'Coming soon' : undefined}
      className={`h-8 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white shadow-glow-indigo'
          : disabled
            ? 'cursor-not-allowed text-slate-300'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {label}
    </button>
  );
}
