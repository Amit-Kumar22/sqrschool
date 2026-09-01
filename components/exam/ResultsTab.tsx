'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Check, Pencil, Save, Trash2, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getStudentAdmissions, type StudentAdmission } from '@/lib/studentService';
import {
  createExamResult,
  deleteExamResult,
  getExamResults,
  getExams,
  updateExamResult,
  updateExamResultStatus,
  type Exam,
  type ExamResult,
  type ExamResultStatus,
} from '@/lib/examService';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';

interface RowState {
  obtainedMarks: string;
  remarks: string;
  absent: boolean;
}

const blankRow = (): RowState => ({ obtainedMarks: '', remarks: '', absent: false });

const STATUS_FILTER_OPTIONS: ExamResultStatus[] = ['DRAFT', 'PUBLISHED', 'WITHHELD', 'CANCELLED'];

// Same colored-pill language as the Result column's Pass/Fail badge.
const STATUS_SELECT_CLASSES: Record<ExamResultStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-600',
  PUBLISHED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  WITHHELD: 'border-amber-200 bg-amber-50 text-amber-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
};

const formatShortDate = (value: string) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const inputClass =
  'h-8 rounded-md border border-slate-200 px-2 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400';

/** Result Entry — per-student mark entry for one class's exam, one subject at a time. Save is per-row: POST/PUT /exam-results each take a single result, not a list. */
export default function ResultsTab() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState<number | ''>('');
  const [refLoading, setRefLoading] = useState(true);

  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState<number | ''>('');
  const [examsLoading, setExamsLoading] = useState(false);

  const [students, setStudents] = useState<StudentAdmission[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [activeSubjectId, setActiveSubjectId] = useState<number | ''>('');
  const [results, setResults] = useState<ExamResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Which student's marks/absent/remarks are currently editable — everyone
  // else shows those three fields as plain text. A student with no saved
  // result yet has nothing to show as text, so their row is always editable.
  const [editingId, setEditingId] = useState<number | null>(null);
  // Pending status per student — the dropdown only stages a choice locally;
  // nothing is sent until the tick button confirms it (keyed by studentId,
  // same as `rows`).
  const [statusDrafts, setStatusDrafts] = useState<Record<number, ExamResultStatus>>({});

  // Real server-side filters — each one is sent as an actual query param on
  // getExamResults, kept in a SEPARATE fetch (filteredResults) from the
  // unfiltered `results` above. `results`/`rows` always load every result
  // for examId+examSubjectId so the mark-entry inputs never lose data;
  // filteredResults only decides which rows are visible.
  const [studentFilter, setStudentFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<ExamResultStatus | ''>('');
  const [absentFilter, setAbsentFilter] = useState<'' | 'true' | 'false'>('');
  const [passedFilter, setPassedFilter] = useState<'' | 'true' | 'false'>('');
  const [filteredResults, setFilteredResults] = useState<ExamResult[] | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setRefLoading(true);
      setError('');
      try {
        const page = await getClasses();
        const content = page.content ?? [];
        setClasses(content);
        setClassId((prev) => prev || (content[0]?.id ?? ''));
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes from the server.'));
      } finally {
        setRefLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      setStudentsLoading(true);
      setError('');
      try {
        const studentsPage = await getStudentAdmissions({ classId });
        setStudents(studentsPage.content ?? []);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load students for this class.'));
      } finally {
        setStudentsLoading(false);
      }
    };
    load();
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      setExamsLoading(true);
      setError('');
      try {
        const examsPage = await getExams({ classId });
        const examList = examsPage.content ?? [];
        setExams(examList);
        setExamId((prev) => (prev && examList.some((e) => e.id === prev) ? prev : (examList[0]?.id ?? '')));
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load exams for this class.'));
      } finally {
        setExamsLoading(false);
      }
    };
    load();
  }, [classId]);

  const selectedExam = exams.find((e) => e.id === examId) ?? null;

  useEffect(() => {
    const subjects = selectedExam?.subjects ?? [];
    setActiveSubjectId((prev) => (prev && subjects.some((s) => s.id === prev) ? prev : (subjects[0]?.id ?? '')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, selectedExam]);

  const activeSubject = selectedExam?.subjects.find((s) => s.id === activeSubjectId) ?? null;

  const hasActiveFilter = !!(studentFilter || statusFilter || absentFilter || passedFilter);
  const visibleStudents = filteredResults ? students.filter((s) => filteredResults.some((r) => r.studentId === s.id)) : students;

  // Real query — hits GET /exam-results with classId/studentId/status/absent/
  // passed exactly as the API defines them, whenever any filter is set.
  useEffect(() => {
    if (!examId || !activeSubjectId || !hasActiveFilter) {
      setFilteredResults(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setFilterLoading(true);
      setError('');
      try {
        const content = await getExamResults({
          examId,
          examSubjectId: activeSubjectId,
          classId: selectedExam?.classId,
          studentId: studentFilter || undefined,
          status: statusFilter || undefined,
          absent: absentFilter === '' ? undefined : absentFilter === 'true',
          passed: passedFilter === '' ? undefined : passedFilter === 'true',
        });
        if (!cancelled) setFilteredResults(content ?? []);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not apply filters.'));
      } finally {
        if (!cancelled) setFilterLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, activeSubjectId, studentFilter, statusFilter, absentFilter, passedFilter]);

  const resetFilters = () => {
    setStudentFilter('');
    setStatusFilter('');
    setAbsentFilter('');
    setPassedFilter('');
    setFilteredResults(null);
  };

  const loadResults = async () => {
    resetFilters();
    if (!examId || !activeSubjectId) {
      setResults([]);
      setRows({});
      return;
    }
    setResultsLoading(true);
    setError('');
    try {
      const content = await getExamResults({ examId, examSubjectId: activeSubjectId });
      setResults(content ?? []);
      const map: Record<number, RowState> = {};
      const statusMap: Record<number, ExamResultStatus> = {};
      students.forEach((student) => {
        const existing = content.find((r) => r.studentId === student.id);
        map[student.id] = existing
          ? { obtainedMarks: String(existing.obtainedMarks ?? ''), remarks: existing.remarks ?? '', absent: existing.absent }
          : blankRow();
        if (existing) statusMap[student.id] = existing.status;
      });
      setRows(map);
      setStatusDrafts(statusMap);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load results for this subject.'));
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, activeSubjectId, students]);

  const setRow = <K extends keyof RowState>(studentId: number, key: K, value: RowState[K]) =>
    setRows((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] ?? blankRow()), [key]: value } }));

  // POST/PUT /exam-results each take one result, not a list — so save is
  // per-row, and the response (a single ExamResult) is merged straight into
  // local state instead of re-fetching the whole list.
  const handleSaveRow = async (student: StudentAdmission) => {
    if (!selectedExam || !activeSubject) return;
    setSavingId(student.id);
    setError('');
    try {
      const row = rows[student.id] ?? blankRow();
      const existing = results.find((r) => r.studentId === student.id);
      const payload = {
        examId: selectedExam.id,
        examSubjectId: activeSubject.id,
        studentId: student.id,
        obtainedMarks: row.obtainedMarks === '' ? 0 : Number(row.obtainedMarks),
        absent: row.absent,
        remarks: row.remarks,
        status: existing?.status ?? ('DRAFT' as ExamResultStatus),
      };
      const saved = existing ? await updateExamResult(existing.id, payload) : await createExamResult(payload);
      setResults((prev) => [...prev.filter((r) => r.studentId !== student.id), saved]);
      setRows((prev) => ({
        ...prev,
        [student.id]: { obtainedMarks: String(saved.obtainedMarks ?? ''), remarks: saved.remarks ?? '', absent: saved.absent },
      }));
      setStatusDrafts((prev) => ({ ...prev, [student.id]: saved.status }));
      setEditingId(null);
    } catch (err) {
      setError(apiErrorMessage(err, `Could not save ${student.studentUser?.fullName || "this student's"} result.`));
    } finally {
      setSavingId(null);
    }
  };

  // Discards unsaved edits for one row and drops it back to view mode —
  // only meaningful for a row that already has a saved result.
  const cancelEdit = (student: StudentAdmission) => {
    const existing = results.find((r) => r.studentId === student.id);
    if (existing) {
      setRows((prev) => ({
        ...prev,
        [student.id]: { obtainedMarks: String(existing.obtainedMarks ?? ''), remarks: existing.remarks ?? '', absent: existing.absent },
      }));
    }
    setEditingId(null);
  };

  const handleDeleteRow = async (student: StudentAdmission) => {
    const existing = results.find((r) => r.studentId === student.id);
    if (!existing) return;
    if (!confirm(`Delete ${student.studentUser?.fullName || 'this student'}'s result? This cannot be undone.`)) return;
    setDeletingId(existing.id);
    setError('');
    try {
      await deleteExamResult(existing.id);
      setResults((prev) => prev.filter((r) => r.id !== existing.id));
      setRows((prev) => ({ ...prev, [student.id]: blankRow() }));
      setStatusDrafts((prev) => {
        const next = { ...prev };
        delete next[student.id];
        return next;
      });
      if (editingId === student.id) setEditingId(null);
    } catch (err) {
      setError(apiErrorMessage(err, `Could not delete ${student.studentUser?.fullName || "this student's"} result.`));
    } finally {
      setDeletingId(null);
    }
  };

  // PUT /exam-results/{id}/status flips one result's status at a time — no
  // bulk variant exists, so this is called per-row from the tick button next
  // to the status dropdown (the dropdown itself only stages a choice).
  const handleUpdateStatus = async (result: ExamResult, status: ExamResultStatus) => {
    setStatusUpdatingId(result.id);
    setError('');
    try {
      const updated = await updateExamResultStatus(result.id, status);
      setResults((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setStatusDrafts((prev) => ({ ...prev, [result.studentId]: updated.status }));
    } catch (err) {
      setError(apiErrorMessage(err, `Could not update status for ${result.studentName || 'this result'}.`));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const loading = refLoading || examsLoading || studentsLoading;

  return (
    <div className="space-y-3">
      <div className="card-premium p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium-sm">
            <BarChart3 size={15} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Result Entry</h2>
            <p className="text-xs text-slate-500">Select a class and exam, then enter marks per student and save each row.</p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-end gap-1.5">
          <SelectField
            label="Class"
            required
            uiSize="sm"
            wrapperClassName="w-32"
            value={classId}
            disabled={refLoading || classes.length === 0}
            onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="" disabled>
              {refLoading ? 'Loading…' : 'Select a class'}
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Select Exam"
            required
            uiSize="sm"
            wrapperClassName="w-48"
            value={examId}
            disabled={examsLoading || exams.length === 0}
            onChange={(e) => setExamId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="" disabled>
              {examsLoading ? 'Loading…' : exams.length === 0 ? 'No exams for this class' : 'Select an exam'}
            </option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Subject"
            uiSize="sm"
            wrapperClassName="w-48"
            value={activeSubjectId}
            disabled={!selectedExam || selectedExam.subjects.length === 0}
            onChange={(e) => setActiveSubjectId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="" disabled>
              {!selectedExam ? 'Select an exam first' : selectedExam.subjects.length === 0 ? 'No subjects scheduled' : 'Select a subject'}
            </option>
            {selectedExam?.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subjectName} ({formatShortDate(subject.examDate)} · {subject.totalMarks}M)
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Student"
            uiSize="sm"
            wrapperClassName="w-36"
            value={studentFilter}
            disabled={students.length === 0}
            onChange={(e) => setStudentFilter(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.studentUser?.fullName || s.studentCode}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Status"
            uiSize="sm"
            wrapperClassName="w-28"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExamResultStatus | '')}
          >
            <option value="">All</option>
            {STATUS_FILTER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Absent"
            uiSize="sm"
            wrapperClassName="w-24"
            value={absentFilter}
            onChange={(e) => setAbsentFilter(e.target.value as '' | 'true' | 'false')}
          >
            <option value="">All</option>
            <option value="true">Absent</option>
            <option value="false">Present</option>
          </SelectField>

          <SelectField
            label="Passed"
            uiSize="sm"
            wrapperClassName="w-24"
            value={passedFilter}
            onChange={(e) => setPassedFilter(e.target.value as '' | 'true' | 'false')}
          >
            <option value="">All</option>
            <option value="true">Passed</option>
            <option value="false">Failed</option>
          </SelectField>

          {hasActiveFilter && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!loading && !selectedExam ? (
        <div className="card-premium px-4 py-10 text-center text-sm text-slate-400">
          {exams.length === 0 ? 'This class has no exams scheduled yet.' : 'Select an exam to enter results.'}
        </div>
      ) : selectedExam ? (
        <div className="card-premium p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <p className="text-sm font-semibold text-slate-900">{selectedExam.title}</p>
            <p className="text-xs text-slate-400">
              {filterLoading
                ? 'Filtering…'
                : `Showing ${visibleStudents.length} of ${students.length} student${students.length === 1 ? '' : 's'}`}
            </p>
          </div>

          <div className="scrollbar-thin mt-3 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  <th className="w-8 py-2">#</th>
                  <th className="py-2">Student</th>
                  <th className="w-20 py-2">Roll No</th>
                  <th className="w-28 py-2">Marks / {activeSubject?.totalMarks ?? '—'}</th>
                  <th className="w-16 py-2 text-center">Absent</th>
                  <th className="py-2">Remarks</th>
                  <th className="w-16 py-2">Grade</th>
                  <th className="w-20 py-2">Result</th>
                  <th className="w-36 py-2">Published</th>
                  <th className="w-24 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {studentsLoading || resultsLoading ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-sm text-slate-400">
                      Loading students…
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-sm text-slate-400">
                      No students in this class yet.
                    </td>
                  </tr>
                ) : visibleStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-sm text-slate-400">
                      No students match this filter.
                    </td>
                  </tr>
                ) : (
                  visibleStudents.map((student, idx) => {
                    const row = rows[student.id] ?? blankRow();
                    const existing = results.find((r) => r.studentId === student.id);
                    const isEditing = !existing || editingId === student.id;
                    return (
                      <tr key={student.id}>
                        <td className="py-2 text-slate-400">{idx + 1}</td>
                        <td className="py-2">
                          <p className="font-medium text-slate-900">{student.studentUser?.fullName || '—'}</p>
                          <p className="text-xs text-slate-400">{student.studentCode}</p>
                        </td>
                        <td className="py-2 text-slate-600">{student.rollNumber || '—'}</td>
                        <td className="py-2">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              max={activeSubject?.totalMarks}
                              placeholder={`${activeSubject?.totalMarks ?? ''}`}
                              value={row.obtainedMarks}
                              disabled={row.absent}
                              onChange={(e) => setRow(student.id, 'obtainedMarks', e.target.value)}
                              className={`w-24 ${inputClass}`}
                            />
                          ) : existing.absent ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                              —
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                existing.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {existing.obtainedMarks} / {existing.totalMarks}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          {isEditing ? (
                            <input
                              type="checkbox"
                              checked={row.absent}
                              onChange={(e) => setRow(student.id, 'absent', e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/30"
                            />
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                existing.absent ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {existing.absent ? 'Yes' : 'No'}
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {isEditing ? (
                            <input
                              type="text"
                              placeholder="Optional"
                              value={row.remarks}
                              onChange={(e) => setRow(student.id, 'remarks', e.target.value)}
                              className={`w-full min-w-[140px] ${inputClass}`}
                            />
                          ) : existing.remarks ? (
                            <span className="font-medium text-indigo-600">{existing.remarks}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-2 text-slate-600">{existing?.grade || '—'}</td>
                        <td className="py-2">
                          {!existing ? (
                            <span className="text-slate-300">—</span>
                          ) : existing.absent ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                              Absent
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                existing.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {existing.passed ? 'Pass' : 'Fail'}
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {existing ? (
                            <div className="flex items-center gap-1">
                              <select
                                value={statusDrafts[student.id] ?? existing.status}
                                disabled={statusUpdatingId === existing.id}
                                onChange={(e) =>
                                  setStatusDrafts((prev) => ({ ...prev, [student.id]: e.target.value as ExamResultStatus }))
                                }
                                className={`h-7 rounded-full border px-2 text-[11px] font-semibold focus:ring-2 focus:ring-amber-500/25 focus:outline-none disabled:opacity-50 ${
                                  STATUS_SELECT_CLASSES[statusDrafts[student.id] ?? existing.status]
                                }`}
                              >
                                {STATUS_FILTER_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s.charAt(0) + s.slice(1).toLowerCase()}
                                  </option>
                                ))}
                              </select>
                              <IconButton
                                icon={Check}
                                label={`Update status for ${student.studentUser?.fullName || 'this result'}`}
                                variant="primary"
                                size="sm"
                                loading={statusUpdatingId === existing.id}
                                onClick={() => handleUpdateStatus(existing, statusDrafts[student.id] ?? existing.status)}
                              />
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                {existing && (
                                  <IconButton
                                    icon={X}
                                    label={`Cancel editing ${student.studentUser?.fullName || 'this row'}`}
                                    size="sm"
                                    onClick={() => cancelEdit(student)}
                                  />
                                )}
                                <IconButton
                                  icon={Save}
                                  label={`Save ${student.studentUser?.fullName || 'result'}`}
                                  variant="primary"
                                  size="sm"
                                  loading={savingId === student.id}
                                  onClick={() => handleSaveRow(student)}
                                />
                              </>
                            ) : (
                              <>
                                <IconButton
                                  icon={Pencil}
                                  label={`Edit ${student.studentUser?.fullName || 'this row'}`}
                                  size="sm"
                                  onClick={() => setEditingId(student.id)}
                                />
                                <IconButton
                                  icon={Trash2}
                                  label={`Delete ${student.studentUser?.fullName || "this student's"} result`}
                                  variant="danger"
                                  size="sm"
                                  loading={!!existing && deletingId === existing.id}
                                  onClick={() => handleDeleteRow(student)}
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
