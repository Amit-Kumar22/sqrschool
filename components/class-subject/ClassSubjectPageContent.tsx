'use client';

import { useState } from 'react';
import { BookOpen, Link2, LayoutGrid } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import SubjectsTab from './SubjectsTab';
import AssignSubjectsTab from './AssignSubjectsTab';
import SummaryTab from './SummaryTab';

type Tab = 'subjects' | 'assign' | 'summary';

const TABS = [
  { key: 'subjects' as Tab, label: 'Subjects', icon: BookOpen },
  { key: 'assign' as Tab, label: 'Assign Subjects', icon: Link2 },
  { key: 'summary' as Tab, label: 'Summary', icon: LayoutGrid },
];

/** Subject & Class — subject catalog, per-class assignment, and a read-only assignment matrix, as three tabs of one page. */
export default function ClassSubjectPageContent() {
  const [tab, setTab] = useState<Tab>('subjects');

  return (
    <div className="space-y-4">
      <SetPageTitle title="Subject & Class" />

      <SegmentedTabs tabs={TABS} active={tab} onChange={(key) => setTab(key as Tab)} />

      {tab === 'subjects' && <SubjectsTab />}
      {tab === 'assign' && <AssignSubjectsTab />}
      {tab === 'summary' && <SummaryTab />}
    </div>
  );
}
