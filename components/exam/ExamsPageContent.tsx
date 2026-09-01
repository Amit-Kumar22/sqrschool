'use client';

import { useState } from 'react';
import { BarChart3, ClipboardList, GraduationCap } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import TestsTab from './TestsTab';
import ExamsTab from './ExamsTab';
import ResultsTab from './ResultsTab';

type Tab = 'tests' | 'exams' | 'results';

const TABS = [
  { key: 'tests' as Tab, label: 'Tests', icon: ClipboardList },
  { key: 'exams' as Tab, label: 'Exams', icon: GraduationCap },
  { key: 'results' as Tab, label: 'Results', icon: BarChart3 },
];

/** Tests & Exams — schedules single-subject tests and multi-subject exams for classes, plus bulk result entry. */
export default function ExamsPageContent() {
  const [tab, setTab] = useState<Tab>('tests');

  return (
    <div className="space-y-4">
      <SetPageTitle title="Tests & Exams" />

      <SegmentedTabs tabs={TABS} active={tab} onChange={(key) => setTab(key as Tab)} fullWidth />

      {tab === 'tests' && <TestsTab />}
      {tab === 'exams' && <ExamsTab />}
      {tab === 'results' && <ResultsTab />}
    </div>
  );
}
