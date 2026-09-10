'use client';

import { FormEvent, useState } from 'react';
import { UserCog } from 'lucide-react';
import { assignClassTeacher } from '@/lib/classService';
import type { SchoolClass } from '@/lib/classService';
import type { TeacherStaffMember } from '@/lib/schoolService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';

export default function AssignTeacherModal({
  schoolClass,
  teachers,
  onClose,
  onAssigned,
}: {
  schoolClass: SchoolClass;
  teachers: TeacherStaffMember[];
  onClose: () => void;
  onAssigned: (teacherId: number) => void;
}) {
  const [teacherId, setTeacherId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teacherId) {
      setError('Please select a teacher.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await assignClassTeacher(schoolClass.id, Number(teacherId));
      onAssigned(Number(teacherId));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not assign this teacher.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={UserCog}
      title="Assign class teacher"
      subtitle={`For "${schoolClass.className}"`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="assign-teacher-form" loading={saving}>
            Assign
          </Button>
        </>
      }
    >
      <form id="assign-teacher-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField label="Teacher" required value={teacherId} onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : '')}>
          <option value="" disabled>
            {teachers.length === 0 ? 'No teachers available' : 'Select a teacher'}
          </option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.teacherUser.fullName}
              {teacher.employeeCode ? ` (${teacher.employeeCode})` : ''}
            </option>
          ))}
        </SelectField>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
