'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSubjects, type Subject } from '@/lib/subjectService';
import { createTest, deleteTest, getTests, updateTest, type Test, type TestPayload } from '@/lib/testExamService';
import { EXAM_STATUS_OPTIONS, type ExamStatus } from '@/lib/examService';
import { fromDateInput, toDateInput } from '@/lib/dateUtils';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';

interface TestFormState {
  titleName: string;
  schoolClassId: number | '';
  subjectId: number | '';
  startDate: string;
  totalMarks: number | '';
  passingMarks: number | '';
  durationMinutes: number | '';
  status: ExamStatus;
  description: string;
}

const BLANK_FORM: TestFormState = {
  titleName: '',
  schoolClassId: '',
  subjectId: '',
  startDate: '',
  totalMarks: '',
  passingMarks: '',
  durationMinutes: '',
  status: 'DRAFT',
  description: '',
};

const formatStatusLabel = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function TestStatusPill({ upcoming }: { upcoming: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        upcoming ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      }`}
    >
      {upcoming ? 'upcoming' : 'completed'}
    </span>
  );
}

export default function TestsTab() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const [filterClassId, setFilterClassId] = useState<number | ''>('');
  const [filterSubjectId, setFilterSubjectId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<ExamStatus | ''>('');

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<TestFormState>(BLANK_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([getClasses(), getSubjects()]);
        if (cancelled) return;
        setClasses(classesRes.content ?? []);
        setSubjects(subjectsRes.content ?? []);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load classes/subjects.'));
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTests = async () => {
    setLoading(true);
    setError('');
    try {
      const content = (
        await getTests({ classId: filterClassId || undefined, subjectId: filterSubjectId || undefined, status: filterStatus || undefined })
      ).content;
      setTests(content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load tests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (metaLoading) return;
    loadTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaLoading, filterClassId, filterSubjectId, filterStatus]);

  const setField = <K extends keyof TestFormState>(key: K, value: TestFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm(BLANK_FORM);
    setEditingId(null);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (test: Test) => {
    setForm({
      titleName: test.titleName,
      schoolClassId: test.schoolClassId,
      subjectId: test.subjectId,
      startDate: toDateInput(test.startDate),
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      durationMinutes: test.durationMinutes,
      status: test.status,
      description: test.description ?? '',
    });
    setEditingId(test.id);
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !form.titleName.trim() ||
      !form.schoolClassId ||
      !form.subjectId ||
      !form.startDate ||
      !form.totalMarks ||
      !form.passingMarks ||
      !form.durationMinutes
    ) {
      setFormError('Please fill in class, subject, title, date, total marks, passing marks and duration.');
      return;
    }

    const isEditing = editingId !== null;
    const payload: TestPayload = {
      titleName: form.titleName.trim(),
      schoolClassId: Number(form.schoolClassId),
      subjectId: Number(form.subjectId),
      durationMinutes: Number(form.durationMinutes),
      totalMarks: Number(form.totalMarks),
      passingMarks: Number(form.passingMarks),
      startDate: fromDateInput(form.startDate),
      status: form.status,
      description: form.description,
    };

    setSaving(true);
    setFormError('');
    try {
      if (isEditing) await updateTest(editingId!, payload);
      else await createTest(payload);
      setFormOpen(false);
      await loadTests();
    } catch (err) {
      setFormError(apiErrorMessage(err, `Could not ${isEditing ? 'update' : 'create'} that test.`));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this test? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteTest(id);
      setTests((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that test.'));
    } finally {
      setDeletingId(null);
    }
  };

  const isEditing = editingId !== null;

  const columns: DataTableColumn<Test>[] = [
    {
      key: 'titleName',
      header: 'Title',
      sortable: true,
      accessor: (test) => test.titleName,
      render: (test) => <p className="max-w-52 truncate font-semibold text-slate-900">{test.titleName}</p>,
    },
    {
      key: 'subjectName',
      header: 'Subject',
      sortable: true,
      accessor: (test) => test.subjectName,
      render: (test) => (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
          {test.subjectName}
        </span>
      ),
    },
    {
      key: 'schoolClassName',
      header: 'Class',
      sortable: true,
      accessor: (test) => test.schoolClassName,
      render: (test) => <span className="text-slate-700">{test.schoolClassName}</span>,
    },
    {
      key: 'startDate',
      header: 'Date',
      sortable: true,
      accessor: (test) => test.startDate,
      render: (test) => <span className="text-slate-600">{new Date(test.startDate).toLocaleDateString()}</span>,
    },
    {
      key: 'totalMarks',
      header: 'Marks',
      sortable: true,
      accessor: (test) => test.totalMarks,
      render: (test) => <span className="text-slate-600">{test.totalMarks}</span>,
    },
    {
      key: 'durationMinutes',
      header: 'Duration',
      sortable: true,
      accessor: (test) => test.durationMinutes,
      render: (test) => <span className="text-slate-600">{test.durationMinutes} min</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (test) => <TestStatusPill upcoming={new Date(test.startDate) >= startOfToday()} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-20',
      render: (test) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton icon={Pencil} label="Edit" variant="primary" onClick={() => openEdit(test)} />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === test.id}
            onClick={() => handleDelete(test.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900">All Tests</h2>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{tests.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value ? Number(e.target.value) : '')}
            className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
          >
            <option value="">All classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.className}
              </option>
            ))}
          </select>
          <select
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value ? Number(e.target.value) : '')}
            className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subjectName}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ExamStatus | '')}
            className="h-9 w-32 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
          >
            <option value="">All statuses</option>
            {EXAM_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
          <Button icon={Plus} size="sm" onClick={openCreate} disabled={metaLoading}>
            Create Test
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tests}
        rowKey={(test) => test.id}
        loading={loading || metaLoading}
        emptyTitle="No tests yet"
        emptyDescription="Create the first test to get started."
      />

      {formOpen && (
        <Modal
          icon={Plus}
          title={isEditing ? 'Edit Test' : 'Create Test'}
          subtitle="Single-subject unit test for one class."
          size="lg"
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="test-form" icon={Plus} loading={saving}>
                {isEditing ? 'Save changes' : 'Create Test'}
              </Button>
            </>
          }
        >
          <form id="test-form" onSubmit={handleSubmit} className="grid gap-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <SelectField
                label="Class"
                required
                disabled={metaLoading}
                value={form.schoolClassId}
                onChange={(e) => setField('schoolClassId', e.target.value ? Number(e.target.value) : '')}
              >
                <option value="" disabled>
                  Select class…
                </option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Subject"
                required
                disabled={metaLoading || !form.schoolClassId}
                value={form.subjectId}
                onChange={(e) => setField('subjectId', e.target.value ? Number(e.target.value) : '')}
              >
                <option value="" disabled>
                  {form.schoolClassId ? 'Select subject…' : 'Select class first'}
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subjectName}
                  </option>
                ))}
              </SelectField>
            </div>

            <TextField
              label="Title"
              required
              placeholder="e.g. Unit Test 1 — Algebra"
              value={form.titleName}
              onChange={(e) => setField('titleName', e.target.value)}
            />

            <div className="grid gap-3.5 sm:grid-cols-2">
              <TextField label="Date" type="date" required value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
              <SelectField label="Status" required value={form.status} onChange={(e) => setField('status', e.target.value as ExamStatus)}>
                {EXAM_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status)}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <TextField
                label="Total Marks"
                type="number"
                min={0.01}
                step={0.01}
                required
                placeholder="100"
                value={form.totalMarks}
                onChange={(e) => setField('totalMarks', e.target.value ? Number(e.target.value) : '')}
              />
              <TextField
                label="Passing Marks"
                type="number"
                min={0.01}
                step={0.01}
                required
                placeholder="33"
                value={form.passingMarks}
                onChange={(e) => setField('passingMarks', e.target.value ? Number(e.target.value) : '')}
              />
              <TextField
                label="Duration (min)"
                type="number"
                min={1}
                required
                placeholder="60"
                value={form.durationMinutes}
                onChange={(e) => setField('durationMinutes', e.target.value ? Number(e.target.value) : '')}
              />
            </div>

            <TextareaField
              label="Description"
              placeholder="Optional notes…"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={2}
            />

            {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</div>}
          </form>
        </Modal>
      )}
    </div>
  );
}
