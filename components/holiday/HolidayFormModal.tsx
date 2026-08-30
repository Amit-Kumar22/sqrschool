'use client';

import { FormEvent, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import {
  createHoliday,
  updateHoliday,
  type Holiday,
  type HolidayPayload,
} from '@/lib/holidayService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextField, TextareaField, CheckboxField } from '@/components/ui/FormField';

function toFormState(item: Holiday | null): HolidayPayload {
  if (!item) return { holidayName: '', holidayDate: '', description: '', validHolidayRequest: true };
  return {
    holidayName: item.holidayName,
    holidayDate: item.holidayDate,
    description: item.description,
    validHolidayRequest: item.active,
  };
}

export default function HolidayFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: Holiday | null;
  onClose: () => void;
  onSaved: (item: Holiday) => void;
}) {
  const [form, setForm] = useState<HolidayPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = (key: keyof HolidayPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.holidayName.trim() || !form.holidayDate) {
      setError('Holiday name and date are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateHoliday(item!.id, form) : await createHoliday(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} holiday.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={CalendarDays}
      title={isEditing ? `Edit "${item!.holidayName}"` : 'Add holiday'}
      subtitle={isEditing ? 'Update this holiday.' : 'Add a new holiday to the school calendar.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="holiday-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="holiday-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextField
          label="Holiday name"
          required
          value={form.holidayName}
          onChange={(e) => setField('holidayName', e.target.value)}
        />
        <TextField
          label="Date"
          type="date"
          required
          value={form.holidayDate}
          onChange={(e) => setField('holidayDate', e.target.value)}
        />
        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={2}
        />
        <CheckboxField
          label="Active"
          checked={form.validHolidayRequest}
          onChange={(e) => setForm((f) => ({ ...f, validHolidayRequest: e.target.checked }))}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
