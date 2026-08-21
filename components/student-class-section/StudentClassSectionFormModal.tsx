'use client';

import { FormEvent, useEffect, useState } from 'react';
import { UsersRound } from 'lucide-react';
import {
  createStudentClassSection,
  updateStudentClassSection,
  type StudentAdmission,
  type StudentClassSection,
  type StudentClassSectionPayload,
} from '@/lib/studentService';
import { getSections, type Section } from '@/lib/classSectionService';
import type { SchoolClass } from '@/lib/classService';
import type { AcademicYear } from '@/lib/academicYearService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';

interface FormState {
  studentId: number | '';
  schoolClassId: number | '';
  sectionId: number | '';
  academicYear: string;
}

function toFormState(item: StudentClassSection | null, defaultAcademicYear: string): FormState {
  if (!item) return { studentId: '', schoolClassId: '', sectionId: '', academicYear: defaultAcademicYear };
  return {
    studentId: item.student.id,
    schoolClassId: item.schoolClass.id,
    sectionId: item.section.id,
    academicYear: item.academicYear,
  };
}

export default function StudentClassSectionFormModal({
  item,
  classes,
  students,
  academicYears,
  defaultAcademicYear,
  onClose,
  onSaved,
}: {
  item: StudentClassSection | null;
  classes: SchoolClass[];
  students: StudentAdmission[];
  academicYears: AcademicYear[];
  defaultAcademicYear: string;
  onClose: () => void;
  onSaved: (item: StudentClassSection) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(item, defaultAcademicYear));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  const isEditing = !!item;
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!form.schoolClassId) {
      setSections([]);
      return;
    }
    let cancelled = false;
    setSectionsLoading(true);
    getSections({ classId: form.schoolClassId })
      .then((result) => {
        if (!cancelled) setSections(result.sections);
      })
      .catch(() => {
        if (!cancelled) setSections([]);
      })
      .finally(() => {
        if (!cancelled) setSectionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.schoolClassId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      setError('Please select a student.');
      return;
    }
    if (!form.schoolClassId) {
      setError('Please select a class.');
      return;
    }
    if (!form.sectionId) {
      setError('Please select a section.');
      return;
    }
    if (!form.academicYear) {
      setError('Please select an academic year.');
      return;
    }

    const payload: StudentClassSectionPayload = {
      studentId: Number(form.studentId),
      classId: Number(form.schoolClassId),
      sectionId: Number(form.sectionId),
      academicYear: form.academicYear,
    };

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateStudentClassSection(item!.id, payload) : await createStudentClassSection(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} this assignment.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={UsersRound}
      title={isEditing ? 'Edit assignment' : 'Add assignment'}
      subtitle={isEditing ? "Update this student's class section." : 'Assign a student to a class section for an academic year.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="student-class-section-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="student-class-section-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField
          label="Student"
          required
          value={form.studentId}
          onChange={(e) => setField('studentId', e.target.value ? Number(e.target.value) : '')}
        >
          <option value="" disabled>
            Select a student
          </option>
          {students.map((admission) => (
            // studentId is the admission's own id, not the nested user.id —
            // same id-space lesson learned from the teacher-subject mapping
            // ("Teacher detail not found" when the login account id was sent).
            <option key={admission.id} value={admission.id}>
              {admission.user.fullName} ({admission.admissionNumber})
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Class"
          required
          value={form.schoolClassId}
          onChange={(e) => {
            setField('schoolClassId', e.target.value ? Number(e.target.value) : '');
            setField('sectionId', '');
          }}
        >
          <option value="" disabled>
            Select a class
          </option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.className}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Section"
          required
          value={form.sectionId}
          disabled={!form.schoolClassId || sectionsLoading}
          onChange={(e) => setField('sectionId', e.target.value ? Number(e.target.value) : '')}
        >
          <option value="" disabled>
            {sectionsLoading ? 'Loading sections…' : 'Select a section'}
          </option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.sectionName}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Academic year"
          required
          value={form.academicYear}
          onChange={(e) => setField('academicYear', e.target.value)}
        >
          <option value="" disabled>
            Select an academic year
          </option>
          {academicYears.map((year) => (
            <option key={year.id} value={year.yearCode}>
              {year.yearCode}
            </option>
          ))}
        </SelectField>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
