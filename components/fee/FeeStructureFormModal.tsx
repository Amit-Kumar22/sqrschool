'use client';

import { FormEvent, useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { createFeeStructure, updateFeeStructure, type FeeStructure, type FeeStructurePayload, type FeeType } from '@/lib/feeService';
import type { SchoolClass } from '@/lib/classService';
import type { AcademicYear } from '@/lib/academicYearService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

const FEE_TYPE_OPTIONS: FeeType[] = ['TUITION_FEE', 'ADMISSION_FEE', 'EXAM_FEE', 'TRANSPORT_FEE', 'LIBRARY_FEE', 'MISCELLANEOUS_FEE'];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toFormState(item: FeeStructure | null): FeeStructurePayload {
  if (!item) {
    return {
      classId: 0,
      academicYearId: 0,
      feeType: 'TUITION_FEE',
      amount: 0,
      dueMonth: 1,
      optional: false,
    };
  }
  return {
    classId: item.classId,
    academicYearId: item.academicYearId,
    feeType: item.feeType,
    amount: item.amount,
    dueMonth: item.dueMonth,
    optional: item.optional,
  };
}

export default function FeeStructureFormModal({
  item,
  classes,
  academicYears,
  onClose,
  onSaved,
}: {
  item: FeeStructure | null;
  classes: SchoolClass[];
  academicYears: AcademicYear[];
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
    if (!form.classId) {
      setError('Please select a class.');
      return;
    }
    if (!form.academicYearId) {
      setError('Please select an academic year.');
      return;
    }
    if (!form.amount || form.amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (!form.dueMonth || form.dueMonth < 1 || form.dueMonth > 12) {
      setError('Please select a due month.');
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

          <SelectField
            label="Academic year"
            required
            value={form.academicYearId || ''}
            onChange={(e) => setField('academicYearId', Number(e.target.value))}
          >
            <option value="" disabled>
              Select a year
            </option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.yearCode}
              </option>
            ))}
          </SelectField>
        </div>

        <SelectField
          label="Fee type"
          required
          value={form.feeType}
          onChange={(e) => setField('feeType', e.target.value as FeeType)}
        >
          {FEE_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type
                .toLowerCase()
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
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
            label="Due month"
            required
            value={form.dueMonth || ''}
            onChange={(e) => setField('dueMonth', Number(e.target.value))}
          >
            <option value="" disabled>
              Select a month
            </option>
            {MONTHS.map((month, idx) => (
              <option key={month} value={idx + 1}>
                {month}
              </option>
            ))}
          </SelectField>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.optional}
            onChange={(e) => setField('optional', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
          />
          This fee is optional
        </label>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
