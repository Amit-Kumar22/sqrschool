'use client';

import { FormEvent, useState } from 'react';
import { LayoutPanelTop } from 'lucide-react';
import {
  createWebsiteSection,
  updateWebsiteSection,
  type WebsiteSection,
  type WebsiteSectionPayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextareaField, TextField } from '@/components/ui/FormField';

const SECTION_TYPE_SUGGESTIONS = [
  'ANNOUNCEMENT',
  'HERO',
  'ABOUT',
  'FEATURES',
  'STATISTICS',
  'WHY_CHOOSE_US',
  'GALLERY',
  'TESTIMONIALS',
  'TOPPERS',
  'CONTACT',
  'FOOTER',
];

function toFormState(item: WebsiteSection | null): WebsiteSectionPayload {
  if (!item) {
    return { sectionType: '', enabled: true, displayOrder: 0, eyebrow: '', title: '', description: '' };
  }
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteSectionFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteSection | null;
  onClose: () => void;
  onSaved: (item: WebsiteSection) => void;
}) {
  const [form, setForm] = useState<WebsiteSectionPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteSectionPayload>(key: K, value: WebsiteSectionPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.sectionType.trim()) {
      setError('Section type is required.');
      return;
    }
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteSection(item!.id, form) : await createWebsiteSection(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} section.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={LayoutPanelTop}
      title={isEditing ? 'Edit section' : 'Add section'}
      subtitle="A content section on the public site."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-section-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-section-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <TextField
            label="Section type"
            required
            list="website-section-type-options"
            value={form.sectionType}
            onChange={(e) => setField('sectionType', e.target.value)}
          />
          <TextField
            label="Display order"
            type="number"
            value={form.displayOrder}
            onChange={(e) => setField('displayOrder', Number(e.target.value))}
          />
        </div>
        <datalist id="website-section-type-options">
          {SECTION_TYPE_SUGGESTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <TextField label="Eyebrow" value={form.eyebrow} onChange={(e) => setField('eyebrow', e.target.value)} />
        <TextField label="Title" required value={form.title} onChange={(e) => setField('title', e.target.value)} />
        <TextareaField label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} rows={2} />
        <CheckboxField label="Enabled" checked={form.enabled} onChange={(e) => setField('enabled', e.target.checked)} />
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
