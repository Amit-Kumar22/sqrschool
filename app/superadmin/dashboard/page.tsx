import { Building2, LayoutDashboard, Palette, ShieldCheck, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import ComingSoonPanel from '@/components/dashboard/ComingSoonPanel';

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Super Admin Dashboard"
        description="Manage school-wide theming and oversee every panel from one place."
      />

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
