'use client';

import { FormEvent, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { addDailyHomework, type Homework } from '@/lib/homeworkService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextareaField, TextField } from '@/components/ui/FormField';

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AddDailyNoteModal({
  homework,
  onClose,
  onSaved,
}: {
  homework: Homework;
  onClose: () => void;
  onSaved: (item: Homework) => void;
}) {
  const [homeworkDate, setHomeworkDate] = useState(todayIso());
  const [questionsText, setQuestionsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const questions = questionsText
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);
    if (!homeworkDate) {
      setError('Please pick a date.');
      return;
    }
    if (questions.length === 0) {
      setError('Add at least one question.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = await addDailyHomework({ homeworkId: homework.id, homeworkDate, questions });
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to add this daily note.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={CalendarPlus}
      title="Add daily note"
      subtitle={`${homework.subjectName} — ${homework.className}`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="daily-note-form" loading={saving}>
            Add
          </Button>
        </>
      }
    >
      <form id="daily-note-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextField label="Date" type="date" required value={homeworkDate} onChange={(e) => setHomeworkDate(e.target.value)} />
        <TextareaField
          label="Questions (one per line)"
          required
          rows={4}
          value={questionsText}
          onChange={(e) => setQuestionsText(e.target.value)}
        />
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
