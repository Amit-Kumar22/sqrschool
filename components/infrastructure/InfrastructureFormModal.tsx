'use client';

import { FormEvent, useState } from 'react';
import { Building2 } from 'lucide-react';
import {
  createInfrastructure,
  updateInfrastructure,
  type Infrastructure,
  type InfrastructurePayload,
} from '@/lib/infrastructureService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextField, TextareaField } from '@/components/ui/FormField';

const EMPTY_FORM: InfrastructurePayload = {
  name: '',
  icon: '',
  description: '',
  active: true,
};

function toFormState(item: Infrastructure | null): InfrastructurePayload {
  if (!item) return EMPTY_FORM;
  const { id: _id, created: _created, updated: _updated, ...rest } = item;
  return rest;
}

export default function InfrastructureFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: Infrastructure | null;
  onClose: () => void;
  onSaved: (item: Infrastructure) => void;
}) {
  const [form, setForm] = useState<InfrastructurePayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = (key: keyof InfrastructurePayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateInfrastructure(item!.id, form) : await createInfrastructure(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} infrastructure record.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Building2}
      title={isEditing ? `Edit "${item!.name}"` : 'Add infrastructure'}
      subtitle={isEditing ? 'Update this infrastructure record.' : 'Add a new infrastructure facility.'}
      size="md"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="infrastructure-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="infrastructure-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <TextField label="Name" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
          <TextField
            label="Icon"
            value={form.icon}
            placeholder="e.g. library, playground"
            onChange={(e) => setField('icon', e.target.value)}
          />
          <TextareaField
            label="Description"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={3}
            wrapperClassName="sm:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
            />
            <span className="font-medium text-slate-900">Active</span>
          </label>
        </div>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
