'use client';

import { FormEvent, useState } from 'react';
import { PanelTop } from 'lucide-react';
import {
  createWebsiteHeader,
  updateWebsiteHeader,
  type WebsiteHeader,
  type WebsiteHeaderPayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/FormField';

function toFormState(item: WebsiteHeader | null): WebsiteHeaderPayload {
  if (!item) {
    return { logoUrl: '', logoAlt: '', mobileMenuEnabled: true, ctaLabel: '', ctaUrl: '' };
  }
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteHeaderFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteHeader | null;
  onClose: () => void;
  onSaved: (item: WebsiteHeader) => void;
}) {
  const [form, setForm] = useState<WebsiteHeaderPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteHeaderPayload>(key: K, value: WebsiteHeaderPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.logoUrl.trim()) {
      setError('Logo URL is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteHeader(item!.id, form) : await createWebsiteHeader(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} header.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={PanelTop}
      title={isEditing ? 'Edit header' : 'Add header'}
      subtitle="Site logo and top navigation call-to-action."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-header-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-header-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextField label="Logo URL" required value={form.logoUrl} onChange={(e) => setField('logoUrl', e.target.value)} />
        <TextField label="Logo alt text" value={form.logoAlt} onChange={(e) => setField('logoAlt', e.target.value)} />
        <div className="grid grid-cols-2 gap-3.5">
          <TextField label="CTA label" value={form.ctaLabel} onChange={(e) => setField('ctaLabel', e.target.value)} />
          <TextField label="CTA URL" value={form.ctaUrl} onChange={(e) => setField('ctaUrl', e.target.value)} />
        </div>
        <CheckboxField
          label="Mobile menu enabled"
          checked={form.mobileMenuEnabled}
          onChange={(e) => setField('mobileMenuEnabled', e.target.checked)}
        />
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
