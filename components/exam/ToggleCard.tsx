'use client';

import { Check } from 'lucide-react';

interface ToggleCardProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}

/** Subject-picker card for the Create Exam form's "Select Subjects" grid. */
export default function ToggleCard({ label, sublabel, selected, onClick }: ToggleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
        selected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        {sublabel && <span className="block text-xs text-slate-400">{sublabel}</span>}
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300 bg-white'
        }`}
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}
