'use client';

import { FormEvent, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { createClass, updateClass, type ClassPayload, type SchoolClass } from '@/lib/classService';
import type { School } from '@/lib/schoolService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

function toFormState(item: SchoolClass | null, schoolCode: string): ClassPayload {
  return { schoolCode, className: item?.className ?? '' };
}

export default function ClassFormModal({
  item,
  schoolCode,
  schools,
  onClose,
  onSaved,
}: {
  item: SchoolClass | null;
  /** The account's own school — auto-fills and hides the school field when set. */
  schoolCode: string;
  /** Only needed (and only shown) when schoolCode is empty — lets the admin pick which school this class belongs to. */
  schools?: School[];
  onClose: () => void;
  onSaved: (item: SchoolClass) => void;
}) {
  const [form, setForm] = useState<ClassPayload>(() => toFormState(item, schoolCode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const needsSchoolPicker = !schoolCode;
  const setField = (key: keyof ClassPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (needsSchoolPicker && !form.schoolCode) {
      setError('Please select a school.');
      return;
    }
    if (!form.className.trim()) {
      setError('Class name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateClass(item!.id, form) : await createClass(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} class.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={BookOpen}
      title={isEditing ? `Edit ${item!.className}` : 'Add class'}
      subtitle={isEditing ? 'Update this class.' : 'Create a new class for a school.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="class-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="class-form" onSubmit={handleSubmit} className="grid gap-3.5">
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
          label="Class name"
          required
          value={form.className}
          placeholder="e.g. Class 5"
          onChange={(e) => setField('className', e.target.value)}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
