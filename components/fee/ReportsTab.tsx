'use client';

import { useState } from 'react';
import TabPill from '@/components/ui/TabPill';
import DayBookReport from './reports/DayBookReport';
import ClassReport from './reports/ClassReport';
import DefaultersReport from './reports/DefaultersReport';
import StudentLedgerReport from './reports/StudentLedgerReport';

type ReportTab = 'dayBook' | 'classReport' | 'defaulters' | 'ledger';

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'dayBook', label: 'Day Book' },
  { key: 'classReport', label: 'Class Report' },
  { key: 'defaulters', label: 'Defaulters' },
  { key: 'ledger', label: 'Student Ledger' },
];

export default function ReportsTab() {
  const [tab, setTab] = useState<ReportTab>('dayBook');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <TabPill key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      {tab === 'dayBook' && <DayBookReport />}
      {tab === 'classReport' && <ClassReport />}
      {tab === 'defaulters' && <DefaultersReport />}
      {tab === 'ledger' && <StudentLedgerReport />}
    </div>
  );
}
