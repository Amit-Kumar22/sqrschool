'use client';

import { FormEvent, useState } from 'react';
import { BadgePercent } from 'lucide-react';
import {
  createStudentConcession,
  updateStudentConcession,
  type ConcessionType,
  type DiscountType,
  type FeeStructure,
  type StudentConcession,
  type StudentConcessionPayload,
} from '@/lib/feeService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';

const CONCESSION_TYPE_OPTIONS: ConcessionType[] = ['SIBLING', 'STAFF_WARD', 'SCHOLARSHIP', 'FINANCIAL_AID', 'OTHER'];

const DISCOUNT_TYPE_OPTIONS: DiscountType[] = ['FIXED_AMOUNT', 'PERCENTAGE'];

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

function toFormState(item: StudentConcession | null, studentId: number): StudentConcessionPayload {
  if (!item) {
    return {
      studentId,
      feeStructureId: 0,
      type: 'SIBLING',
      discountType: 'FIXED_AMOUNT',
      discountValue: 0,
      remarks: '',
    };
  }
  return {
    studentId: item.studentId,
    feeStructureId: item.feeStructureId,
    type: item.type,
    discountType: item.discountType,
    discountValue: item.discountValue,
    remarks: item.remarks,
  };
}

export default function ConcessionFormModal({
  item,
  studentId,
  feeStructures,
  onClose,
  onSaved,
}: {
  item: StudentConcession | null;
  studentId: number;
  feeStructures: FeeStructure[];
  onClose: () => void;
  onSaved: (item: StudentConcession) => void;
}) {
  const [form, setForm] = useState<StudentConcessionPayload>(() => toFormState(item, studentId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof StudentConcessionPayload>(key: K, value: StudentConcessionPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.feeStructureId) {
      setError('Please select a fee structure.');
      return;
    }
    if (!form.discountValue || form.discountValue <= 0) {
      setError('Discount value must be greater than zero.');
      return;
    }
    if (form.discountType === 'PERCENTAGE' && form.discountValue > 100) {
      setError('Percentage discount cannot exceed 100.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateStudentConcession(item!.id, form) : await createStudentConcession(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} concession.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={BadgePercent}
      title={isEditing ? 'Edit concession' : 'Add concession'}
      subtitle={isEditing ? 'Update this concession.' : 'Grant a fee concession to this student.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="concession-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="concession-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField
          label="Fee structure"
          required
          disabled={feeStructures.length === 0}
          value={form.feeStructureId || ''}
          onChange={(e) => setField('feeStructureId', Number(e.target.value))}
        >
          <option value="" disabled>
            {feeStructures.length === 0 ? 'No fee structures for this class' : 'Select a fee structure'}
          </option>
          {feeStructures.map((fs) => (
            <option key={fs.id} value={fs.id}>
              {fs.title}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Concession type"
          required
          value={form.type}
          onChange={(e) => setField('type', e.target.value as ConcessionType)}
        >
          {CONCESSION_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {formatEnumLabel(type)}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-3.5">
          <SelectField
            label="Discount type"
            required
            value={form.discountType}
            onChange={(e) => setField('discountType', e.target.value as DiscountType)}
          >
            {DISCOUNT_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {formatEnumLabel(type)}
              </option>
            ))}
          </SelectField>

          <TextField
            label={form.discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount amount'}
            type="number"
            min={0.01}
            step={0.01}
            required
            value={form.discountValue || ''}
            onChange={(e) => setField('discountValue', Number(e.target.value))}
          />
        </div>

        <TextareaField
          label="Remarks"
          value={form.remarks}
          onChange={(e) => setField('remarks', e.target.value)}
          rows={2}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
