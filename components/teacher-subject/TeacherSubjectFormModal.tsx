'use client';

import { FormEvent, useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import {
  createTeacherSubjectMapping,
  updateTeacherSubjectMapping,
  type TeacherSubjectMapping,
  type TeacherSubjectMappingPayload,
} from '@/lib/teacherSubjectService';
import { getSections, type Section } from '@/lib/classSectionService';
import type { SchoolClass } from '@/lib/classService';
import type { Subject } from '@/lib/subjectService';
import type { StudentAdmission } from '@/lib/studentService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';

interface FormState {
  schoolClassId: number | '';
  sectionId: number | '';
  subjectId: number | '';
  teacherId: number | '';
}

function toFormState(item: TeacherSubjectMapping | null): FormState {
  if (!item) return { schoolClassId: '', sectionId: '', subjectId: '', teacherId: '' };
  return {
    schoolClassId: item.section.schoolClass.id,
    sectionId: item.section.id,
    subjectId: item.subject.id,
    teacherId: item.teacher.id,
  };
}

export default function TeacherSubjectFormModal({
  item,
  schoolCode,
  classes,
  subjects,
  teachers,
  onClose,
  onSaved,
}: {
  item: TeacherSubjectMapping | null;
  schoolCode: string;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: StudentAdmission[];
  onClose: () => void;
  onSaved: (item: TeacherSubjectMapping) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(item));
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
    if (!form.schoolClassId) {
      setError('Please select a class.');
      return;
    }
    if (!form.sectionId) {
      setError('Please select a section.');
      return;
    }
    if (!form.subjectId) {
      setError('Please select a subject.');
      return;
    }
    if (!form.teacherId) {
      setError('Please select a teacher.');
      return;
    }

    const payload: TeacherSubjectMappingPayload = {
      subjectId: Number(form.subjectId),
      sectionId: Number(form.sectionId),
      teacherId: Number(form.teacherId),
      schoolCode,
    };

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateTeacherSubjectMapping(item!.id, payload) : await createTeacherSubjectMapping(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} this assignment.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={UserCog}
      title={isEditing ? 'Edit assignment' : 'Add assignment'}
      subtitle={isEditing ? 'Update this teacher-subject assignment.' : 'Assign a teacher to a subject for a class section.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="teacher-subject-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="teacher-subject-form" onSubmit={handleSubmit} className="grid gap-3.5">
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
          label="Subject"
          required
          value={form.subjectId}
          onChange={(e) => setField('subjectId', e.target.value ? Number(e.target.value) : '')}
        >
          <option value="" disabled>
            Select a subject
          </option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.subjectName}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Teacher"
          required
          value={form.teacherId}
          onChange={(e) => setField('teacherId', e.target.value ? Number(e.target.value) : '')}
        >
          <option value="" disabled>
            Select a teacher
          </option>
          {teachers.map((teacher) => (
            // The mapping's teacherId is the teacher record's own id, not the
            // linked login account's user.id — confirmed by the backend
            // rejecting user.id with "Teacher detail not found".
            <option key={teacher.id} value={teacher.id}>
              {teacher.user.fullName}
            </option>
          ))}
        </SelectField>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
