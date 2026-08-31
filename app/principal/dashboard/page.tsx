import { Bell, ClipboardCheck, UserCheck, Wallet } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import StatCard from '@/components/dashboard/StatCard';
import ComingSoonPanel from '@/components/dashboard/ComingSoonPanel';

export default function StaffDashboard() {
  return (
    <div className="space-y-6">
      <SetPageTitle title="Principal Dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} icon={ClipboardCheck} label="Pending Tasks" value="—" />
        <StatCard index={1} icon={Bell} label="Notices" value="—" />
        <StatCard index={2} icon={UserCheck} label="Visitors Today" value="—" />
        <StatCard index={3} icon={Wallet} label="Fee Collections" value="—" />
      </div>

      <ComingSoonPanel items={['Visitor log', 'Fee collection', 'Inventory management', 'Notice board']} />
    </div>
  );
}
