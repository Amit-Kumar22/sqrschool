'use client';

import { FormEvent, ReactNode, useState } from 'react';
import { School as SchoolIcon } from 'lucide-react';
import { createSchool, updateSchool, type School, type SchoolAddress, type SchoolPayload } from '@/lib/schoolService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';

const EMPTY_ADDRESS: SchoolAddress = {
  buildingName: '',
  streetName: '',
  landmark: '',
  district: '',
  city: '',
  pin: '',
  stateName: '',
};

const EMPTY_FORM: SchoolPayload = {
  schoolName: '',
  schoolCode: '',
  registrationNumber: '',
  affiliationBoard: '',
  establishedYear: new Date().getFullYear(),
  email: '',
  phoneNumber: '',
  alternatePhone: '',
  website: '',
  logoUrl: '',
  principalName: '',
  totalStudents: 0,
  totalTeachers: 0,
  address: EMPTY_ADDRESS,
};

function toFormState(school: School | null): SchoolPayload {
  if (!school) return EMPTY_FORM;
  const { id: _id, created: _created, updated: _updated, active: _active, ...rest } = school;
  return rest;
}

export default function SchoolFormModal({
  school,
  onClose,
  onSaved,
}: {
  school: School | null;
  onClose: () => void;
  onSaved: (school: School) => void;
}) {
  const [form, setForm] = useState<SchoolPayload>(() => toFormState(school));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!school;
  const setField = (key: keyof Omit<SchoolPayload, 'address'>, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setNumberField = (key: keyof Omit<SchoolPayload, 'address'>, value: string) =>
    setForm((f) => ({ ...f, [key]: value === '' ? 0 : Number(value) }));
  const setAddressField = (key: keyof SchoolAddress, value: string) =>
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.schoolName.trim()) {
      setError('School name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateSchool(school!.id, form) : await createSchool(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} school.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={SchoolIcon}
      title={isEditing ? `Edit "${school!.schoolName}"` : 'Add new school'}
      subtitle={isEditing ? 'Update this school.' : 'Register a new school.'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="school-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create school'}
          </Button>
        </>
      }
    >
      <form id="school-form" onSubmit={handleSubmit}>
        <FieldGroup title="Basic information">
          <TextField label="School name" required value={form.schoolName} onChange={(e) => setField('schoolName', e.target.value)} />
          <TextField label="School code" value={form.schoolCode} onChange={(e) => setField('schoolCode', e.target.value)} />
          <TextField
            label="Registration number"
            value={form.registrationNumber}
            onChange={(e) => setField('registrationNumber', e.target.value)}
          />
          <TextField
            label="Affiliation board"
            value={form.affiliationBoard}
            onChange={(e) => setField('affiliationBoard', e.target.value)}
            placeholder="e.g. CBSE"
          />
          <TextField
            label="Established year"
            type="number"
            value={String(form.establishedYear)}
            onChange={(e) => setNumberField('establishedYear', e.target.value)}
          />
          <TextField label="Principal name" value={form.principalName} onChange={(e) => setField('principalName', e.target.value)} />
        </FieldGroup>

        <FieldGroup title="Contact & web">
          <TextField label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          <TextField label="Phone number" value={form.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} />
          <TextField label="Alternate phone" value={form.alternatePhone} onChange={(e) => setField('alternatePhone', e.target.value)} />
          <TextField label="Website" value={form.website} onChange={(e) => setField('website', e.target.value)} placeholder="https://" />
          <TextField
            label="Logo URL"
            value={form.logoUrl}
            onChange={(e) => setField('logoUrl', e.target.value)}
            wrapperClassName="sm:col-span-2"
          />
        </FieldGroup>

        <FieldGroup title="Statistics">
          <TextField
            label="Total students"
            type="number"
            value={String(form.totalStudents)}
            onChange={(e) => setNumberField('totalStudents', e.target.value)}
          />
          <TextField
            label="Total teachers"
            type="number"
            value={String(form.totalTeachers)}
            onChange={(e) => setNumberField('totalTeachers', e.target.value)}
          />
        </FieldGroup>

        <FieldGroup title="Address" last>
          <TextField
            label="Building name"
            value={form.address.buildingName}
            onChange={(e) => setAddressField('buildingName', e.target.value)}
          />
          <TextField label="Street name" value={form.address.streetName} onChange={(e) => setAddressField('streetName', e.target.value)} />
          <TextField label="Landmark" value={form.address.landmark} onChange={(e) => setAddressField('landmark', e.target.value)} />
          <TextField label="District" value={form.address.district} onChange={(e) => setAddressField('district', e.target.value)} />
          <TextField label="City" value={form.address.city} onChange={(e) => setAddressField('city', e.target.value)} />
          <TextField label="State" value={form.address.stateName} onChange={(e) => setAddressField('stateName', e.target.value)} />
          <TextField label="PIN code" value={form.address.pin} onChange={(e) => setAddressField('pin', e.target.value)} />
        </FieldGroup>

        {error && <div className="mt-4 animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}

function FieldGroup({ title, last = false, children }: { title: string; last?: boolean; children: ReactNode }) {
  return (
    <div className={last ? '' : 'mb-5'}>
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
