'use client';

import { useEffect, useState } from 'react';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getStudentAdmissions, type StudentAdmission } from '@/lib/studentService';
import { SelectField } from '@/components/ui/FormField';

interface StudentPickerProps {
  classId: number | '';
  studentId: number | '';
  onChange: (classId: number | '', studentId: number | '') => void;
}

/** Class → student cascading picker shared by Collect Fee and the Student Ledger report. */
export default function StudentPicker({ classId, studentId, onChange }: StudentPickerProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [students, setStudents] = useState<StudentAdmission[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    setClassesLoading(true);
    getClasses()
      .then((page) => setClasses(page.content ?? []))
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, []);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      return;
    }
    let cancelled = false;
    setStudentsLoading(true);
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

  return (
    <div className="grid gap-2.5 sm:max-w-lg sm:grid-cols-2">
      <SelectField
        label="Class"
        value={classId}
        disabled={classesLoading}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '', '')}
      >
        <option value="" disabled>
          {classesLoading ? 'Loading…' : 'Select a class'}
        </option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.className}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Student"
        value={studentId}
        disabled={!classId || studentsLoading || students.length === 0}
        onChange={(e) => onChange(classId, e.target.value ? Number(e.target.value) : '')}
      >
        <option value="" disabled>
          {!classId ? 'Select a class first' : studentsLoading ? 'Loading…' : 'Select a student'}
        </option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.studentUser?.fullName} ({s.admissionNumber})
          </option>
        ))}
      </SelectField>
    </div>
  );
}
