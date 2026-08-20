'use client';

import { FormEvent, useState } from 'react';
import { Bot } from 'lucide-react';
import {
  createChatbotEntry,
  updateChatbotEntry,
  type ChatbotEntry,
  type ChatbotEntryPayload,
} from '@/lib/chatbotService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextField, TextareaField } from '@/components/ui/FormField';

const EMPTY_FORM: ChatbotEntryPayload = {
  keyword: '',
  answer: '',
  active: true,
};

function toFormState(item: ChatbotEntry | null): ChatbotEntryPayload {
  if (!item) return EMPTY_FORM;
  const { id: _id, ...rest } = item;
  return rest;
}

export default function ChatbotFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: ChatbotEntry | null;
  onClose: () => void;
  onSaved: (item: ChatbotEntry) => void;
}) {
  const [form, setForm] = useState<ChatbotEntryPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = (key: keyof Omit<ChatbotEntryPayload, 'active'>, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.keyword.trim() || !form.answer.trim()) {
      setError('Keyword and answer are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateChatbotEntry(item!.id, form) : await createChatbotEntry(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} chatbot entry.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Bot}
      title={isEditing ? 'Edit chatbot entry' : 'Add chatbot entry'}
      subtitle={isEditing ? 'Update this keyword/answer pair.' : 'Create a new keyword/answer pair for the chatbot.'}
      size="md"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="chatbot-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="chatbot-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextField label="Keyword" required value={form.keyword} onChange={(e) => setField('keyword', e.target.value)} />

        <TextareaField
          label="Answer"
          required
          value={form.answer}
          onChange={(e) => setField('answer', e.target.value)}
          rows={4}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
          />
          <span className="font-medium text-slate-900">Active</span>
        </label>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
