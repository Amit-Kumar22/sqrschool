'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { createStudentAdmission, type NewAdmissionPayload, type StudentAddress } from '@/lib/studentService';
import { getAcademicYears, type AcademicYear } from '@/lib/academicYearService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSections, type Section } from '@/lib/classSectionService';
import type { School } from '@/lib/schoolService';

const emptyAddress: StudentAddress = {
  buildingName: '',
  streetName: '',
  landmark: '',
  district: '',
  city: '',
  pin: '',
  stateName: '',
};

function emptyForm(schoolCode: string): NewAdmissionPayload {
  return {
    schoolCode,
    academicYearId: 0,
    name: '',
    phone: '',
    fatherName: '',
    motherName: '',
    password: '',
    sectionId: 0,
    address: { ...emptyAddress },
  };
}

export default function StudentAdmissionFormModal({
  schoolCode,
  schools,
  onClose,
  onSaved,
}: {
  /** The account's own school — auto-fills and hides the school field when set. */
  schoolCode: string;
  /** Only needed (and only shown) when schoolCode is empty — lets the admin pick which school this admission belongs to. */
  schools?: School[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<NewAdmissionPayload>(() => emptyForm(schoolCode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const needsSchoolPicker = !schoolCode;
  const setField = (key: keyof Omit<NewAdmissionPayload, 'address'>, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }) as NewAdmissionPayload);
  const setAddressField = (key: keyof StudentAddress, value: string) =>
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classId, setClassId] = useState<number | ''>('');

  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);

  // Classes and academic years are scoped to whichever school is active —
  // the account's own, or the one picked from the school selector below.
  useEffect(() => {
    setClassId('');
    setSections([]);
    setField('sectionId', 0);
    setField('academicYearId', 0);
    if (!form.schoolCode) {
      setClasses([]);
      setAcademicYears([]);
      return;
    }
    let cancelled = false;
    setClassesLoading(true);
    setYearsLoading(true);
    getClasses({ schoolCode: form.schoolCode })
      .then((page) => {
        if (!cancelled) setClasses(page.content);
      })
      .catch(() => {
        if (!cancelled) setClasses([]);
      })
      .finally(() => {
        if (!cancelled) setClassesLoading(false);
      });
    getAcademicYears({ schoolCode: form.schoolCode })
      .then((page) => {
        if (!cancelled) setAcademicYears(page.content);
      })
      .catch(() => {
        if (!cancelled) setAcademicYears([]);
      })
      .finally(() => {
        if (!cancelled) setYearsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.schoolCode]);

  // Sections are scoped to whichever class is selected.
  useEffect(() => {
    setField('sectionId', 0);
    if (!classId) {
      setSections([]);
      return;
    }
    let cancelled = false;
    setSectionsLoading(true);
    getSections({ classId })
      .then((result) => {
        if (!cancelled) setSections(result.sections);
      })
      .catch(() => {
        if (!cancelled) setSections([]);
      })
      .finally(() => {
        if (!cancelled) setSectionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (needsSchoolPicker && !form.schoolCode) {
      setError('Please select a school.');
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.fatherName.trim() || !form.motherName.trim()) {
      setError('Please fill in all required student details.');
      return;
    }
    if (!form.password.trim()) {
      setError('Password is required.');
      return;
    }
    if (!classId || !form.sectionId) {
      setError('Please select a class and section.');
      return;
    }
    if (!form.academicYearId) {
      setError('Please select an academic year.');
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
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
        <div className="animate-scale-in w-full max-w-sm rounded-xl bg-white p-5 text-center shadow-premium-lg">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900">Student admitted</h2>
          <p className="mt-1.5 text-sm text-slate-500">{successMessage}</p>
          <button
            onClick={onSaved}
            className="mt-4 w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-premium-sm transition-colors hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-2xl rounded-xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Add student admission</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="scrollbar-thin max-h-[75vh] overflow-y-auto px-4 py-3">
          <div className="grid gap-2.5">
            {needsSchoolPicker && (
              <SelectField
                label="School *"
                value={form.schoolCode}
                onChange={(v) => setField('schoolCode', v)}
                placeholder="Select a school"
                options={(schools ?? []).map((s) => ({ value: s.schoolCode, label: `${s.schoolName} (${s.schoolCode})` }))}
              />
            )}

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Student name *" value={form.name} onChange={(v) => setField('name', v)} required />
              <Field label="Phone *" value={form.phone} onChange={(v) => setField('phone', v)} required />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Father's name *" value={form.fatherName} onChange={(v) => setField('fatherName', v)} required />
              <Field label="Mother's name *" value={form.motherName} onChange={(v) => setField('motherName', v)} required />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <SelectField
                label="Class *"
                value={classId}
                onChange={(v) => setClassId(v ? Number(v) : '')}
                placeholder={classesLoading ? 'Loading…' : 'Select a class'}
                disabled={classesLoading || classes.length === 0}
                options={classes.map((c) => ({ value: c.id, label: c.className }))}
              />
              <SelectField
                label="Section *"
                value={form.sectionId || ''}
                onChange={(v) => setField('sectionId', v ? Number(v) : 0)}
                placeholder={!classId ? 'Select a class first' : sectionsLoading ? 'Loading…' : 'Select a section'}
                disabled={!classId || sectionsLoading || sections.length === 0}
                options={sections.map((s) => ({ value: s.id, label: s.sectionName }))}
              />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <SelectField
                label="Academic year *"
                value={form.academicYearId || ''}
                onChange={(v) => setField('academicYearId', v ? Number(v) : 0)}
                placeholder={yearsLoading ? 'Loading…' : 'Select academic year'}
                disabled={yearsLoading || academicYears.length === 0}
                options={academicYears.map((y) => ({ value: y.id, label: y.yearCode }))}
              />
              <Field
                label="Password *"
                type="password"
                value={form.password}
                onChange={(v) => setField('password', v)}
                required
              />
            </div>

            <p className="mt-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Address</p>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Building name" value={form.address.buildingName} onChange={(v) => setAddressField('buildingName', v)} />
              <Field label="Street name" value={form.address.streetName} onChange={(v) => setAddressField('streetName', v)} />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Landmark" value={form.address.landmark} onChange={(v) => setAddressField('landmark', v)} />
              <Field label="District" value={form.address.district} onChange={(v) => setAddressField('district', v)} />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="City" value={form.address.city} onChange={(v) => setAddressField('city', v)} />
              <Field label="State" value={form.address.stateName} onChange={(v) => setAddressField('stateName', v)} />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Pin code" value={form.address.pin} onChange={(v) => setAddressField('pin', v)} />
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-premium-sm transition-all hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving…' : 'Admit student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-slate-900">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-slate-900">{label}</span>
      <select
        value={value}
        required
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-50"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
