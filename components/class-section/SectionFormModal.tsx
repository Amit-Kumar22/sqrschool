'use client';

import { FormEvent, useState } from 'react';
import { Layers } from 'lucide-react';
import { createSection, updateSection, type Section, type SectionPayload } from '@/lib/classSectionService';
import type { SchoolClass } from '@/lib/classService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

function toFormState(item: Section | null, defaultClassId: number | ''): SectionPayload {
  return { classId: (defaultClassId || 0) as number, sectionName: item?.sectionName ?? '' };
}

export default function SectionFormModal({
  item,
  classes,
  defaultClassId,
  onClose,
  onSaved,
}: {
  item: Section | null;
  classes: SchoolClass[];
  defaultClassId: number | '';
  onClose: () => void;
  onSaved: (item: Section) => void;
}) {
  const [form, setForm] = useState<SectionPayload>(() => toFormState(item, defaultClassId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.classId) {
      setError('Please select a class.');
      return;
    }
    if (!form.sectionName.trim()) {
      setError('Section name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateSection(item!.id, form) : await createSection(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} section.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Layers}
      title={isEditing ? `Edit ${item!.sectionName}` : 'Add section'}
      subtitle={isEditing ? 'Update this section.' : 'Create a new section for a class.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="section-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="section-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField
          label="Class"
          required
          value={form.classId || ''}
          onChange={(e) => setForm((f) => ({ ...f, classId: Number(e.target.value) }))}
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

        <TextField
          label="Section name"
          required
          value={form.sectionName}
          placeholder="e.g. A"
          onChange={(e) => setForm((f) => ({ ...f, sectionName: e.target.value }))}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
