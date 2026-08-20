'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Users } from 'lucide-react';
import { addStaff, type AddStaffPayload, type School, type StaffRole } from '@/lib/schoolService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

function emptyForm(schoolCode: string): AddStaffPayload {
  return {
    name: '',
    schoolCode,
    password: '',
    role: 'TEACHER',
    email: '',
    phoneNumber: '',
  };
}

export default function StaffFormModal({
  schoolCode,
  schools,
  onClose,
  onSaved,
}: {
  /** The account's own school — auto-fills and hides the school field when set. */
  schoolCode: string;
  /** Only needed (and only shown) when schoolCode is empty — lets the admin pick which school this staff member belongs to. */
  schools?: School[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AddStaffPayload>(() => emptyForm(schoolCode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const needsSchoolPicker = !schoolCode;
  const setField = (key: keyof AddStaffPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (needsSchoolPicker && !form.schoolCode) {
      setError('Please select a school.');
      return;
    }
    if (!form.password.trim()) {
      setError('Password is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const result = await addStaff(form);
      setSuccessMessage(result || 'Staff member added successfully.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to add staff member.'));
    } finally {
      setSaving(false);
    }
  };

  if (successMessage) {
    return (
      <Modal
        icon={CheckCircle2}
        title="Staff added"
        accent="emerald"
        size="sm"
        onClose={onSaved}
        footer={
          <Button type="button" onClick={onSaved} className="w-full">
            Done
          </Button>
        }
      >
        <p className="text-center text-sm text-slate-500">{successMessage}</p>
      </Modal>
    );
  }

  return (
    <Modal
      icon={Users}
      title="Add new staff"
      subtitle="Create a login for a teacher or staff member."
      size="md"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="staff-form" loading={saving}>
            Add staff
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <TextField label="Full name" required value={form.name} onChange={(e) => setField('name', e.target.value)} />

        {needsSchoolPicker && (
          <SelectField
            label="School"
            required
            value={form.schoolCode}
            onChange={(e) => setField('schoolCode', e.target.value)}
          >
            <option value="" disabled>
              Select a school
            </option>
            {(schools ?? []).map((school) => (
              <option key={school.id} value={school.schoolCode}>
                {school.schoolName} ({school.schoolCode})
              </option>
            ))}
          </SelectField>
        )}

        <SelectField label="Role" value={form.role} onChange={(e) => setField('role', e.target.value as StaffRole)}>
          <option value="TEACHER">Teacher</option>
          <option value="STAFF">Staff</option>
        </SelectField>

        <TextField
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
        />
        <TextField label="Phone number" value={form.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} />
        <TextField
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setField('password', e.target.value)}
        />

        {error && (
          <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:col-span-2">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
