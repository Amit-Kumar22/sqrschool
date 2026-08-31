'use client';

import { useState } from 'react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import TabPill from '@/components/ui/TabPill';
import FeeStructurePageContent from './FeeStructurePageContent';
import CollectFeeTab from './CollectFeeTab';
import ReportsTab from './ReportsTab';

type TopTab = 'structure' | 'collect' | 'reports';

const TOP_TABS: { key: TopTab; label: string }[] = [
  { key: 'structure', label: 'Fee Structure' },
  { key: 'collect', label: 'Collect Fee' },
  { key: 'reports', label: 'Reports' },
];

/** Fee Management — class-wise fee structure, collection & reports. Dashboard and Concessions are shown as disabled tabs until their APIs exist. */
export default function FeeManagementPageContent() {
  const [tab, setTab] = useState<TopTab>('structure');

  return (
    <div className="space-y-4">
      <SetPageTitle title="Fee Management" />

      <div className="card-premium flex flex-wrap items-center gap-1 p-1.5">
        <TabPill label="Dashboard" disabled />
        {TOP_TABS.map((t) => (
          <TabPill key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
        <TabPill label="Concessions" disabled />
      </div>

      {tab === 'structure' && <FeeStructurePageContent />}
      {tab === 'collect' && <CollectFeeTab />}
      {tab === 'reports' && <ReportsTab />}
    </div>
  );
}
