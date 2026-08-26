'use client';

import { FormEvent, useState } from 'react';
import { ListChecks } from 'lucide-react';
import {
  createWebsiteWhyChoosePoint,
  updateWebsiteWhyChoosePoint,
  type WebsiteWhyChoosePoint,
  type WebsiteWhyChoosePointPayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextareaField, TextField } from '@/components/ui/FormField';

function toFormState(item: WebsiteWhyChoosePoint | null): WebsiteWhyChoosePointPayload {
  if (!item) return { point: '', displayOrder: 0, active: true };
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteWhyChoosePointFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteWhyChoosePoint | null;
  onClose: () => void;
  onSaved: (item: WebsiteWhyChoosePoint) => void;
}) {
  const [form, setForm] = useState<WebsiteWhyChoosePointPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteWhyChoosePointPayload>(key: K, value: WebsiteWhyChoosePointPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.point.trim()) {
      setError('Point text is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing
        ? await updateWebsiteWhyChoosePoint(item!.id, form)
        : await createWebsiteWhyChoosePoint(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} point.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={ListChecks}
      title={isEditing ? 'Edit point' : 'Add point'}
      subtitle="A reason shown in the 'Why choose us' section."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-why-choose-point-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-why-choose-point-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextareaField label="Point" required value={form.point} onChange={(e) => setField('point', e.target.value)} rows={2} />
        <TextField
          label="Display order"
          type="number"
          value={form.displayOrder}
          onChange={(e) => setField('displayOrder', Number(e.target.value))}
        />
        <CheckboxField label="Active" checked={form.active} onChange={(e) => setField('active', e.target.checked)} />
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
