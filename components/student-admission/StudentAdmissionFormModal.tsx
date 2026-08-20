'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { createStudentAdmission, type NewAdmissionPayload, type StudentAddress } from '@/lib/studentService';
import { getAcademicYears, type AcademicYear } from '@/lib/academicYearService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSections, type Section } from '@/lib/classSectionService';
import type { School } from '@/lib/schoolService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

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
      subtitle="Create a login and enroll a student into a class."
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
        {needsSchoolPicker && (
          <SelectField label="School" required value={form.schoolCode} onChange={(e) => setField('schoolCode', e.target.value)}>
            <option value="" disabled>
              Select a school
            </option>
            {(schools ?? []).map((s) => (
              <option key={s.id} value={s.schoolCode}>
                {s.schoolName} ({s.schoolCode})
              </option>
            ))}
          </SelectField>
        )}

        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Student name" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
          <TextField label="Phone" required value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Father's name" required value={form.fatherName} onChange={(e) => setField('fatherName', e.target.value)} />
          <TextField label="Mother's name" required value={form.motherName} onChange={(e) => setField('motherName', e.target.value)} />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <SelectField
            label="Class"
            required
            value={classId}
            disabled={classesLoading || classes.length === 0}
            onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')}
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
          <SelectField
            label="Section"
            required
            value={form.sectionId || ''}
            disabled={!classId || sectionsLoading || sections.length === 0}
            onChange={(e) => setField('sectionId', e.target.value ? Number(e.target.value) : 0)}
          >
            <option value="" disabled>
              {!classId ? 'Select a class first' : sectionsLoading ? 'Loading…' : 'Select a section'}
            </option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sectionName}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <SelectField
            label="Academic year"
            required
            value={form.academicYearId || ''}
            disabled={yearsLoading || academicYears.length === 0}
            onChange={(e) => setField('academicYearId', e.target.value ? Number(e.target.value) : 0)}
          >
            <option value="" disabled>
              {yearsLoading ? 'Loading…' : 'Select academic year'}
            </option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.yearCode}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
          />
        </div>

        <p className="mt-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Address</p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Building name" value={form.address.buildingName} onChange={(e) => setAddressField('buildingName', e.target.value)} />
          <TextField label="Street name" value={form.address.streetName} onChange={(e) => setAddressField('streetName', e.target.value)} />
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Landmark" value={form.address.landmark} onChange={(e) => setAddressField('landmark', e.target.value)} />
          <TextField label="District" value={form.address.district} onChange={(e) => setAddressField('district', e.target.value)} />
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="City" value={form.address.city} onChange={(e) => setAddressField('city', e.target.value)} />
          <TextField label="State" value={form.address.stateName} onChange={(e) => setAddressField('stateName', e.target.value)} />
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Pin code" value={form.address.pin} onChange={(e) => setAddressField('pin', e.target.value)} />
        </div>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
