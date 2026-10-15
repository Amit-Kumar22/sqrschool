'use client';

import { useState } from 'react';
import { Banknote, Bus, Fuel, HardHat, LayoutDashboard, Route as RouteIcon, ShieldAlert, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import TransportDashboardContent, { type TransportSection } from './TransportDashboardContent';
import VehiclesTab from './VehiclesTab';
import RoutesTab from './RoutesTab';
import StaffTab from './StaffTab';
import ExpensesTab from './ExpensesTab';
import SalariesTab from './SalariesTab';
import FeesTab from './FeesTab';
import ComplianceTab from './ComplianceTab';

type HubTab = 'overview' | TransportSection;

const TABS: { key: HubTab; label: string; icon: LucideIcon }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'vehicles', label: 'Vehicles', icon: Bus },
  { key: 'routes', label: 'Routes & Students', icon: RouteIcon },
  { key: 'staff', label: 'Staff', icon: HardHat },
  { key: 'expenses', label: 'Expenses', icon: Fuel },
  { key: 'salaries', label: 'Salaries', icon: Wallet },
  { key: 'fees', label: 'Fees', icon: Banknote },
  { key: 'compliance', label: 'Compliance', icon: ShieldAlert },
];

const isHubTab = (v?: string): v is HubTab => TABS.some((t) => t.key === v);

/** Principal's single Transport page — the whole module behind one tab bar (?tab= deep-links a tab). */
export default function TransportHubContent({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<HubTab>(isHubTab(initialTab) ? initialTab : 'overview');

  const select = (next: HubTab) => {
    setTab(next);
    // Keep the URL in step so refresh / Back from Collect Fee lands on the same tab.
    window.history.replaceState(null, '', next === 'overview' ? window.location.pathname : `?tab=${next}`);
  };

  return (
    <div className="space-y-4">
      <SetPageTitle title="Transport" />

      <div className="card-premium scrollbar-thin flex items-center gap-1 overflow-x-auto p-1.5">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => select(key)}
              aria-current={active}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium whitespace-nowrap transition-all ${
                active ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <TransportDashboardContent onOpen={select} />}
      {tab === 'vehicles' && <VehiclesTab />}
      {tab === 'routes' && <RoutesTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'expenses' && <ExpensesTab />}
      {tab === 'salaries' && <SalariesTab />}
      {tab === 'fees' && <FeesTab collectHref={(id) => `/principal/fee-structure/collect/${id}`} />}
      {tab === 'compliance' && <ComplianceTab />}
    </div>
  );
}
