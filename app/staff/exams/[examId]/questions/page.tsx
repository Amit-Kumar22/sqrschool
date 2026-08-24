import QuestionsPageContent from '@/components/question/QuestionsPageContent';

export default async function StaffExamQuestionsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return <QuestionsPageContent examId={Number(examId)} />;
}
