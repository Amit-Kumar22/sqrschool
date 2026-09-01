'use client';

import type { LucideIcon } from 'lucide-react';

export interface SegmentedTabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface SegmentedTabsProps {
  tabs: SegmentedTabItem[];
  active: string;
  onChange: (key: string) => void;
  /** Keeps the bar (and each tab, evenly) at full container width on every breakpoint, instead of shrinking to content width from sm up. */
  fullWidth?: boolean;
}

/** Bounded pill-shaped tab switcher — the active tab renders as an inset white card, unlike TabPill's separate-buttons-on-transparent-bg look. */
export default function SegmentedTabs({ tabs, active, onChange, fullWidth = false }: SegmentedTabsProps) {
  return (
    <div className={`inline-flex w-full rounded-2xl bg-amber-50/60 p-1.5 ${fullWidth ? '' : 'sm:w-auto'}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${fullWidth ? '' : 'sm:flex-none'} ${
              isActive ? 'bg-white text-slate-900 shadow-premium-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={15} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
