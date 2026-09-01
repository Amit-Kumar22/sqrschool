'use client';

import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

/** Compact horizontally-scrollable tab bar — used to switch between record types on a single settings page. */
export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-slate-200 px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-current={isActive}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? 'border-amber-700 text-amber-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
