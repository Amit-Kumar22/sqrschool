import QuestionsPageContent from '@/components/question/QuestionsPageContent';

export default async function PrincipalExamQuestionsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return <QuestionsPageContent examId={Number(examId)} />;
}
