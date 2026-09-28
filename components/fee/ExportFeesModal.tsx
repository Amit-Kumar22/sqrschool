'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { getStudentFeesExcel, type StudentFeeStatus } from '@/lib/feeService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getStudentAdmissions, type StudentAdmission } from '@/lib/studentService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';

const STATUS_OPTIONS: { value: StudentFeeStatus | ''; label: string; activeClass: string }[] = [
  { value: '', label: 'All', activeClass: 'bg-brand-600 text-white ring-brand-600' },
  { value: 'PENDING', label: 'Pending', activeClass: 'bg-amber-500 text-white ring-amber-500' },
  { value: 'PARTIAL', label: 'Partial', activeClass: 'bg-sky-600 text-white ring-sky-600' },
  { value: 'PAID', label: 'Paid', activeClass: 'bg-emerald-600 text-white ring-emerald-600' },
  { value: 'OVERDUE', label: 'Overdue', activeClass: 'bg-red-600 text-white ring-red-600' },
];

const slug = (value: string) => value.trim().replace(/\s+/g, '-').toLowerCase();

// With responseType 'blob' a failed request's body is also a Blob, so the
// usual { message } lookup in apiErrorMessage can't see it — read it first.
async function blobErrorMessage(err: unknown, fallback: string): Promise<string> {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { message?: string };
      return parsed.message || fallback;
    } catch {
      return fallback;
    }
  }
  return apiErrorMessage(err, fallback);
}

/** Export student fees to Excel — every filter is optional, leaving them all blank exports the whole school. */
export default function ExportFeesModal({ onClose }: { onClose: () => void }) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [students, setStudents] = useState<StudentAdmission[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [classId, setClassId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>('');
  const [status, setStatus] = useState<StudentFeeStatus | ''>('');

  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getClasses()
      .then((page) => setClasses(page.content ?? []))
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, []);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    getStudentAdmissions({ classId })
      .then((page) => {
        if (!cancelled) setStudents(page.content ?? []);
      })
      .catch(() => {
        if (!cancelled) setStudents([]);
      })
      .finally(() => {
        if (!cancelled) setStudentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const buildFilename = () => {
    const parts = ['student-fees'];
    const cls = classes.find((c) => c.id === classId);
    if (cls) parts.push(slug(cls.className));
    const student = students.find((s) => s.id === studentId);
    if (student?.studentUser?.fullName) parts.push(slug(student.studentUser.fullName));
    if (status) parts.push(status.toLowerCase());
    parts.push(new Date().toISOString().slice(0, 10));
    return `${parts.join('-')}.xlsx`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDownloading(true);
    setError('');
    try {
      const blob = await getStudentFeesExcel({
        classId: classId || undefined,
        studentId: studentId || undefined,
        status: status || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildFilename();
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setError(await blobErrorMessage(err, 'Could not export student fees.'));
    } finally {
      setDownloading(false);
    }
  };

  const hasFilters = Boolean(classId || studentId || status);

  return (
    <Modal
      icon={FileSpreadsheet}
      accent="emerald"
      title="Export student fees"
      subtitle="Download an Excel sheet of student fees. Leave filters blank to include everyone."
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="export-fees-form" icon={FileSpreadsheet} loading={downloading}>
            Download Excel
          </Button>
        </>
      }
    >
      <form id="export-fees-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField
          label="Class"
          value={classId}
          disabled={classesLoading}
          onChange={(e) => {
            const next = e.target.value ? Number(e.target.value) : '';
            setClassId(next);
            setStudentId('');
            // Reset here rather than in the effect so the student list never
            // flashes the previous class's names while the new ones load.
            setStudents([]);
            setStudentsLoading(Boolean(next));
          }}
        >
          <option value="">{classesLoading ? 'Loading…' : 'All classes'}</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.className}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Student"
          value={studentId}
          disabled={!classId || studentsLoading}
          onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">
            {!classId ? 'Select a class to pick a student' : studentsLoading ? 'Loading…' : 'All students'}
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.studentUser?.fullName} ({s.admissionNumber})
            </option>
          ))}
        </SelectField>

        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
                    active ? opt.activeClass : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>{hasFilters ? 'Exporting filtered fees' : 'Exporting all student fees'}</span>
          {hasFilters && (
            <button
              type="button"
              className="font-semibold text-brand-700 hover:underline"
              onClick={() => {
                setClassId('');
                setStudentId('');
                setStudents([]);
                setStatus('');
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
