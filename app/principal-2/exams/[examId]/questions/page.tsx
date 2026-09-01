import QuestionsPageContent from '@/components/question/QuestionsPageContent';

export default async function PrincipalExamQuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ subjectId?: string; subjectName?: string }>;
}) {
  const { examId } = await params;
  const { subjectId, subjectName } = await searchParams;
  return (
    <QuestionsPageContent
      examId={Number(examId)}
      subjectId={subjectId ? Number(subjectId) : undefined}
      subjectName={subjectName ? decodeURIComponent(subjectName) : undefined}
    />
  );
}
