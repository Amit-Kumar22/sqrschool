'use client';

import { FormEvent, useState } from 'react';
import { CalendarDays, NotebookPen, Plus, Trash2 } from 'lucide-react';
import { createHomework, type Homework, type HomeworkPayload } from '@/lib/homeworkService';
import type { TeacherSubjectMapping } from '@/lib/teacherSubjectService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';

interface NoteFormState {
  homeworkDate: string;
  questionsText: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const blankNote = (): NoteFormState => ({ homeworkDate: todayIso(), questionsText: '' });

export default function HomeworkFormModal({
  assignments,
  defaultTeacherClassId,
  onClose,
  onSaved,
}: {
  assignments: TeacherSubjectMapping[];
  defaultTeacherClassId: number | '';
  onClose: () => void;
  onSaved: (item: Homework) => void;
}) {
  const [teacherClassId, setTeacherClassId] = useState<number | ''>(defaultTeacherClassId);
  const [notes, setNotes] = useState<NoteFormState[]>([blankNote()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateNote = (idx: number, patch: Partial<NoteFormState>) =>
    setNotes((prev) => prev.map((n, i) => (i === idx ? { ...n, ...patch } : n)));
  const addNote = () => setNotes((prev) => [...prev, blankNote()]);
  const removeNote = (idx: number) => setNotes((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teacherClassId) {
      setError('Please select a class.');
      return;
    }
    if (notes.length === 0) {
      setError('Add at least one homework date.');
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
      teacherClassId: Number(teacherClassId),
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
      subtitle="Set homework for one of your assigned classes."
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
        <SelectField label="Class" required value={teacherClassId} onChange={(e) => setTeacherClassId(e.target.value ? Number(e.target.value) : '')}>
          <option value="" disabled>
            Select a class
          </option>
          {assignments.map((assignment) => (
            <option key={assignment.id} value={assignment.id}>
              {assignment.subject.subjectName} — {assignment.section.schoolClass.className} {assignment.section.sectionName}
            </option>
          ))}
        </SelectField>

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
