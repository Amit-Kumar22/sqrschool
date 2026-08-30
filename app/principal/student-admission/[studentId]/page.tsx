import StudentDetailPageContent from '@/components/student-admission/StudentDetailPageContent';

export default async function PrincipalStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <StudentDetailPageContent studentId={Number(studentId)} />;
}
