import { CalendarCheck, GraduationCap, Users, UserCog } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import StatCard from '@/components/dashboard/StatCard';
import ComingSoonPanel from '@/components/dashboard/ComingSoonPanel';

export default function PrincipalDashboard() {
  return (
    <div className="space-y-6">
      <SetPageTitle title="Principal Dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} icon={GraduationCap} label="Total Students" value="—" />
        <StatCard index={1} icon={Users} label="Total Teachers" value="—" />
        <StatCard index={2} icon={UserCog} label="Total Staff" value="—" />
        <StatCard index={3} icon={CalendarCheck} label="Attendance Today" value="—" />
      </div>

      <ComingSoonPanel
        items={['Staff performance overview', 'Academic calendar', 'Fee collection summary', 'Attendance reports']}
      />
    </div>
  );
}
