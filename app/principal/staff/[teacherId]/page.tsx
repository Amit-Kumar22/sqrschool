import TeacherDetailPageContent from '@/components/staff/TeacherDetailPageContent';

export default async function PrincipalTeacherDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { teacherId } = await params;
  const { tab } = await searchParams;
  return <TeacherDetailPageContent teacherId={Number(teacherId)} initialTab={tab === 'attendance' ? 'attendance' : 'details'} />;
}
