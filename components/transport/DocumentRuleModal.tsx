'use client';

import { FormEvent, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { saveDocumentRule, type DocumentRule, type DocumentRulePayload, type VehicleType } from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import { TextField } from '@/components/ui/FormField';
import { enumLabel, FormError } from './transportUi';

const REQUIREMENTS: { key: 'requireInsurance' | 'requireFitness' | 'requirePermit' | 'requirePuc'; label: string; hint: string }[] = [
  { key: 'requireInsurance', label: 'Insurance', hint: 'Valid motor insurance policy' },
  { key: 'requireFitness', label: 'Fitness certificate', hint: 'RTO fitness certificate' },
  { key: 'requirePermit', label: 'Permit', hint: 'Contract carriage / school permit' },
  { key: 'requirePuc', label: 'PUC', hint: 'Pollution under control certificate' },
];

/** Edits which documents a vehicle type must carry, and how early to raise expiry alerts. */
export default function DocumentRuleModal({
  vehicleType,
  rule,
  onClose,
  onSaved,
}: {
  vehicleType: VehicleType;
  rule: DocumentRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<DocumentRulePayload>({
    vehicleType,
    requireInsurance: rule?.requireInsurance ?? true,
    requireFitness: rule?.requireFitness ?? true,
    requirePermit: rule?.requirePermit ?? true,
    requirePuc: rule?.requirePuc ?? true,
    alertDaysBefore: rule?.alertDaysBefore ?? 30,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.alertDaysBefore < 1) return setError('Alert lead time must be at least 1 day.');
    setSaving(true);
    setError('');
    try {
      await saveDocumentRule(form);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the document rule.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={ShieldCheck}
      title={`${enumLabel(vehicleType)} document rule`}
      subtitle="Required documents and expiry alert lead time."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="doc-rule-form" loading={saving}>
            Save rule
          </Button>
        </>
      }
    >
      <form id="doc-rule-form" onSubmit={handleSubmit} className="grid gap-4">
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {REQUIREMENTS.map(({ key, label, hint }) => (
            <li key={key} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-400">{hint}</p>
              </div>
              <Toggle checked={form[key]} label={label} onChange={(checked) => setForm((f) => ({ ...f, [key]: checked }))} />
            </li>
          ))}
        </ul>
        <TextField
          label="Alert days before expiry"
          type="number"
          min={1}
          required
          hint="Documents within this many days of expiry are flagged."
          value={form.alertDaysBefore || ''}
          onChange={(e) => setForm((f) => ({ ...f, alertDaysBefore: Number(e.target.value) }))}
        />
        <FormError message={error} />
      </form>
    </Modal>
  );
}
