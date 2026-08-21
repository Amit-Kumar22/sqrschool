'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { createExam, updateExam, type Exam, type ExamPayload, type ExamStatus } from '@/lib/examService';
import { getSections, type Section } from '@/lib/classSectionService';
import type { SchoolClass } from '@/lib/classService';
import type { Subject } from '@/lib/subjectService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/FormField';

const STATUS_OPTIONS: ExamStatus[] = ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

/** ISO string -> `datetime-local` input value, in the viewer's local time. */
function toDatetimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` input value -> ISO string, for the payload. */
function fromDatetimeLocal(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

function toFormState(item: Exam | null, schoolCode: string, defaultClassId: number | ''): ExamPayload {
  if (!item) {
    return {
      name: '',
      description: '',
      schoolCode,
      schoolClassId: (defaultClassId || 0) as number,
      subjectId: 0,
      sectionIds: [],
      durationMinutes: 60,
      totalMarks: 100,
      passingMarks: 35,
      startDate: '',
      endDate: '',
      status: 'DRAFT',
    };
  }
  return {
    name: item.name,
    description: item.description,
    schoolCode: item.schoolCode || schoolCode,
    schoolClassId: item.schoolClassId,
    subjectId: item.subjectId,
    sectionIds: item.sections.map((s) => s.id),
    durationMinutes: item.durationMinutes,
    totalMarks: item.totalMarks,
    passingMarks: item.passingMarks,
    startDate: item.startDate,
    endDate: item.endDate,
    status: item.status,
  };
}

export default function ExamFormModal({
  item,
  schoolCode,
  classes,
  subjects,
  defaultClassId,
  onClose,
  onSaved,
}: {
  item: Exam | null;
  schoolCode: string;
  classes: SchoolClass[];
  subjects: Subject[];
  defaultClassId: number | '';
  onClose: () => void;
  onSaved: (item: Exam) => void;
}) {
  const [form, setForm] = useState<ExamPayload>(() => toFormState(item, schoolCode, defaultClassId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  const isEditing = !!item;
  const setField = <K extends keyof ExamPayload>(key: K, value: ExamPayload[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!form.schoolClassId) {
      setSections([]);
      return;
    }
    let cancelled = false;
    setSectionsLoading(true);
    getSections({ classId: form.schoolClassId })
      .then((result) => {
        if (!cancelled) setSections(result.sections);
      })
      .catch(() => {
        if (!cancelled) setSections([]);
      })
      .finally(() => {
        if (!cancelled) setSectionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.schoolClassId]);

  const toggleSection = (id: number) => {
    setForm((f) => ({
      ...f,
      sectionIds: f.sectionIds.includes(id) ? f.sectionIds.filter((s) => s !== id) : [...f.sectionIds, id],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Exam name is required.');
      return;
    }
    if (!form.schoolClassId) {
      setError('Please select a class.');
      return;
    }
    if (!form.subjectId) {
      setError('Please select a subject.');
      return;
    }
    if (form.sectionIds.length === 0) {
      setError('Select at least one section.');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError('Start and end date/time are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('End date/time cannot be before the start date/time.');
      return;
    }
    if (form.passingMarks > form.totalMarks) {
      setError('Passing marks cannot exceed total marks.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateExam(item!.id, form) : await createExam(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} exam.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={ClipboardList}
      title={isEditing ? `Edit ${item!.name}` : 'Add exam'}
      subtitle={isEditing ? 'Update this exam.' : 'Schedule a new exam for a class.'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="exam-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="exam-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextField label="Exam name" required value={form.name} onChange={(e) => setField('name', e.target.value)} />

        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-3.5">
          <SelectField
            label="Class"
            required
            value={form.schoolClassId || ''}
            onChange={(e) => setField('schoolClassId', Number(e.target.value))}
          >
            <option value="" disabled>
              Select a class
            </option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.className}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Subject"
            required
            value={form.subjectId || ''}
            onChange={(e) => setField('subjectId', Number(e.target.value))}
          >
            <option value="" disabled>
              Select a subject
            </option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subjectName}
              </option>
            ))}
          </SelectField>
        </div>

        <label className="group block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Sections<span className="ml-0.5 text-red-500">*</span>
          </span>
          {sectionsLoading ? (
            <p className="text-xs text-slate-400">Loading sections…</p>
          ) : sections.length === 0 ? (
            <p className="text-xs text-slate-400">{form.schoolClassId ? 'No sections for this class.' : 'Select a class first.'}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <label
                  key={section.id}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    form.sectionIds.includes(section.id)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.sectionIds.includes(section.id)}
                    onChange={() => toggleSection(section.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  {section.sectionName}
                </label>
              ))}
            </div>
          )}
        </label>

        <div className="grid grid-cols-3 gap-3.5">
          <TextField
            label="Duration (min)"
            type="number"
            min={1}
            required
            value={form.durationMinutes || ''}
            onChange={(e) => setField('durationMinutes', Number(e.target.value))}
          />
          <TextField
            label="Total marks"
            type="number"
            min={0.01}
            step={0.01}
            required
            value={form.totalMarks || ''}
            onChange={(e) => setField('totalMarks', Number(e.target.value))}
          />
          <TextField
            label="Passing marks"
            type="number"
            min={0.01}
            step={0.01}
            required
            value={form.passingMarks || ''}
            onChange={(e) => setField('passingMarks', Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <TextField
            label="Start date & time"
            type="datetime-local"
            required
            value={toDatetimeLocal(form.startDate)}
            onChange={(e) => setField('startDate', fromDatetimeLocal(e.target.value))}
          />
          <TextField
            label="End date & time"
            type="datetime-local"
            required
            value={toDatetimeLocal(form.endDate)}
            onChange={(e) => setField('endDate', fromDatetimeLocal(e.target.value))}
          />
        </div>

        <SelectField label="Status" required value={form.status} onChange={(e) => setField('status', e.target.value as ExamStatus)}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </SelectField>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
