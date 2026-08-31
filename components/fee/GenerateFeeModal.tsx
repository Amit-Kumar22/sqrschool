'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { generateStudentFee, getFeeStructures, type FeeStructure } from '@/lib/feeService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

const today = () => new Date().toISOString().slice(0, 10);

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function GenerateFeeModal({
  classId,
  studentId,
  studentName,
  onClose,
  onSaved,
}: {
  classId: number;
  studentId: number;
  studentName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [structuresLoading, setStructuresLoading] = useState(false);
  const [feeStructureId, setFeeStructureId] = useState<number | ''>('');
  const [feeDate, setFeeDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStructuresLoading(true);
    getFeeStructures({ classId })
      .then((page) => setStructures(page.content ?? []))
      .catch(() => setStructures([]))
      .finally(() => setStructuresLoading(false));
  }, [classId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!feeStructureId) {
      setError('Please select a fee structure.');
      return;
    }
    if (!feeDate) {
      setError('Please select a fee date.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await generateStudentFee({ feeStructureId: Number(feeStructureId), studentId, feeDate });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to generate this fee.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={FilePlus2}
      title="Generate fee"
      subtitle={`Create a fee instance for ${studentName} from a fee structure.`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="generate-fee-form" loading={saving}>
            Generate
          </Button>
        </>
      }
    >
      <form id="generate-fee-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField
          label="Fee structure"
          required
          value={feeStructureId}
          disabled={structuresLoading || structures.length === 0}
          onChange={(e) => setFeeStructureId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="" disabled>
            {structuresLoading ? 'Loading…' : structures.length === 0 ? 'No fee structures for this class' : 'Select a fee structure'}
          </option>
          {structures.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} · ₹{s.amount.toLocaleString('en-IN')} ({formatEnumLabel(s.frequency)})
            </option>
          ))}
        </SelectField>

        <TextField label="Fee date" type="date" required value={feeDate} onChange={(e) => setFeeDate(e.target.value)} />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
