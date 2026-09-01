'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, CheckCircle2, Users } from 'lucide-react';
import { addStaff, type AddStaffPayload, type StaffRole } from '@/lib/schoolService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSubjects, type Subject } from '@/lib/subjectService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

interface StaffFormState {
  name: string;
  email: string;
  phoneNumber: string;
  qualification: string;
  experienceYears: string;
  role: StaffRole;
  subjectId: number | '';
}

function emptyForm(): StaffFormState {
  return {
    name: '',
    email: '',
    phoneNumber: '',
    qualification: '',
    experienceYears: '',
    role: 'TEACHER',
    subjectId: '',
  };
}

export default function StaffFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StaffFormState>(() => emptyForm());
  const [classIds, setClassIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [refLoading, setRefLoading] = useState(true);

  const isTeacher = form.role === 'TEACHER';

  useEffect(() => {
    const loadRefData = async () => {
      setRefLoading(true);
      try {
        const [classesPage, subjectsPage] = await Promise.all([getClasses(), getSubjects()]);
        setClasses(classesPage.content ?? []);
        setSubjects(subjectsPage.content ?? []);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes or subjects from the server.'));
      } finally {
        setRefLoading(false);
      }
    };
    loadRefData();
  }, []);

  const setField = <K extends keyof StaffFormState>(key: K, value: StaffFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleClass = (id: number) => {
    setClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (isTeacher && !form.subjectId) {
      setError('Please select a subject for this teacher.');
      return;
    }

    const payload: AddStaffPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      qualification: form.qualification.trim(),
      experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
      role: form.role,
      classIds: isTeacher ? Array.from(classIds) : [],
      subjectId: isTeacher && form.subjectId ? Number(form.subjectId) : 0,
    };

    setSaving(true);
    setError('');
    try {
      const result = await addStaff(payload);
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
      <form id="staff-form" onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Full name" required value={form.name} onChange={(e) => setField('name', e.target.value)} />

          <SelectField label="Role" value={form.role} onChange={(e) => setField('role', e.target.value as StaffRole)}>
            <option value="TEACHER">Teacher</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
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
            label="Qualification"
            placeholder="e.g. B.Ed, M.Sc"
            value={form.qualification}
            onChange={(e) => setField('qualification', e.target.value)}
          />
          <TextField
            label="Experience (years)"
            type="number"
            min={0}
            step={0.1}
            value={form.experienceYears}
            onChange={(e) => setField('experienceYears', e.target.value)}
          />
        </div>

        {isTeacher && (
          <>
            <SelectField
              label="Subject"
              required
              disabled={refLoading || subjects.length === 0}
              value={form.subjectId}
              onChange={(e) => setField('subjectId', e.target.value ? Number(e.target.value) : '')}
            >
              <option value="" disabled>
                {refLoading ? 'Loading subjects…' : subjects.length === 0 ? 'No subjects yet' : 'Select a subject'}
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName}
                </option>
              ))}
            </SelectField>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Assign classes</p>
              {refLoading ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-9 rounded-lg" />
                  ))}
                </div>
              ) : classes.length === 0 ? (
                <p className="text-xs text-slate-400">No classes yet — add one first from the Class page.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {classes.map((cls) => {
                    const checked = classIds.has(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => toggleClass(cls.id)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                          checked
                            ? 'border-amber-400 bg-amber-50/60 text-amber-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/30'
                        }`}
                      >
                        <span
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                            checked ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                          }`}
                        >
                          {checked && <Check size={9} strokeWidth={3} />}
                        </span>
                        <span className="truncate">{cls.className}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
