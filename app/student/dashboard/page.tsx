import { CalendarCheck, FileText, LayoutDashboard, ListTodo, Wallet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import ComingSoonPanel from '@/components/dashboard/ComingSoonPanel';

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Student Dashboard"
        description="Your attendance, exams and assignments."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} icon={CalendarCheck} label="Attendance" value="—" />
        <StatCard index={1} icon={FileText} label="Upcoming Exams" value="—" />
        <StatCard index={2} icon={ListTodo} label="Assignments Due" value="—" />
        <StatCard index={3} icon={Wallet} label="Fee Status" value="—" />
      </div>

      <ComingSoonPanel items={['Class timetable', 'Exam results', 'Homework & assignments', 'Fee payment']} />
    </div>
  );
}
