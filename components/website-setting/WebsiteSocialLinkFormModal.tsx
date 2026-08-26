'use client';

import { FormEvent, useState } from 'react';
import { Share2 } from 'lucide-react';
import {
  createWebsiteSocialLink,
  updateWebsiteSocialLink,
  type WebsiteSocialLink,
  type WebsiteSocialLinkPayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/FormField';

const PLATFORM_SUGGESTIONS = ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'YOUTUBE', 'LINKEDIN', 'WHATSAPP'];

function toFormState(item: WebsiteSocialLink | null): WebsiteSocialLinkPayload {
  if (!item) return { platform: '', url: '', active: true, displayOrder: 0 };
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteSocialLinkFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteSocialLink | null;
  onClose: () => void;
  onSaved: (item: WebsiteSocialLink) => void;
}) {
  const [form, setForm] = useState<WebsiteSocialLinkPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteSocialLinkPayload>(key: K, value: WebsiteSocialLinkPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.platform.trim()) {
      setError('Platform is required.');
      return;
    }
    if (!form.url.trim()) {
      setError('URL is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteSocialLink(item!.id, form) : await createWebsiteSocialLink(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} social link.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Share2}
      title={isEditing ? 'Edit social link' : 'Add social link'}
      subtitle="A social media link shown in the site footer/header."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-social-link-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-social-link-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextField
          label="Platform"
          required
          list="website-social-platform-options"
          value={form.platform}
          onChange={(e) => setField('platform', e.target.value)}
        />
        <datalist id="website-social-platform-options">
          {PLATFORM_SUGGESTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <TextField label="URL" required value={form.url} onChange={(e) => setField('url', e.target.value)} />
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
