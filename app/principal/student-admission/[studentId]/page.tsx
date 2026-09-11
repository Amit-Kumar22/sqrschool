import StudentDetailPageContent from '@/components/student-admission/StudentDetailPageContent';

export default async function PrincipalStudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { studentId } = await params;
  const { tab } = await searchParams;
  return <StudentDetailPageContent studentId={Number(studentId)} initialTab={tab === 'attendance' ? 'attendance' : 'details'} />;
}
