import TeacherAttendanceCalendarPageContent from '@/components/attendance/TeacherAttendanceCalendarPageContent';

export default async function PrincipalTeacherAttendanceHistoryPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params;
  return <TeacherAttendanceCalendarPageContent teacherId={Number(teacherId)} />;
}
