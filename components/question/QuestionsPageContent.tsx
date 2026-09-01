'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
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
import SetPageTitle from '@/components/dashboard/SetPageTitle';
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

/**
 * Question bank management for one exam+subject pair — reached from the
 * "Manage Questions" action on the Exams table. A multi-subject Exam has no
 * single subject of its own, so when the caller doesn't pin one via
 * subjectId/subjectName (the row-level action doesn't — an exam can have
 * several), this shows a subject picker built from the exam's own subjects
 * list before loading any questions.
 */
export default function QuestionsPageContent({
  examId,
  subjectId,
  subjectName,
}: {
  examId: number;
  subjectId?: number;
  subjectName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/principal-2') ? '/principal-2' : pathname.startsWith('/staff') ? '/staff' : '/principal';

  const [exam, setExam] = useState<Exam | null>(null);
  const [examLoading, setExamLoading] = useState(true);
  const [examError, setExamError] = useState('');

  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(subjectId && subjectId > 0 ? subjectId : null);
  const [activeSubjectName, setActiveSubjectName] = useState(subjectName ?? '');

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
    if (!activeSubjectId) return;
    setLoading(true);
    setError('');
    try {
      const result = typeFilter
        ? await getQuestionsBySubjectAndType({ subjectId: activeSubjectId, type: typeFilter })
        : await getQuestionsBySubject({ subjectId: activeSubjectId });
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
  }, [activeSubjectId, typeFilter]);

  const chooseSubject = (id: number, name: string) => {
    setActiveSubjectId(id);
    setActiveSubjectName(name);
  };

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
        const correct = item.options?.find((o) => o.correct);
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

  const pageTitle = examLoading ? 'Loading exam…' : `Questions · ${exam?.title ?? ''}${activeSubjectName ? ` · ${activeSubjectName}` : ''}`;

  if (examError) {
    return (
      <div className="space-y-4">
        <SetPageTitle title="Questions" />
        <IconButton icon={ArrowLeft} label="Back to exams" variant="default" onClick={() => router.push(`${basePath}/exams`)} />
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{examError}</div>
      </div>
    );
  }

  if (!examLoading && !activeSubjectId) {
    return (
      <div className="space-y-4">
        <SetPageTitle title="Questions" />
        <IconButton icon={ArrowLeft} label="Back to exams" variant="default" onClick={() => router.push(`${basePath}/exams`)} />

        <div className="card-premium p-4">
          <h2 className="text-sm font-semibold text-slate-900">{exam?.title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">Choose a subject to manage its questions.</p>

          {exam && exam.subjects.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">This exam has no subjects yet — add one from the Exams tab first.</p>
          ) : (
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {exam?.subjects.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => chooseSubject(sub.subjectId, sub.subjectName)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50/40"
                >
                  <BookOpen size={15} className="shrink-0 text-amber-500" />
                  <span className="truncate text-sm font-semibold text-slate-900">{sub.subjectName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SetPageTitle title={pageTitle} />

      <div className="flex items-center gap-2">
        <IconButton icon={ArrowLeft} label="Back to exams" variant="default" onClick={() => router.push(`${basePath}/exams`)} />
        {exam && exam.subjects.length > 1 && (
          <button
            type="button"
            onClick={() => setActiveSubjectId(null)}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft size={13} /> Change subject
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="max-w-xs">
          <SelectField label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as QuestionType | '')}>
            {TYPE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>
        </div>

        <Button icon={Plus} onClick={openCreateModal}>
          Add question
        </Button>
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

      {formModalOpen && activeSubjectId && (
        <QuestionFormModal
          item={editingItem}
          examId={examId}
          subjectId={activeSubjectId}
          subjectName={activeSubjectName}
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
