'use client';

import { FormEvent, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  createWebsiteFloatingSetting,
  updateWebsiteFloatingSetting,
  type WebsiteFloatingSetting,
  type WebsiteFloatingSettingPayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextareaField, TextField } from '@/components/ui/FormField';

const EMPTY_FORM: WebsiteFloatingSettingPayload = {
  backToTopEnabled: true,
  whatsappEnabled: true,
  whatsappPhone: '',
  whatsappMessage: '',
  quickEnquiryEnabled: true,
  quickEnquiryLabel: '',
  quickEnquiryUrl: '',
};

function toFormState(item: WebsiteFloatingSetting | null): WebsiteFloatingSettingPayload {
  if (!item) return EMPTY_FORM;
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteFloatingSettingFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteFloatingSetting | null;
  onClose: () => void;
  onSaved: (item: WebsiteFloatingSetting) => void;
}) {
  const [form, setForm] = useState<WebsiteFloatingSettingPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteFloatingSettingPayload>(key: K, value: WebsiteFloatingSettingPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = isEditing
        ? await updateWebsiteFloatingSetting(item!.id, form)
        : await createWebsiteFloatingSetting(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} floating widget settings.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={SlidersHorizontal}
      title={isEditing ? 'Edit floating widgets' : 'Add floating widgets'}
      subtitle="Back-to-top, WhatsApp and quick-enquiry floating buttons."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-floating-setting-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-floating-setting-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <CheckboxField
          label="Back-to-top button"
          checked={form.backToTopEnabled}
          onChange={(e) => setField('backToTopEnabled', e.target.checked)}
        />

        <div className="rounded-lg border border-slate-200 p-3">
          <CheckboxField
            label="WhatsApp button"
            checked={form.whatsappEnabled}
            onChange={(e) => setField('whatsappEnabled', e.target.checked)}
          />
          <div className="mt-3 grid gap-3">
            <TextField
              label="WhatsApp phone"
              value={form.whatsappPhone}
              onChange={(e) => setField('whatsappPhone', e.target.value)}
              placeholder="e.g. +91XXXXXXXXXX"
            />
            <TextareaField
              label="WhatsApp message"
              value={form.whatsappMessage}
              onChange={(e) => setField('whatsappMessage', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <CheckboxField
            label="Quick enquiry button"
            checked={form.quickEnquiryEnabled}
            onChange={(e) => setField('quickEnquiryEnabled', e.target.checked)}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <TextField label="Label" value={form.quickEnquiryLabel} onChange={(e) => setField('quickEnquiryLabel', e.target.value)} />
            <TextField label="URL" value={form.quickEnquiryUrl} onChange={(e) => setField('quickEnquiryUrl', e.target.value)} />
          </div>
        </div>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
