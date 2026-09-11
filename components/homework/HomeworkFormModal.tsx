'use client';

import { FormEvent, useState } from 'react';
import { CalendarDays, NotebookPen, Plus, Trash2 } from 'lucide-react';
import { createHomework, type Homework, type HomeworkPayload } from '@/lib/homeworkService';
import { formatTime, type TeacherWeeklyTimetableEntry } from '@/lib/timetableService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';

interface NoteFormState {
  homeworkDate: string;
  questionsText: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const blankNote = (date: string): NoteFormState => ({ homeworkDate: date, questionsText: '' });

const dayLabel = (day: string) => (day ? day.charAt(0) + day.slice(1).toLowerCase() : '');

export default function HomeworkFormModal({
  slots,
  defaultWeeklyTimetableId,
  onClose,
  onSaved,
}: {
  slots: TeacherWeeklyTimetableEntry[];
  defaultWeeklyTimetableId: number | '';
  onClose: () => void;
  onSaved: (item: Homework) => void;
}) {
  const [weeklyTimetableId, setWeeklyTimetableId] = useState<number | ''>(defaultWeeklyTimetableId);
  const [homeworkDate, setHomeworkDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(todayIso());
  const [notes, setNotes] = useState<NoteFormState[]>([blankNote(todayIso())]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateNote = (idx: number, patch: Partial<NoteFormState>) =>
    setNotes((prev) => prev.map((n, i) => (i === idx ? { ...n, ...patch } : n)));
  const addNote = () => setNotes((prev) => [...prev, blankNote(homeworkDate)]);
  const removeNote = (idx: number) => setNotes((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!weeklyTimetableId) {
      setError('Please select a class period.');
      return;
    }
    if (!homeworkDate || !dueDate) {
      setError('Please set both the homework date and the due date.');
      return;
    }
    if (notes.length === 0) {
      setError('Add at least one homework entry.');
      return;
    }
    for (const note of notes) {
      if (!note.homeworkDate) {
        setError('Every entry needs a date.');
        return;
      }
      if (!note.questionsText.trim()) {
        setError('Every entry needs at least one question.');
        return;
      }
    }

    const payload: HomeworkPayload = {
      weeklyTimetableId: Number(weeklyTimetableId),
      homeworkDate,
      dueDate,
      notes: notes.map((n) => ({
        homeworkDate: n.homeworkDate,
        questions: n.questionsText
          .split('\n')
          .map((q) => q.trim())
          .filter(Boolean),
      })),
    };

    setSaving(true);
    setError('');
    try {
      const saved = await createHomework(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to create homework.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={NotebookPen}
      title="Add homework"
      subtitle="Set homework for one of your scheduled class periods."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="homework-form" loading={saving}>
            Create
          </Button>
        </>
      }
    >
      <form id="homework-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField
          label="Class period"
          required
          disabled={slots.length === 0}
          value={weeklyTimetableId}
          onChange={(e) => setWeeklyTimetableId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="" disabled>
            {slots.length === 0 ? 'No scheduled periods found' : 'Select a class period'}
          </option>
          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.className} · {slot.subjectName} — {dayLabel(slot.dayOfWeek)}, {slot.periodName} (
              {formatTime(slot.startTime)})
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Homework date"
            icon={CalendarDays}
            type="date"
            required
            value={homeworkDate}
            onChange={(e) => setHomeworkDate(e.target.value)}
          />
          <TextField
            label="Due date"
            icon={CalendarDays}
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Homework entries<span className="ml-0.5 text-red-500">*</span>
            </span>
            <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addNote}>
              Add date
            </Button>
          </div>
          <div className="grid gap-3">
            {notes.map((note, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <TextField
                    label="Date"
                    icon={CalendarDays}
                    type="date"
                    required
                    wrapperClassName="flex-1"
                    value={note.homeworkDate}
                    onChange={(e) => updateNote(idx, { homeworkDate: e.target.value })}
                  />
                  {notes.length > 1 && (
                    <IconButton icon={Trash2} label="Remove entry" variant="danger" onClick={() => removeNote(idx)} className="mt-6" />
                  )}
                </div>
                <TextareaField
                  label="Questions (one per line)"
                  required
                  rows={3}
                  value={note.questionsText}
                  onChange={(e) => updateNote(idx, { questionsText: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
