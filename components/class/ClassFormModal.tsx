'use client';

import { FormEvent, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { createClass, updateClass, type ClassPayload, type SchoolClass } from '@/lib/classService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextareaField, TextField } from '@/components/ui/FormField';

function toFormState(item: SchoolClass | null): ClassPayload {
  return { className: item?.className ?? '', description: item?.description ?? '' };
}

export default function ClassFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: SchoolClass | null;
  onClose: () => void;
  onSaved: (item: SchoolClass) => void;
}) {
  const [form, setForm] = useState<ClassPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = (key: keyof ClassPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
        <TextField
          label="Class name"
          required
          value={form.className}
          placeholder="e.g. Class 5"
          onChange={(e) => setField('className', e.target.value)}
        />

        <TextareaField
          label="Description"
          value={form.description}
          placeholder="Optional notes about this class"
          rows={2}
          onChange={(e) => setField('description', e.target.value)}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
