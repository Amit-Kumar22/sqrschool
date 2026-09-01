'use client';

import { useState } from 'react';
import { ClipboardList, GraduationCap } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import TestsTab from './TestsTab';
import ExamsTab from './ExamsTab';

type Tab = 'tests' | 'exams';

const TABS = [
  { key: 'tests' as Tab, label: 'Tests', icon: ClipboardList },
  { key: 'exams' as Tab, label: 'Exams', icon: GraduationCap },
];

/** Tests & Exams — schedules single-subject tests and multi-subject exams for classes. */
export default function ExamsPageContent() {
  const [tab, setTab] = useState<Tab>('tests');

  return (
    <div className="space-y-4">
      <SetPageTitle title="Tests & Exams" />

      <SegmentedTabs tabs={TABS} active={tab} onChange={(key) => setTab(key as Tab)} />

      {tab === 'tests' && <TestsTab />}
      {tab === 'exams' && <ExamsTab />}
    </div>
  );
}
