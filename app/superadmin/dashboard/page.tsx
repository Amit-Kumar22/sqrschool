import { Building2, Palette, ShieldCheck, Users } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import StatCard from '@/components/dashboard/StatCard';
import ComingSoonPanel from '@/components/dashboard/ComingSoonPanel';

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <SetPageTitle title="Super Admin Dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} icon={Users} label="Total Users" value="—" />
        <StatCard index={1} icon={Building2} label="Schools/Branches" value="—" />
        <StatCard index={2} icon={Palette} label="Saved Themes" value="View in Theme Settings" />
        <StatCard index={3} icon={ShieldCheck} label="Active Role Panels" value="5" />
      </div>

      <ComingSoonPanel
        items={['User & role management', 'School/branch management', 'Audit logs', 'System-wide announcements']}
      />
    </div>
  );
}
