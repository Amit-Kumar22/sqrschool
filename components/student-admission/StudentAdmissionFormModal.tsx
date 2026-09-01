'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { createStudentAdmission, type NewAdmissionPayload } from '@/lib/studentService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

function emptyForm(): NewAdmissionPayload {
  return {
    name: '',
    fatherName: '',
    motherName: '',
    parentEmail: '',
    parentPhone: '',
    classId: 0,
    dob: '',
    address: '',
    pincode: '',
    gender: '',
  };
}

export default function StudentAdmissionFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<NewAdmissionPayload>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const setField = <K extends keyof NewAdmissionPayload>(key: K, value: NewAdmissionPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setClassesLoading(true);
    getClasses()
      .then((page) => {
        if (!cancelled) setClasses(page.content ?? []);
      })
      .catch(() => {
        if (!cancelled) setClasses([]);
      })
      .finally(() => {
        if (!cancelled) setClassesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.fatherName.trim() || !form.motherName.trim()) {
      setError('Please fill in all required student details.');
      return;
    }
    if (!form.classId) {
      setError('Please select a class.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createStudentAdmission(form);
      setSuccessMessage(`${form.name} has been admitted successfully.`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to admit student.'));
    } finally {
      setSaving(false);
    }
  };

  if (successMessage) {
    return (
      <Modal
        icon={CheckCircle2}
        title="Student admitted"
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
      icon={UserPlus}
      title="Add student admission"
      subtitle="Enroll a new student into a class."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="student-admission-form" loading={saving}>
            Admit student
          </Button>
        </>
      }
    >
      <form id="student-admission-form" onSubmit={handleSubmit} className="grid gap-2.5">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Student name" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
          <SelectField
            label="Class"
            required
            value={form.classId || ''}
            disabled={classesLoading || classes.length === 0}
            onChange={(e) => setField('classId', e.target.value ? Number(e.target.value) : 0)}
          >
            <option value="" disabled>
              {classesLoading ? 'Loading…' : 'Select a class'}
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Father's name" required value={form.fatherName} onChange={(e) => setField('fatherName', e.target.value)} />
          <TextField label="Mother's name" required value={form.motherName} onChange={(e) => setField('motherName', e.target.value)} />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField
            label="Parent email"
            type="email"
            value={form.parentEmail}
            onChange={(e) => setField('parentEmail', e.target.value)}
          />
          <TextField label="Parent phone" value={form.parentPhone} onChange={(e) => setField('parentPhone', e.target.value)} />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Date of birth" type="date" value={form.dob} onChange={(e) => setField('dob', e.target.value)} />
          <SelectField label="Gender" value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
            <option value="" disabled>
              Select gender
            </option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </SelectField>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto]">
          <TextField label="Address" value={form.address} onChange={(e) => setField('address', e.target.value)} />
          <TextField label="Pin code" value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} />
        </div>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
