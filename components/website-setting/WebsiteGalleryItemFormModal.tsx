'use client';

import { FormEvent, useState } from 'react';
import { Images } from 'lucide-react';
import {
  createWebsiteGalleryItem,
  updateWebsiteGalleryItem,
  type WebsiteGalleryItem,
  type WebsiteGalleryItemPayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/FormField';

const TYPE_SUGGESTIONS = ['IMAGE', 'VIDEO'];

function toFormState(item: WebsiteGalleryItem | null): WebsiteGalleryItemPayload {
  if (!item) {
    return { title: '', category: '', imageUrl: '', type: 'IMAGE', displayOrder: 0, active: true };
  }
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteGalleryItemFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteGalleryItem | null;
  onClose: () => void;
  onSaved: (item: WebsiteGalleryItem) => void;
}) {
  const [form, setForm] = useState<WebsiteGalleryItemPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteGalleryItemPayload>(key: K, value: WebsiteGalleryItemPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.imageUrl.trim()) {
      setError('Image URL is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteGalleryItem(item!.id, form) : await createWebsiteGalleryItem(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} gallery item.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Images}
      title={isEditing ? 'Edit gallery item' : 'Add gallery item'}
      subtitle="A media item shown in the site gallery."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-gallery-item-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-gallery-item-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextField label="Title" required value={form.title} onChange={(e) => setField('title', e.target.value)} />
        <TextField label="Image/Video URL" required value={form.imageUrl} onChange={(e) => setField('imageUrl', e.target.value)} />
        <div className="grid grid-cols-3 gap-3.5">
          <TextField label="Category" value={form.category} onChange={(e) => setField('category', e.target.value)} />
          <TextField label="Type" list="website-gallery-type-options" value={form.type} onChange={(e) => setField('type', e.target.value)} />
          <TextField
            label="Display order"
            type="number"
            value={form.displayOrder}
            onChange={(e) => setField('displayOrder', Number(e.target.value))}
          />
        </div>
        <datalist id="website-gallery-type-options">
          {TYPE_SUGGESTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <CheckboxField label="Active" checked={form.active} onChange={(e) => setField('active', e.target.checked)} />
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
