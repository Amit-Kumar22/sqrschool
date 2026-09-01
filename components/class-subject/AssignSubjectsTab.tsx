'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Landmark, Loader2, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSubjects, type Subject } from '@/lib/subjectService';
import {
  bulkUpdateClassSubjects,
  createClassSubject,
  deleteClassSubject,
  getClassSubjects,
  type ClassSubject,
} from '@/lib/classSubjectService';
import Button from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';

/** Single Assignment — pick one class, bulk-assign every not-yet-assigned subject to it, and manage what's already assigned. */
export default function AssignSubjectsTab() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [refLoading, setRefLoading] = useState(true);

  const [classId, setClassId] = useState<number | ''>('');
  const [assignments, setAssignments] = useState<ClassSubject[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRefData = async () => {
      setRefLoading(true);
      setError('');
      try {
        const [classesPage, subjectsPage] = await Promise.all([getClasses(), getSubjects()]);
        setClasses(classesPage.content ?? []);
        setSubjects(subjectsPage.content ?? []);
        setClassId((prev) => prev || (classesPage.content?.[0]?.id ?? ''));
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes or subjects from the server.'));
      } finally {
        setRefLoading(false);
      }
    };
    loadRefData();
  }, []);

  const loadAssignments = async (id: number) => {
    setAssignmentsLoading(true);
    setError('');
    try {
      const content = (await getClassSubjects({ classId: id })).content;
      setAssignments(content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load assigned subjects for this class.'));
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    if (!classId) return;
    loadAssignments(Number(classId));
  }, [classId]);

  const assignedSubjectIds = useMemo(() => new Set(assignments.map((a) => a.subjectId)), [assignments]);
  const availableSubjects = useMemo(
    () => subjects.filter((s) => !assignedSubjectIds.has(s.id)),
    [subjects, assignedSubjectIds],
  );

  // Every not-yet-assigned subject starts checked, so the common case
  // ("assign everything that's left") is a single click.
  useEffect(() => {
    setSelected(new Set(availableSubjects.map((s) => s.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, assignments]);

  const toggleSubject = (subjectId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  };

  const handleAssign = async () => {
    if (!classId || selected.size === 0) return;
    setSaving(true);
    setError('');
    try {
      // Single vs. bulk are separate endpoints on the backend — one subject
      // goes through the plain create call, more than one through
      // bulk-update (which takes one classId + a list of subjectIds).
      if (selected.size === 1) {
        await createClassSubject({ classId: Number(classId), subjectId: Array.from(selected)[0] });
      } else {
        await bulkUpdateClassSubjects({ classId: Number(classId), subjectIds: Array.from(selected) });
      }
      await loadAssignments(Number(classId));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not assign the selected subjects.'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (assignment: ClassSubject) => {
    setRemovingId(assignment.id);
    setError('');
    try {
      await deleteClassSubject(assignment.id);
      await loadAssignments(Number(classId));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove that subject.'));
    } finally {
      setRemovingId(null);
    }
  };

  const selectedClass = classes.find((c) => c.id === classId);
  const dataReady = !refLoading;
  const loading = refLoading || assignmentsLoading;

  return (
    <div className="card-premium space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium-sm">
          <Landmark size={17} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Assign Subject</h2>
          <p className="text-xs text-slate-500">Select one class and assign subjects to it.</p>
        </div>
      </div>

      <SelectField
        label="Select Class"
        value={classId}
        disabled={!dataReady || classes.length === 0}
        onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}
        wrapperClassName="max-w-sm"
      >
        <option value="" disabled>
          {dataReady ? (classes.length === 0 ? 'No classes yet' : 'Select a class') : 'Loading classes…'}
        </option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.className}
          </option>
        ))}
      </SelectField>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Select Subjects to Assign</p>
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <p className="text-sm text-slate-500">Add a subject first, from the Subjects tab.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const isAssigned = assignedSubjectIds.has(subject.id);
              const isChecked = selected.has(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  disabled={isAssigned}
                  onClick={() => toggleSubject(subject.id)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    isAssigned
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50/60'
                      : isChecked
                        ? 'border-amber-400 bg-amber-50/60'
                        : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isAssigned ? 'border-slate-200' : isChecked ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isChecked && !isAssigned && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-semibold ${isAssigned ? 'text-slate-400' : 'text-slate-900'}`}>
                      {subject.subjectName}
                    </span>
                    <span className={`block text-xs ${isAssigned ? 'text-slate-300' : 'text-slate-500'}`}>{subject.subjectCode}</span>
                  </span>
                  {isAssigned && (
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                      assigned
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Button icon={Check} onClick={handleAssign} loading={saving} disabled={loading || selected.size === 0}>
        Assign {selected.size} {selected.size === 1 ? 'Subject' : 'Subjects'}
      </Button>

      {!loading && (
        <div>
          <p className="mb-2 text-sm text-slate-600">
            Currently assigned to <span className="font-semibold text-amber-700">{selectedClass?.className ?? '—'}</span>:
          </p>
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-400">No subjects assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 py-1 pr-1.5 pl-2.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20"
                >
                  <BookOpen size={12} />
                  {a.subjectName}
                  <button
                    type="button"
                    onClick={() => handleRemove(a)}
                    disabled={removingId === a.id}
                    aria-label={`Remove ${a.subjectName}`}
                    className="ml-0.5 rounded-full p-0.5 text-amber-600 hover:bg-amber-100 hover:text-amber-900 disabled:opacity-40"
                  >
                    {removingId === a.id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
