'use client';

import { FormEvent, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import {
  createAcademicYear,
  updateAcademicYear,
  type AcademicYear,
  type AcademicYearPayload,
} from '@/lib/academicYearService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextField, TextareaField } from '@/components/ui/FormField';

function toFormState(item: AcademicYear | null): AcademicYearPayload {
  if (!item) return { startDate: '', endDate: '', description: '' };
  return {
    startDate: item.startDate,
    endDate: item.endDate,
    description: item.description,
  };
}

export default function AcademicYearFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: AcademicYear | null;
  onClose: () => void;
  onSaved: (item: AcademicYear) => void;
}) {
  const [form, setForm] = useState<AcademicYearPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = (key: keyof AcademicYearPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      setError('Start and end date are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('End date cannot be before the start date.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateAcademicYear(item!.id, form) : await createAcademicYear(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} academic year.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={CalendarRange}
      title={isEditing ? `Edit ${item!.yearCode}` : 'Add academic year'}
      subtitle={isEditing ? 'Update this academic year.' : 'Create a new academic year term for a school.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="academic-year-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="academic-year-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <TextField
            label="Start date"
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setField('startDate', e.target.value)}
          />
          <TextField
            label="End date"
            type="date"
            required
            value={form.endDate}
            onChange={(e) => setField('endDate', e.target.value)}
          />
        </div>

        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={2}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
