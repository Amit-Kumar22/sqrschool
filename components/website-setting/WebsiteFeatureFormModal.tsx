'use client';

import { FormEvent, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  createWebsiteFeature,
  updateWebsiteFeature,
  type WebsiteFeature,
  type WebsiteFeaturePayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextareaField, TextField } from '@/components/ui/FormField';

function toFormState(item: WebsiteFeature | null): WebsiteFeaturePayload {
  if (!item) return { icon: '', title: '', description: '', displayOrder: 0, active: true };
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteFeatureFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteFeature | null;
  onClose: () => void;
  onSaved: (item: WebsiteFeature) => void;
}) {
  const [form, setForm] = useState<WebsiteFeaturePayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteFeaturePayload>(key: K, value: WebsiteFeaturePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteFeature(item!.id, form) : await createWebsiteFeature(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} feature.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Sparkles}
      title={isEditing ? 'Edit feature' : 'Add feature'}
      subtitle="A highlighted feature shown on the homepage."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-feature-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-feature-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <TextField label="Icon" hint="Icon name/class used by the site" value={form.icon} onChange={(e) => setField('icon', e.target.value)} />
          <TextField
            label="Display order"
            type="number"
            value={form.displayOrder}
            onChange={(e) => setField('displayOrder', Number(e.target.value))}
          />
        </div>
        <TextField label="Title" required value={form.title} onChange={(e) => setField('title', e.target.value)} />
        <TextareaField label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} rows={2} />
        <CheckboxField label="Active" checked={form.active} onChange={(e) => setField('active', e.target.checked)} />
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
