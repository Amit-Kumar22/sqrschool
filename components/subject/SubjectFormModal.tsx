'use client';

import { FormEvent, useState } from 'react';
import { BookMarked } from 'lucide-react';
import { createSubject, updateSubject, type Subject, type SubjectPayload } from '@/lib/subjectService';
import type { School } from '@/lib/schoolService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

function toFormState(item: Subject | null, schoolCode: string): SubjectPayload {
  return { schoolCode, subjectName: item?.subjectName ?? '', subjectCode: item?.subjectCode ?? '' };
}

export default function SubjectFormModal({
  item,
  schoolCode,
  schools,
  onClose,
  onSaved,
}: {
  item: Subject | null;
  /** The account's own school — auto-fills and hides the school field when set. */
  schoolCode: string;
  /** Only needed (and only shown) when schoolCode is empty — lets the admin pick which school this subject belongs to. */
  schools?: School[];
  onClose: () => void;
  onSaved: (item: Subject) => void;
}) {
  const [form, setForm] = useState<SubjectPayload>(() => toFormState(item, schoolCode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const needsSchoolPicker = !schoolCode;
  const setField = (key: keyof SubjectPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (needsSchoolPicker && !form.schoolCode) {
      setError('Please select a school.');
      return;
    }
    if (!form.subjectName.trim()) {
      setError('Subject name is required.');
      return;
    }
    if (!form.subjectCode.trim()) {
      setError('Subject code is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateSubject(item!.id, form) : await createSubject(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} subject.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={BookMarked}
      title={isEditing ? `Edit ${item!.subjectName}` : 'Add subject'}
      subtitle={isEditing ? 'Update this subject.' : 'Create a new subject for a school.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="subject-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit} className="grid gap-3.5">
        {needsSchoolPicker && (
          <SelectField
            label="School"
            required
            value={form.schoolCode}
            onChange={(e) => setField('schoolCode', e.target.value)}
          >
            <option value="" disabled>
              Select a school
            </option>
            {(schools ?? []).map((school) => (
              <option key={school.id} value={school.schoolCode}>
                {school.schoolName} ({school.schoolCode})
              </option>
            ))}
          </SelectField>
        )}

        <TextField
          label="Subject name"
          required
          value={form.subjectName}
          placeholder="e.g. Mathematics"
          onChange={(e) => setField('subjectName', e.target.value)}
        />

        <TextField
          label="Subject code"
          required
          value={form.subjectCode}
          placeholder="e.g. MATH101"
          onChange={(e) => setField('subjectCode', e.target.value)}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
