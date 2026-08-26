'use client';

import { FormEvent, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  createWebsiteStatistic,
  updateWebsiteStatistic,
  type WebsiteStatistic,
  type WebsiteStatisticPayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/FormField';

function toFormState(item: WebsiteStatistic | null): WebsiteStatisticPayload {
  if (!item) return { icon: '', number: '', label: '', displayOrder: 0, active: true };
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteStatisticFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteStatistic | null;
  onClose: () => void;
  onSaved: (item: WebsiteStatistic) => void;
}) {
  const [form, setForm] = useState<WebsiteStatisticPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteStatisticPayload>(key: K, value: WebsiteStatisticPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) {
      setError('Label is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteStatistic(item!.id, form) : await createWebsiteStatistic(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} statistic.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={BarChart3}
      title={isEditing ? 'Edit statistic' : 'Add statistic'}
      subtitle="A counter shown in the homepage statistics band."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-statistic-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-statistic-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <TextField label="Icon" hint="Icon name/class used by the site" value={form.icon} onChange={(e) => setField('icon', e.target.value)} />
          <TextField label="Number" required value={form.number} onChange={(e) => setField('number', e.target.value)} placeholder="e.g. 1200+" />
        </div>
        <TextField label="Label" required value={form.label} onChange={(e) => setField('label', e.target.value)} />
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
