'use client';

import { Fragment, FormEvent, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, CalendarCog, ChevronDown, ChevronRight, ClipboardList, HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSubjects, type Subject } from '@/lib/subjectService';
import {
  EXAM_STATUS_OPTIONS,
  EXAM_TYPE_OPTIONS,
  clearExamSubjects,
  createExam,
  deleteExam,
  getExams,
  setExamSubjects,
  updateExam,
  type Exam,
  type ExamPayload,
  type ExamStatus,
  type ExamSubjectPayload,
  type ExamType,
} from '@/lib/examService';
import { fromDateInput, toDateInput } from '@/lib/dateUtils';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { ExamStatusBadge } from '@/components/ui/Badge';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';
import ToggleCard from './ToggleCard';

interface ScheduleRow {
  examDate: string;
  totalMarks: number | '';
  passingMarks: number | '';
  durationMinutes: number | '';
}

interface ExamFormState {
  title: string;
  examType: ExamType;
  classId: number | '';
  startDate: string;
  endDate: string;
  description: string;
  status: ExamStatus;
}

const BLANK_FORM: ExamFormState = {
  title: '',
  examType: 'CLASS_TEST',
  classId: '',
  startDate: '',
  endDate: '',
  description: '',
  status: 'DRAFT',
};

const formatTypeLabel = (type: string) =>
  type
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export default function ExamsTab() {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/principal-2') ? '/principal-2' : pathname.startsWith('/staff') ? '/staff' : '/principal';

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const [filterClassId, setFilterClassId] = useState<number | ''>('');
  const [filterExamType, setFilterExamType] = useState<ExamType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ExamStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // ── Step 1: create/edit the exam header (POST/PUT /v1/exams only) ──
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ExamFormState>(BLANK_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Step 2: attach/replace subjects for an already-created exam (its own
  // modal, always targeting an id sourced from the confirmed exams list —
  // never from a create response that may or may not be enveloped). ──
  const [subjectsExam, setSubjectsExam] = useState<Exam | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [schedule, setSchedule] = useState<Record<number, ScheduleRow>>({});
  const [subjectsError, setSubjectsError] = useState('');
  const [subjectsSaving, setSubjectsSaving] = useState(false);

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

  const loadExams = async () => {
    setLoading(true);
    setError('');
    try {
      const content = (
        await getExams({
          classId: filterClassId || undefined,
          examType: filterExamType || undefined,
          status: filterStatus || undefined,
          search: activeSearch || undefined,
        })
      ).content;
      setExams(content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load exams.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (metaLoading) return;
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaLoading, filterClassId, filterExamType, filterStatus, activeSearch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm.trim());
  };

  const setField = <K extends keyof ExamFormState>(key: K, value: ExamFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm(BLANK_FORM);
    setEditingId(null);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setForm({
      title: exam.title,
      examType: exam.examType,
      classId: exam.classId,
      startDate: toDateInput(exam.startDate),
      endDate: toDateInput(exam.endDate),
      description: exam.description ?? '',
      status: exam.status,
    });
    setEditingId(exam.id);
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.classId || !form.startDate || !form.endDate) {
      setFormError('Please fill in title, exam type, class and both dates.');
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError('End date must be on or after the start date.');
      return;
    }

    const isEditing = editingId !== null;
    const examPayload: ExamPayload = {
      title: form.title.trim(),
      examType: form.examType,
      description: form.description,
      classId: Number(form.classId),
      startDate: fromDateInput(form.startDate),
      endDate: fromDateInput(form.endDate),
      status: form.status,
    };

    setSaving(true);
    setFormError('');
    try {
      if (isEditing) await updateExam(editingId!, examPayload);
      else await createExam(examPayload);
      setFormOpen(false);
      await loadExams();
    } catch (err) {
      setFormError(apiErrorMessage(err, `Could not ${isEditing ? 'update' : 'create'} that exam.`));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this exam? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteExam(id);
      setExams((prev) => prev.filter((ex) => ex.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that exam.'));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjectIds((prev) => {
      if (prev.includes(subjectId)) {
        setSchedule((s) => {
          const next = { ...s };
          delete next[subjectId];
          return next;
        });
        return prev.filter((id) => id !== subjectId);
      }
      setSchedule((s) => ({ ...s, [subjectId]: { examDate: '', totalMarks: '', passingMarks: '', durationMinutes: '' } }));
      return [...prev, subjectId];
    });
  };

  const setScheduleField = (subjectId: number, key: keyof ScheduleRow, value: string | number) => {
    setSchedule((s) => ({ ...s, [subjectId]: { ...s[subjectId], [key]: value } }));
  };

  const toggleExpanded = (examId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) next.delete(examId);
      else next.add(examId);
      return next;
    });
  };

  // exam.id here always comes from the already-listed exam (the GET /v1/exams
  // response), never from a just-created response — sidesteps any ambiguity
  // in what POST /v1/exams itself returns.
  const openSubjects = (exam: Exam) => {
    setSubjectsExam(exam);
    setSelectedSubjectIds(exam.subjects.map((s) => s.subjectId));
    setSchedule(
      Object.fromEntries(
        exam.subjects.map((s) => [
          s.subjectId,
          { examDate: toDateInput(s.examDate), totalMarks: s.totalMarks, passingMarks: s.passingMarks, durationMinutes: s.durationMinutes },
        ]),
      ),
    );
    setSubjectsError('');
  };

  const handleSaveSubjects = async (e: FormEvent) => {
    e.preventDefault();
    if (!subjectsExam) return;
    if (selectedSubjectIds.length === 0) {
      setSubjectsError('Please select at least one subject and set its schedule.');
      return;
    }
    for (const id of selectedSubjectIds) {
      const row = schedule[id];
      if (!row?.examDate || !row.totalMarks || !row.passingMarks || !row.durationMinutes) {
        setSubjectsError('Please set date, total marks, passing marks and duration for every selected subject.');
        return;
      }
    }

    const subjectsPayload: ExamSubjectPayload[] = selectedSubjectIds.map((id) => {
      const row = schedule[id];
      return {
        subjectId: id,
        examDate: fromDateInput(row.examDate),
        durationMinutes: Number(row.durationMinutes),
        totalMarks: Number(row.totalMarks),
        passingMarks: Number(row.passingMarks),
      };
    });

    setSubjectsSaving(true);
    setSubjectsError('');
    try {
      // Subjects are their own sub-resource with no per-row update endpoint,
      // so saving replaces the whole set rather than diffing it.
      if (subjectsExam.subjects.length > 0) await clearExamSubjects(subjectsExam.id);
      await setExamSubjects(subjectsExam.id, subjectsPayload);
      setSubjectsExam(null);
      await loadExams();
    } catch (err) {
      setSubjectsError(apiErrorMessage(err, 'Could not save subjects for this exam.'));
    } finally {
      setSubjectsSaving(false);
    }
  };

  const isEditing = editingId !== null;
  const scheduledSubjects = subjects.filter((s) => selectedSubjectIds.includes(s.id));

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {formOpen && (
        <Modal
          icon={Plus}
          title={isEditing ? 'Edit Exam' : 'Create Exam'}
          subtitle="Exam details for one class. Add subjects afterward from its row."
          size="lg"
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="exam-form" icon={Plus} loading={saving}>
                {isEditing ? 'Save changes' : 'Create Exam'}
              </Button>
            </>
          }
        >
          <form id="exam-form" onSubmit={handleSubmit} className="grid gap-3.5">
            <TextField
              label="Exam Title"
              required
              placeholder="e.g. Mid-Term Examination 2025"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
            />

            <div className="grid gap-3.5 sm:grid-cols-2">
              <SelectField label="Exam Type" required value={form.examType} onChange={(e) => setField('examType', e.target.value as ExamType)}>
                {EXAM_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {formatTypeLabel(type)}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Status" required value={form.status} onChange={(e) => setField('status', e.target.value as ExamStatus)}>
                {EXAM_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatTypeLabel(status)}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <SelectField
                label="Class"
                required
                disabled={metaLoading}
                value={form.classId}
                onChange={(e) => setField('classId', e.target.value ? Number(e.target.value) : '')}
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
              <TextField label="Start Date" type="date" required value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
              <TextField label="End Date" type="date" required value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
            </div>

            <TextareaField
              label="Description"
              placeholder="Optional instructions or notes…"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={2}
            />

            {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</div>}
          </form>
        </Modal>
      )}

      {subjectsExam && (
        <Modal
          icon={CalendarCog}
          title="Manage Subjects"
          subtitle={subjectsExam.title}
          size="lg"
          onClose={() => setSubjectsExam(null)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setSubjectsExam(null)}>
                Cancel
              </Button>
              <Button type="submit" form="exam-subjects-form" icon={Plus} loading={subjectsSaving}>
                Save Subjects
              </Button>
            </>
          }
        >
          <form id="exam-subjects-form" onSubmit={handleSaveSubjects} className="grid gap-3.5">
            <div>
              <p className="mb-2.5 text-sm font-semibold text-slate-900">Select Subjects</p>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <ToggleCard
                    key={subject.id}
                    label={subject.subjectName}
                    sublabel={subject.subjectCode}
                    selected={selectedSubjectIds.includes(subject.id)}
                    onClick={() => toggleSubject(subject.id)}
                  />
                ))}
              </div>
            </div>

            {scheduledSubjects.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-xs text-slate-400">
                Select at least one subject above to set its date, marks and duration.
              </p>
            ) : (
              <div>
                <p className="mb-2.5 text-sm font-semibold text-slate-900">Set date, marks &amp; duration per subject:</p>
                <div className="space-y-2">
                  {scheduledSubjects.map((subject) => {
                    const row = schedule[subject.id] ?? { examDate: '', totalMarks: '', passingMarks: '', durationMinutes: '' };
                    return (
                      <div key={subject.id} className="rounded-xl border border-amber-100 bg-white p-2.5">
                        <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                          <BookOpen size={14} className="text-amber-500" /> {subject.subjectName}
                        </span>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500">Date</label>
                            <input
                              type="date"
                              value={row.examDate}
                              onChange={(e) => setScheduleField(subject.id, 'examDate', e.target.value)}
                              className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500">Total Marks</label>
                            <input
                              type="number"
                              min={0.01}
                              step={0.01}
                              placeholder="Marks"
                              value={row.totalMarks}
                              onChange={(e) => setScheduleField(subject.id, 'totalMarks', e.target.value ? Number(e.target.value) : '')}
                              className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500">Passing Marks</label>
                            <input
                              type="number"
                              min={0.01}
                              step={0.01}
                              placeholder="Marks"
                              value={row.passingMarks}
                              onChange={(e) => setScheduleField(subject.id, 'passingMarks', e.target.value ? Number(e.target.value) : '')}
                              className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-slate-500">Duration (min)</label>
                            <input
                              type="number"
                              min={1}
                              placeholder="Minutes"
                              value={row.durationMinutes}
                              onChange={(e) => setScheduleField(subject.id, 'durationMinutes', e.target.value ? Number(e.target.value) : '')}
                              className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {subjectsError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{subjectsError}</div>}
          </form>
        </Modal>
      )}

      {/* ── List panel ── */}
      <div className="card-premium overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">All Exams</h2>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{exams.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch}>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exams…"
                className="h-9 w-40 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
              />
            </form>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value ? Number(e.target.value) : '')}
              className="h-9 w-32 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
            >
              <option value="">All classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className}
                </option>
              ))}
            </select>
            <select
              value={filterExamType}
              onChange={(e) => setFilterExamType(e.target.value as ExamType | '')}
              className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
            >
              <option value="">All types</option>
              {EXAM_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {formatTypeLabel(type)}
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
                  {formatTypeLabel(status)}
                </option>
              ))}
            </select>
            <Button icon={Plus} size="sm" onClick={openCreate} disabled={metaLoading}>
              Create Exam
            </Button>
          </div>
        </div>

        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="text-xs font-medium text-slate-500">
                <th className="w-8 px-4 py-2.5" />
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Class</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Start</th>
                <th className="px-4 py-2.5">End</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading || metaLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No exams yet.
                  </td>
                </tr>
              ) : (
                exams.map((exam) => {
                  const expanded = expandedIds.has(exam.id);
                  const hasSubjects = exam.subjects.length > 0;
                  return (
                    <Fragment key={exam.id}>
                      <tr className="text-slate-700">
                        <td className="px-4 py-3">
                          {hasSubjects && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(exam.id)}
                              aria-label={expanded ? 'Collapse' : 'Expand'}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}
                        </td>
                        <td className="max-w-52 truncate px-4 py-3 font-semibold text-slate-900">{exam.title}</td>
                        <td className="px-4 py-3">{exam.className}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            {formatTypeLabel(exam.examType)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{new Date(exam.startDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{new Date(exam.endDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <ExamStatusBadge status={exam.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton icon={CalendarCog} label="Manage Subjects" variant="primary" onClick={() => openSubjects(exam)} />
                            {/* <IconButton
                              icon={HelpCircle}
                              label="Manage Questions"
                              variant="primary"
                              disabled={!hasSubjects}
                              onClick={() => router.push(`${basePath}/exams/${exam.id}/questions`)}
                            /> */}
                            <IconButton icon={Pencil} label="Edit" variant="primary" onClick={() => openEdit(exam)} />
                            <IconButton
                              icon={Trash2}
                              label="Delete"
                              variant="danger"
                              loading={deletingId === exam.id}
                              onClick={() => handleDelete(exam.id)}
                            />
                          </div>
                        </td>
                      </tr>
                      {expanded && hasSubjects && (
                        <tr>
                          <td colSpan={8} className="bg-slate-50/60 px-4 py-3">
                            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Subject Schedule</p>
                            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                              {exam.subjects.map((sub) => (
                                <div key={sub.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                                  <BookOpen size={15} className="shrink-0 text-amber-500" />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">{sub.subjectName}</p>
                                    <p className="truncate text-xs text-slate-400">
                                      {new Date(sub.examDate).toLocaleDateString()} · {sub.totalMarks} marks · {sub.durationMinutes} min
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
