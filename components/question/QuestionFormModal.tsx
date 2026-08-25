'use client';

import { FormEvent, useState } from 'react';
import { FileQuestion, Plus, Trash2 } from 'lucide-react';
import {
  createQuestion,
  updateQuestion,
  type Question,
  type QuestionDifficulty,
  type QuestionOptionPayload,
  type QuestionPayload,
  type QuestionType,
} from '@/lib/examService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
];

const DIFFICULTY_OPTIONS: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

interface OptionFormState {
  optionText: string;
  correct: boolean;
}

interface FormState {
  questionText: string;
  type: QuestionType;
  marks: number;
  difficulty: QuestionDifficulty;
  modelAnswer: string;
  questionOrder: number;
  options: OptionFormState[];
}

const blankMcqOptions = (): OptionFormState[] => [
  { optionText: '', correct: true },
  { optionText: '', correct: false },
];

const trueFalseOptions = (): OptionFormState[] => [
  { optionText: 'True', correct: true },
  { optionText: 'False', correct: false },
];

function toFormState(item: Question | null, nextOrder: number): FormState {
  if (!item) {
    return {
      questionText: '',
      type: 'MCQ',
      marks: 1,
      difficulty: 'EASY',
      modelAnswer: '',
      questionOrder: nextOrder,
      options: blankMcqOptions(),
    };
  }
  return {
    questionText: item.questionText,
    type: item.type,
    marks: item.marks,
    difficulty: item.difficulty,
    // The backend returns null (not "") when no model answer was set —
    // coerce it since a controlled <textarea> can't take a null value.
    modelAnswer: item.modelAnswer ?? '',
    // questionOrder isn't part of the GET response — the backend only
    // accepts it on write, so there's no confirmed original value to
    // preload here. Defaulting to the suggested next slot; adjust as needed.
    questionOrder: nextOrder,
    options: item.options
      .slice()
      .sort((a, b) => a.optionOrder - b.optionOrder)
      .map((o) => ({ optionText: o.optionText ?? '', correct: o.correct })),
  };
}

export default function QuestionFormModal({
  item,
  examId,
  subjectId,
  subjectName,
  nextOrder,
  onClose,
  onSaved,
}: {
  item: Question | null;
  examId: number;
  subjectId: number;
  subjectName: string;
  nextOrder: number;
  onClose: () => void;
  onSaved: (item: Question) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(item, nextOrder));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const hasOptions = form.type === 'MCQ' || form.type === 'TRUE_FALSE';
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleTypeChange = (type: QuestionType) => {
    setForm((f) => {
      if (type === 'TRUE_FALSE') return { ...f, type, options: trueFalseOptions() };
      if (type === 'MCQ') return { ...f, type, options: f.options.length >= 2 ? f.options : blankMcqOptions() };
      return { ...f, type, options: [] };
    });
  };

  const updateOptionText = (idx: number, optionText: string) =>
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === idx ? { ...o, optionText } : o)) }));

  const setCorrectOption = (idx: number) =>
    setForm((f) => ({ ...f, options: f.options.map((o, i) => ({ ...o, correct: i === idx })) }));

  const addOption = () => setForm((f) => ({ ...f, options: [...f.options, { optionText: '', correct: false }] }));

  const removeOption = (idx: number) => setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.questionText.trim()) {
      setError('Question text is required.');
      return;
    }
    if (!form.marks || form.marks <= 0) {
      setError('Marks must be greater than zero.');
      return;
    }
    if (!form.questionOrder || form.questionOrder < 1) {
      setError('Question order must be at least 1.');
      return;
    }
    if (hasOptions) {
      if (form.options.length < 2) {
        setError('Add at least two options.');
        return;
      }
      if (form.options.some((o) => !o.optionText.trim())) {
        setError('Every option needs text.');
        return;
      }
      if (!form.options.some((o) => o.correct)) {
        setError('Mark one option as correct.');
        return;
      }
    } else if (!form.modelAnswer.trim()) {
      setError('Provide a model answer for this question type.');
      return;
    }

    const options: QuestionOptionPayload[] = hasOptions
      ? form.options.map((o, idx) => ({ optionText: o.optionText, correct: o.correct, optionOrder: idx + 1 }))
      : [];

    const payload: QuestionPayload = {
      examId,
      questionOrder: form.questionOrder,
      questionText: form.questionText,
      type: form.type,
      marks: form.marks,
      difficulty: form.difficulty,
      subjectId: item?.subjectId ?? subjectId,
      modelAnswer: form.modelAnswer,
      options,
    };

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateQuestion(item!.id, payload) : await createQuestion(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} question.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={FileQuestion}
      title={isEditing ? 'Edit question' : 'Add question'}
      subtitle={`${subjectName || 'Subject'} · ${isEditing ? 'Update this question.' : 'Create a new question for this exam.'}`}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="question-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="question-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextareaField
          label="Question text"
          required
          rows={2}
          value={form.questionText}
          onChange={(e) => setField('questionText', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3.5">
          <SelectField label="Type" required value={form.type} onChange={(e) => handleTypeChange(e.target.value as QuestionType)}>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Difficulty"
            required
            value={form.difficulty}
            onChange={(e) => setField('difficulty', e.target.value as QuestionDifficulty)}
          >
            {DIFFICULTY_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0) + level.slice(1).toLowerCase()}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <TextField
            label="Marks"
            type="number"
            min={0.01}
            step={0.01}
            required
            value={form.marks || ''}
            onChange={(e) => setField('marks', Number(e.target.value))}
          />
          <TextField
            label="Question order"
            type="number"
            min={1}
            required
            hint="Position within the exam."
            value={form.questionOrder || ''}
            onChange={(e) => setField('questionOrder', Number(e.target.value))}
          />
        </div>

        {hasOptions ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Options<span className="ml-0.5 text-red-500">*</span>
              </span>
              {form.type === 'MCQ' && (
                <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addOption}>
                  Add option
                </Button>
              )}
            </div>
            <div className="grid gap-2">
              {form.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={option.correct}
                    onChange={() => setCorrectOption(idx)}
                    title="Mark as correct"
                    className="h-4 w-4 shrink-0 border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <input
                    type="text"
                    value={option.optionText}
                    placeholder={`Option ${idx + 1}`}
                    disabled={form.type === 'TRUE_FALSE'}
                    onChange={(e) => updateOptionText(idx, e.target.value)}
                    className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-premium-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  {form.type === 'MCQ' && form.options.length > 2 && (
                    <IconButton icon={Trash2} label="Remove option" variant="danger" size="sm" onClick={() => removeOption(idx)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <TextareaField
          label={hasOptions ? 'Explanation (optional)' : 'Model answer'}
          required={!hasOptions}
          rows={hasOptions ? 2 : 4}
          value={form.modelAnswer}
          onChange={(e) => setField('modelAnswer', e.target.value)}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
