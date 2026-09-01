'use client';

import { FormEvent, useState } from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  createWeeklyTimetableEntry,
  deleteWeeklyTimetableEntry,
  formatTime,
  updateWeeklyTimetableEntry,
  type DayOfWeek,
  type Period,
  type WeeklyTimetableEntry,
  type WeeklyTimetablePayload,
} from '@/lib/timetableService';
import type { Subject } from '@/lib/subjectService';
import type { TeacherStaffMember } from '@/lib/schoolService';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextareaField } from '@/components/ui/FormField';

const dayLabel = (day: DayOfWeek) => day.charAt(0) + day.slice(1).toLowerCase();

function toFormState(item: WeeklyTimetableEntry | null) {
  return {
    subjectId: item?.subjectId ?? 0,
    teacherId: item?.teacherId ?? 0,
    remarks: item?.remarks ?? '',
  };
}

export default function AssignmentFormModal({
  period,
  dayOfWeek,
  item,
  subjects = [],
  teachers = [],
  classId,
  onClose,
  onSaved,
  onDeleted,
}: {
  period: Period;
  dayOfWeek: DayOfWeek;
  item: WeeklyTimetableEntry | null;
  subjects: Subject[];
  teachers: TeacherStaffMember[];
  /** Only teachers assigned to this class are offered — an unassigned teacher can't be scheduled for it. */
  classId: number;
  onClose: () => void;
  onSaved: (item: WeeklyTimetableEntry) => void;
  onDeleted: (id: number) => void;
}) {
  const [form, setForm] = useState(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const classTeachers = teachers.filter((teacher) => teacher.assignedClasses.some((cls) => cls.id === classId));
  // Narrowed to the chosen subject — a teacher assigned to this class but
  // teaching a different subject can't be scheduled for this period.
  const availableTeachers = form.subjectId ? classTeachers.filter((teacher) => teacher.subject?.id === form.subjectId) : [];
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Changing the subject can invalidate the previously picked teacher (they
  // may not teach the new subject), so the teacher selection resets with it.
  const handleSubjectChange = (subjectId: number) => setForm((f) => ({ ...f, subjectId, teacherId: 0 }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) {
      setError('Please select a subject.');
      return;
    }
    if (!form.teacherId) {
      setError('Please select a teacher.');
      return;
    }

    const payload: WeeklyTimetablePayload = {
      periodId: period.id,
      dayOfWeek,
      subjectId: form.subjectId,
      teacherId: form.teacherId,
      remarks: form.remarks,
    };

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWeeklyTimetableEntry(item!.id, payload) : await createWeeklyTimetableEntry(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} this period.`));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm('Remove this subject from the timetable?')) return;
    setDeleting(true);
    setError('');
    try {
      await deleteWeeklyTimetableEntry(item.id);
      onDeleted(item.id);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove this assignment.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      icon={BookOpen}
      title={isEditing ? 'Edit period' : 'Assign subject'}
      subtitle={`${dayLabel(dayOfWeek)} · ${period.name} · ${formatTime(period.startTime)} – ${formatTime(period.endTime)}`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          {isEditing && (
            <IconButton
              icon={Trash2}
              label="Remove"
              variant="danger"
              loading={deleting}
              onClick={handleDelete}
              className="mr-auto"
            />
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="assignment-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Assign'}
          </Button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField
          label="Subject"
          required
          disabled={subjects.length === 0}
          value={form.subjectId || ''}
          onChange={(e) => handleSubjectChange(Number(e.target.value))}
        >
          <option value="" disabled>
            {subjects.length === 0 ? 'No subjects available' : 'Select a subject'}
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
          disabled={availableTeachers.length === 0}
          value={form.teacherId || ''}
          onChange={(e) => setField('teacherId', Number(e.target.value))}
        >
          <option value="" disabled>
            {!form.subjectId
              ? 'Select a subject first'
              : availableTeachers.length === 0
                ? 'No teachers for this subject in this class'
                : 'Select a teacher'}
          </option>
          {availableTeachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.subject ? `${teacher.teacherUser.fullName} (${teacher.subject.subjectName})` : teacher.teacherUser.fullName}
            </option>
          ))}
        </SelectField>

        <TextareaField
          label="Remarks"
          rows={2}
          value={form.remarks}
          onChange={(e) => setField('remarks', e.target.value)}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
