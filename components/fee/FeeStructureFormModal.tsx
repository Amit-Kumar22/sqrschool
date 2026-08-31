'use client';

import { FormEvent, useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { createFeeStructure, updateFeeStructure, type FeeFrequency, type FeeStructure, type FeeStructurePayload, type FeeType } from '@/lib/feeService';
import type { SchoolClass } from '@/lib/classService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';

const FEE_TYPE_OPTIONS: FeeType[] = ['TUITION_FEE', 'ADMISSION_FEE', 'EXAM_FEE', 'TRANSPORT_FEE', 'LIBRARY_FEE', 'MISCELLANEOUS_FEE'];

const FEE_FREQUENCY_OPTIONS: FeeFrequency[] = ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUALLY'];

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

function toFormState(item: FeeStructure | null): FeeStructurePayload {
  if (!item) {
    return {
      title: '',
      classId: 0,
      academicYear: '',
      feeType: 'TUITION_FEE',
      frequency: 'ONE_TIME',
      amount: 0,
      description: '',
    };
  }
  return {
    title: item.title,
    classId: item.classId,
    academicYear: item.academicYear,
    feeType: item.feeType,
    frequency: item.frequency,
    amount: item.amount,
    description: item.description,
  };
}

export default function FeeStructureFormModal({
  item,
  classes,
  onClose,
  onSaved,
}: {
  item: FeeStructure | null;
  classes: SchoolClass[];
  onClose: () => void;
  onSaved: (item: FeeStructure) => void;
}) {
  const [form, setForm] = useState<FeeStructurePayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof FeeStructurePayload>(key: K, value: FeeStructurePayload[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!form.classId) {
      setError('Please select a class.');
      return;
    }
    if (!form.academicYear.trim()) {
      setError('Please enter an academic year.');
      return;
    }
    if (!form.amount || form.amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateFeeStructure(item!.id, form) : await createFeeStructure(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} fee structure.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={IndianRupee}
      title={isEditing ? `Edit ${item!.className} fee` : 'Add fee structure'}
      subtitle={isEditing ? 'Update this fee structure.' : 'Define a new fee structure for a class.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="fee-structure-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="fee-structure-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextField
          label="Title"
          required
          placeholder="e.g. Tuition Fee — Quarter 2"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3.5">
          <SelectField
            label="Class"
            required
            value={form.classId || ''}
            onChange={(e) => setField('classId', Number(e.target.value))}
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

          <TextField
            label="Academic year"
            required
            placeholder="e.g. 2025-26"
            value={form.academicYear}
            onChange={(e) => setField('academicYear', e.target.value)}
          />
        </div>

        <SelectField
          label="Fee type"
          required
          value={form.feeType}
          onChange={(e) => setField('feeType', e.target.value as FeeType)}
        >
          {FEE_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {formatEnumLabel(type)}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-3.5">
          <TextField
            label="Amount"
            type="number"
            min={0.01}
            step={0.01}
            required
            value={form.amount || ''}
            onChange={(e) => setField('amount', Number(e.target.value))}
          />

          <SelectField
            label="Frequency"
            required
            value={form.frequency}
            onChange={(e) => setField('frequency', e.target.value as FeeFrequency)}
          >
            {FEE_FREQUENCY_OPTIONS.map((freq) => (
              <option key={freq} value={freq}>
                {formatEnumLabel(freq)}
              </option>
            ))}
          </SelectField>
        </div>

        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={2}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
