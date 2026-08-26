'use client';

import { FormEvent, useState } from 'react';
import { Trophy } from 'lucide-react';
import {
  createWebsiteTopper,
  updateWebsiteTopper,
  type WebsiteTopper,
  type WebsiteTopperPayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/FormField';

function toFormState(item: WebsiteTopper | null): WebsiteTopperPayload {
  if (!item) {
    return { rank: 1, name: '', photoUrl: '', percentage: 0, stream: '', session: '', active: true };
  }
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteTopperFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteTopper | null;
  onClose: () => void;
  onSaved: (item: WebsiteTopper) => void;
}) {
  const [form, setForm] = useState<WebsiteTopperPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteTopperPayload>(key: K, value: WebsiteTopperPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteTopper(item!.id, form) : await createWebsiteTopper(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} topper.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Trophy}
      title={isEditing ? 'Edit topper' : 'Add topper'}
      subtitle="A student result showcased on the homepage."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-topper-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-topper-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <TextField label="Name" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
          <TextField label="Rank" type="number" min={1} value={form.rank} onChange={(e) => setField('rank', Number(e.target.value))} />
        </div>
        <TextField label="Photo URL" value={form.photoUrl} onChange={(e) => setField('photoUrl', e.target.value)} />
        <div className="grid grid-cols-3 gap-3.5">
          <TextField
            label="Percentage"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={form.percentage}
            onChange={(e) => setField('percentage', Number(e.target.value))}
          />
          <TextField label="Stream" value={form.stream} onChange={(e) => setField('stream', e.target.value)} />
          <TextField label="Session" value={form.session} onChange={(e) => setField('session', e.target.value)} placeholder="e.g. 2025-26" />
        </div>
        <CheckboxField label="Active" checked={form.active} onChange={(e) => setField('active', e.target.checked)} />
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
