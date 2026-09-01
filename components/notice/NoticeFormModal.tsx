'use client';

import { FormEvent, useState } from 'react';
import { Megaphone } from 'lucide-react';
import {
  createNotice,
  updateNotice,
  type Notice,
  type NoticeAudience,
  type NoticePayload,
  type NoticePriority,
  type NoticeStatus,
} from '@/lib/noticeService';
import { fromDateInput, toDateInput } from '@/lib/dateUtils';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';

const AUDIENCE_OPTIONS: NoticeAudience[] = ['ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
const PRIORITY_OPTIONS: NoticePriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const STATUS_OPTIONS: NoticeStatus[] = ['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'];

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

interface NoticeFormState {
  title: string;
  content: string;
  audience: NoticeAudience;
  priority: NoticePriority;
  status: NoticeStatus;
  publishDate: string;
  expiryDate: string;
  attachmentUrl: string;
  attachmentName: string;
  remarks: string;
}

function toFormState(item: Notice | null): NoticeFormState {
  if (!item) {
    return {
      title: '',
      content: '',
      audience: 'ALL',
      priority: 'LOW',
      status: 'DRAFT',
      publishDate: '',
      expiryDate: '',
      attachmentUrl: '',
      attachmentName: '',
      remarks: '',
    };
  }
  return {
    title: item.title,
    content: item.content,
    audience: item.audience,
    priority: item.priority,
    status: item.status,
    publishDate: toDateInput(item.publishDate),
    expiryDate: toDateInput(item.expiryDate),
    attachmentUrl: item.attachmentUrl ?? '',
    attachmentName: item.attachmentName ?? '',
    remarks: item.remarks ?? '',
  };
}

export default function NoticeFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: Notice | null;
  onClose: () => void;
  onSaved: (item: Notice) => void;
}) {
  const [form, setForm] = useState<NoticeFormState>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof NoticeFormState>(key: K, value: NoticeFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!form.content.trim()) {
      setError('Please enter the notice content.');
      return;
    }
    if (!form.publishDate) {
      setError('Please select a publish date.');
      return;
    }

    const payload: NoticePayload = {
      title: form.title.trim(),
      content: form.content.trim(),
      audience: form.audience,
      priority: form.priority,
      status: form.status,
      publishDate: fromDateInput(form.publishDate),
      expiryDate: fromDateInput(form.expiryDate),
      attachmentUrl: form.attachmentUrl.trim(),
      attachmentName: form.attachmentName.trim(),
      remarks: form.remarks.trim(),
    };

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateNotice(item!.id, payload) : await createNotice(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} notice.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Megaphone}
      title={isEditing ? 'Edit notice' : 'New notice'}
      subtitle={isEditing ? 'Update this announcement.' : 'Post a new announcement to the notice board.'}
      size="md"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="notice-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Publish'}
          </Button>
        </>
      }
    >
      <form id="notice-form" onSubmit={handleSubmit} className="grid gap-3">
        <TextField
          label="Title"
          required
          placeholder="e.g. Change in School Timings"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />

        <TextareaField
          label="Content"
          required
          placeholder="Write the announcement details…"
          value={form.content}
          onChange={(e) => setField('content', e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Audience" value={form.audience} onChange={(e) => setField('audience', e.target.value as NoticeAudience)}>
            {AUDIENCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatEnumLabel(option)}
              </option>
            ))}
          </SelectField>

          <SelectField label="Priority" value={form.priority} onChange={(e) => setField('priority', e.target.value as NoticePriority)}>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatEnumLabel(option)}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Status" value={form.status} onChange={(e) => setField('status', e.target.value as NoticeStatus)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatEnumLabel(option)}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Publish date"
            type="date"
            required
            value={form.publishDate}
            onChange={(e) => setField('publishDate', e.target.value)}
          />

          <TextField
            label="Expiry date"
            type="date"
            value={form.expiryDate}
            onChange={(e) => setField('expiryDate', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Attachment URL"
            placeholder="Optional"
            value={form.attachmentUrl}
            onChange={(e) => setField('attachmentUrl', e.target.value)}
          />

          <TextField
            label="Attachment name"
            placeholder="Optional"
            value={form.attachmentName}
            onChange={(e) => setField('attachmentName', e.target.value)}
          />
        </div>

        <TextareaField
          label="Remarks"
          placeholder="Optional internal note"
          value={form.remarks}
          onChange={(e) => setField('remarks', e.target.value)}
          rows={2}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
