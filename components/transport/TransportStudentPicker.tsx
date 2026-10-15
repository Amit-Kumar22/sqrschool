'use client';

import { useEffect, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getStudentAdmissions, type StudentAdmission } from '@/lib/studentService';
import { SelectField } from '@/components/ui/FormField';

interface TransportStudentPickerProps {
  classId: number | '';
  studentId: number | '';
  onChange: (classId: number | '', studentId: number | '') => void;
  /** Label for the empty student option — e.g. "All students" when used as a filter. */
  placeholder?: string;
}

/**
 * Student picker fed by the same list as the Students page: every student is
 * listed up front ("All classes"), and choosing a class narrows the list
 * server-side via ?classId=. Unlike the fee module's StudentPicker it doesn't
 * require a class first, and it surfaces load errors instead of showing an
 * empty dropdown. The value is the admission id, which the transport and
 * student-fee APIs take as studentId.
 */
export default function TransportStudentPicker({ classId, studentId, onChange, placeholder = 'Select a student' }: TransportStudentPickerProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<StudentAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getClasses()
      .then((page) => setClasses(page.content ?? []))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load classes.')));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getStudentAdmissions({ classId: classId || undefined })
      .then((page) => !cancelled && setStudents((page.content ?? []).filter((s) => s.active !== false)))
      .catch((err) => {
        if (cancelled) return;
        setStudents([]);
        setError(apiErrorMessage(err, 'Could not load students.'));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const sorted = [...students].sort((a, b) => (a.studentUser?.fullName ?? '').localeCompare(b.studentUser?.fullName ?? ''));

  return (
    <div className="grid gap-2.5 sm:min-w-[28rem] sm:grid-cols-2">
      <SelectField label="Class" value={classId} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '', '')}>
        <option value="">All classes</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.className}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Student"
        value={studentId}
        disabled={loading}
        hint={!loading && !error ? `${sorted.length} student${sorted.length === 1 ? '' : 's'}` : undefined}
        onChange={(e) => onChange(classId, e.target.value ? Number(e.target.value) : '')}
      >
        <option value="">{loading ? 'Loading students…' : sorted.length ? placeholder : 'No students found'}</option>
        {sorted.map((s) => (
          <option key={s.id} value={s.id}>
            {s.studentUser?.fullName ?? `Student #${s.id}`}
            {!classId && s.schoolClass?.className ? ` — ${s.schoolClass.className}` : ''} ({s.admissionNumber})
          </option>
        ))}
      </SelectField>
      {error && <p className="-mt-1 text-xs text-red-600 sm:col-span-2">{error}</p>}
    </div>
  );
}
