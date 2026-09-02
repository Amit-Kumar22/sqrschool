'use client';

import { useState } from 'react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import TabPill from '@/components/ui/TabPill';
import FeeStructurePageContent from './FeeStructurePageContent';
import CollectFeeTab from './CollectFeeTab';
import ReportsTab from './ReportsTab';
import ConcessionsTab from './ConcessionsTab';

type TopTab = 'structure' | 'collect' | 'reports' | 'concessions';

const TOP_TABS: { key: TopTab; label: string }[] = [
  { key: 'structure', label: 'Fee Structure' },
  { key: 'collect', label: 'Collect Fee' },
  { key: 'reports', label: 'Reports' },
  { key: 'concessions', label: 'Concessions' },
];

const isTopTab = (value?: string): value is TopTab => TOP_TABS.some((t) => t.key === value);

/** Fee Management — class-wise fee structure, collection, reports & concessions. Dashboard is shown as a disabled tab until its API exists. */
export default function FeeManagementPageContent({ initialTab }: { initialTab?: string }) {
  // Lets the Collect Fee detail page's "Back" link (?tab=collect) land back
  // on the tab it was opened from instead of always resetting to Fee Structure.
  const [tab, setTab] = useState<TopTab>(isTopTab(initialTab) ? initialTab : 'structure');

  return (
    <div className="space-y-4">
      <SetPageTitle title="Fee Management" />

      <div className="card-premium flex flex-wrap items-center gap-1 p-1.5">
        <TabPill label="Dashboard" disabled />
        {TOP_TABS.map((t) => (
          <TabPill key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      {tab === 'structure' && <FeeStructurePageContent />}
      {tab === 'collect' && <CollectFeeTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'concessions' && <ConcessionsTab />}
    </div>
  );
}
