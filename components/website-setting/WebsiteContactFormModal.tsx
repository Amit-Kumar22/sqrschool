'use client';

import { FormEvent, useState } from 'react';
import { Phone } from 'lucide-react';
import {
  createWebsiteContact,
  updateWebsiteContact,
  type WebsiteContact,
  type WebsiteContactPayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';

const EMPTY_FORM: WebsiteContactPayload = {
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: '',
  workingDays: '',
  workingTime: '',
};

function toFormState(item: WebsiteContact | null): WebsiteContactPayload {
  if (!item) return EMPTY_FORM;
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteContactFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteContact | null;
  onClose: () => void;
  onSaved: (item: WebsiteContact) => void;
}) {
  const [form, setForm] = useState<WebsiteContactPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteContactPayload>(key: K, value: WebsiteContactPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim() && !form.email.trim()) {
      setError('Provide at least a phone number or an email.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteContact(item!.id, form) : await createWebsiteContact(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} contact details.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Phone}
      title={isEditing ? 'Edit contact details' : 'Add contact details'}
      subtitle="Contact information shown on the public site."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-contact-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-contact-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <TextField label="Phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
          <TextField label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
        </div>
        <TextField label="Address line 1" value={form.addressLine1} onChange={(e) => setField('addressLine1', e.target.value)} />
        <TextField label="Address line 2" value={form.addressLine2} onChange={(e) => setField('addressLine2', e.target.value)} />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <TextField label="City" value={form.city} onChange={(e) => setField('city', e.target.value)} />
          <TextField label="State" value={form.state} onChange={(e) => setField('state', e.target.value)} />
          <TextField label="Pincode" value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} />
          <TextField label="Country" value={form.country} onChange={(e) => setField('country', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <TextField label="Working days" value={form.workingDays} onChange={(e) => setField('workingDays', e.target.value)} placeholder="e.g. Mon - Sat" />
          <TextField label="Working time" value={form.workingTime} onChange={(e) => setField('workingTime', e.target.value)} placeholder="e.g. 8:00 AM - 4:00 PM" />
        </div>
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
