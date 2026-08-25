'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, FileQuestion, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteQuestion,
  getExam,
  getQuestionsBySubject,
  getQuestionsBySubjectAndType,
  type Exam,
  type Question,
  type QuestionType,
} from '@/lib/examService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { DifficultyBadge, QuestionTypeBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import QuestionFormModal from '@/components/question/QuestionFormModal';

const TYPE_FILTERS: { value: QuestionType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
];

/** Question bank management for one exam — reached via the "Manage questions" action on the Exams table. */
export default function QuestionsPageContent({ examId }: { examId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/principal') ? '/principal' : '/staff';

  const [exam, setExam] = useState<Exam | null>(null);
  const [examLoading, setExamLoading] = useState(true);
  const [examError, setExamError] = useState('');

  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Question | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setExamLoading(true);
    setExamError('');
    getExam(examId)
      .then(setExam)
      .catch((err) => setExamError(apiErrorMessage(err, 'Could not load this exam.')))
      .finally(() => setExamLoading(false));
  }, [examId]);

  const loadQuestions = async () => {
    if (!exam) return;
    setLoading(true);
    setError('');
    try {
      const result = typeFilter
        ? await getQuestionsBySubjectAndType({ subjectId: exam.subjectId, type: typeFilter })
        : await getQuestionsBySubject({ subjectId: exam.subjectId });
      setQuestions(result.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load questions from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, typeFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: Question) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that question.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadQuestions();
  };

  const columns: DataTableColumn<Question>[] = [
    {
      key: 'questionText',
      header: 'Question',
      sortable: true,
      accessor: (item) => item.questionText,
      render: (item) => <p className="line-clamp-2 max-w-md font-medium text-slate-900">{item.questionText}</p>,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      accessor: (item) => item.type,
      render: (item) => <QuestionTypeBadge type={item.type} />,
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      sortable: true,
      accessor: (item) => item.difficulty,
      render: (item) => <DifficultyBadge difficulty={item.difficulty} />,
    },
    {
      key: 'marks',
      header: 'Marks',
      sortable: true,
      accessor: (item) => item.marks,
      render: (item) => <span className="font-medium text-slate-700">{item.marks}</span>,
    },
    {
      key: 'answer',
      header: 'Answer',
      render: (item) => {
        const correct = item.options.find((o) => o.correct);
        return correct ? (
          <span className="text-slate-600">{correct.optionText}</span>
        ) : item.modelAnswer ? (
          <span className="line-clamp-1 max-w-xs text-slate-500">{item.modelAnswer}</span>
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-20',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
          />
        </div>
      ),
    },
  ];

  if (examError) {
    return (
      <div className="space-y-4">
        <IconButton icon={ArrowLeft} label="Back to exams" variant="default" onClick={() => router.push(`${basePath}/exams`)} />
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{examError}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconButton icon={ArrowLeft} label="Back to exams" variant="default" onClick={() => router.push(`${basePath}/exams`)} />
        <div className="min-w-0 flex-1">
          <PageHeader
            icon={FileQuestion}
            title={examLoading ? 'Loading exam…' : `Questions · ${exam?.name ?? ''}`}
            description={exam ? `${exam.schoolClassName} · ${exam.subjectName}` : undefined}
            actions={
              <Button icon={Plus} onClick={openCreateModal} disabled={!exam}>
                Add question
              </Button>
            }
          />
        </div>
      </div>

      <div className="max-w-xs">
        <SelectField label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as QuestionType | '')}>
          {TYPE_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </SelectField>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={questions}
        rowKey={(item) => item.id}
        loading={loading || examLoading}
        emptyTitle="No questions yet"
        emptyDescription="Add the first question for this subject."
      />

      {formModalOpen && exam && (
        <QuestionFormModal
          item={editingItem}
          examId={exam.id}
          subjectId={exam.subjectId}
          subjectName={exam.subjectName}
          nextOrder={questions.length + 1}
          onClose={() => {
            setFormModalOpen(false);
            setEditingItem(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
