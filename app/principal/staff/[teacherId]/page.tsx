import TeacherDetailPageContent from '@/components/staff/TeacherDetailPageContent';

export default async function PrincipalTeacherDetailPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params;
  return <TeacherDetailPageContent teacherId={Number(teacherId)} />;
}
