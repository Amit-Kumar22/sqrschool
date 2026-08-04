import { BookOpen, CalendarCheck, ClipboardList, LayoutDashboard, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import ComingSoonPanel from '@/components/dashboard/ComingSoonPanel';

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Teacher Dashboard"
        description="Your classes and students at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} icon={BookOpen} label="My Classes" value="—" />
        <StatCard index={1} icon={Users} label="My Students" value="—" />
        <StatCard index={2} icon={ClipboardList} label="Assignments Due" value="—" />
        <StatCard index={3} icon={CalendarCheck} label="Attendance Today" value="—" />
      </div>

      <ComingSoonPanel items={['Gradebook', 'Lesson plans', 'Attendance marking', 'Parent messages']} />
    </div>
  );
}
