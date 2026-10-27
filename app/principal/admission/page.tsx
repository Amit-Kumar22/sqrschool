'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ChangeEvent,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Save,
  School,
  Trash2,
  User,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { createAdmissionForm, type AdmissionFormPayload } from '@/lib/studentService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { useTheme } from '@/contexts/ThemeContext';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import Button from '@/components/ui/Button';

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-premium-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none';

function emptyForm(): AdmissionFormPayload {
  const year = new Date().getFullYear();
  return {
    classId: 0,
    session: `${year}-${year + 1}`,
    name: '',
    adharNumber: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    cast: '',
    fatherName: '',
    fatherEmail: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherEmail: '',
    motherPhone: '',
    motherOccupation: '',
    nationality: 'Indian',
    parentAnnualIncome: '',
    address: '',
    pincode: '',
    photo: '',
  };
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-600 uppercase transition-colors group-focus-within:text-brand-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </span>
  );
}

function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`group block ${className ?? ''}`}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${INPUT_CLASS} ${className ?? ''}`} />;
}

function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${INPUT_CLASS} cursor-pointer appearance-none pr-9 ${className ?? ''}`}>
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function TextareaInput({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${INPUT_CLASS} h-auto resize-none py-2.5 ${className ?? ''}`} />;
}

function SectionHeading({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand">
        <Icon size={18} />
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-brand-700 ring-1 ring-brand-200">
          {number}
        </span>
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold tracking-wide text-slate-800 uppercase">{title}</h2>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function ParentBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-brand-700 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
        {title}
      </p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function AdmissionFormPage() {
  const { theme } = useTheme();
  const [form, setForm] = useState<AdmissionFormPayload>(() => emptyForm());
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof AdmissionFormPayload>(key: K, value: AdmissionFormPayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const requiredChecks = [
    form.name.trim() !== '',
    form.classId > 0,
    form.session.trim() !== '',
    form.dob !== '',
    form.gender !== '',
    form.fatherName.trim() !== '',
    form.motherName.trim() !== '',
  ];
  const completedRequired = requiredChecks.filter(Boolean).length;
  const progress = Math.round((completedRequired / requiredChecks.length) * 100);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo must be 2 MB or smaller.');
      return;
    }

    setPhotoError('');
    const reader = new FileReader();
    reader.onload = () => setField('photo', typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let cancelled = false;
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Please enter the name of the applicant.');
    if (!form.classId) return setError('Please select the class to which admission is sought.');
    if (!form.session.trim()) return setError('Please enter the academic session.');
    if (!form.dob) return setError('Please select the date of birth.');
    if (!form.gender) return setError('Please select the gender.');
    if (!form.fatherName.trim()) return setError("Please enter the father's name.");
    if (!form.motherName.trim()) return setError("Please enter the mother's name.");

    setSaving(true);
    try {
      await createAdmissionForm(form);
      setSubmitted(true);
      setForm(emptyForm());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to submit the admission form.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <SetPageTitle title="Admission Form" />

      {submitted && (
        <div className="flex animate-fade-in-up flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 shadow-premium-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Admission submitted successfully</p>
              <p className="text-xs text-emerald-700">The student has been added to the admission records.</p>
            </div>
          </div>
          <Link
            href="/principal/student-admission"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Users size={14} />
            View students
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-forest-900 via-forest-800 to-brand-800 px-5 py-7 text-white sm:px-8">
          <span className="pointer-events-none absolute -top-20 -right-12 h-52 w-52 rounded-full bg-brand-400/20 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
          <span
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-brand-200 shadow-premium backdrop-blur">
                <School size={26} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold tracking-[0.24em] text-brand-200/80 uppercase">Admission Portal</p>
                <h1 className="truncate text-xl font-extrabold tracking-wide sm:text-2xl">
                  {theme.companyName || 'SQR School'}
                </h1>
                <p className="text-[10px] font-medium tracking-[0.16em] text-white/55 uppercase">
                  CBSE Affiliated Senior Secondary School
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center backdrop-blur">
              <p className="text-[9px] font-bold tracking-[0.18em] text-brand-200/80 uppercase">Academic Session</p>
              <input
                required
                value={form.session}
                onChange={(event) => setField('session', event.target.value)}
                placeholder="2026-2027"
                className="mt-0.5 w-32 border-b border-white/35 bg-transparent text-center text-base font-bold text-white placeholder:text-white/35 focus:border-brand-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="relative mt-6 flex items-center justify-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/25" />
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] font-bold tracking-[0.3em] uppercase">
              Admission Form
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/25" />
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white px-5 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <CheckCircle2 size={14} className={progress === 100 ? 'text-emerald-500' : 'text-slate-300'} />
              Form completion
            </div>
            <span className="text-xs font-bold text-brand-700">{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-5 bg-slate-50/70 p-4 sm:p-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium-sm sm:p-5">
            <SectionHeading
              number={1}
              title="Student Details"
              description="Basic identity and academic information of the applicant."
              icon={User}
            />

            <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_10.5rem]">
              <div className="space-y-4">
                <Field label="Name of the Applicant (in Capital Letters)" required>
                  <TextInput
                    required
                    value={form.name}
                    onChange={(event) => setField('name', event.target.value)}
                    placeholder="Enter full name"
                    className="uppercase placeholder:normal-case"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Date of Birth (DD/MM/YYYY)" required>
                    <TextInput
                      required
                      type="date"
                      value={form.dob}
                      onChange={(event) => setField('dob', event.target.value)}
                    />
                  </Field>

                  <Field label="Class to which admission is sought" required>
                    <SelectInput
                      required
                      value={form.classId || ''}
                      disabled={classesLoading || classes.length === 0}
                      onChange={(event) => setField('classId', event.target.value ? Number(event.target.value) : 0)}
                    >
                      <option value="" disabled>
                        {classesLoading ? 'Loading…' : 'Select a class'}
                      </option>
                      {classes.map((schoolClass) => (
                        <option key={schoolClass.id} value={schoolClass.id}>
                          {schoolClass.className}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field label="Nationality">
                    <TextInput
                      value={form.nationality}
                      onChange={(event) => setField('nationality', event.target.value)}
                      placeholder="Nationality"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Student's Aadhar No." hint="Optional · 12 digits">
                    <TextInput
                      inputMode="numeric"
                      maxLength={12}
                      value={form.adharNumber}
                      onChange={(event) => setField('adharNumber', event.target.value.replace(/\D/g, ''))}
                      placeholder="12-digit Aadhaar number"
                    />
                  </Field>

                  <div>
                    <FieldLabel required>Gender</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'MALE', label: 'Male' },
                        { value: 'FEMALE', label: 'Female' },
                        { value: 'OTHER', label: 'Other' },
                      ].map((option) => {
                        const selected = form.gender === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                              selected
                                ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-premium-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="gender"
                              value={option.value}
                              checked={selected}
                              onChange={(event) => setField('gender', event.target.value)}
                              className="sr-only"
                            />
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                selected ? 'border-brand-600' : 'border-slate-300'
                              }`}
                            >
                              {selected && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                            </span>
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Blood Group">
                    <TextInput
                      value={form.bloodGroup}
                      onChange={(event) => setField('bloodGroup', event.target.value)}
                      placeholder="e.g. O+"
                    />
                  </Field>

                  <Field label="Cast">
                    <TextInput
                      value={form.cast}
                      onChange={(event) => setField('cast', event.target.value)}
                      placeholder="Enter cast / category"
                    />
                  </Field>
                </div>
              </div>

              <div className="order-first lg:order-last">
                <FieldLabel>Passport Photograph</FieldLabel>
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-2.5 shadow-premium-sm">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    title="Upload photograph"
                    className="group relative flex aspect-[3.5/4.5] w-36 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-brand-400 hover:bg-brand-50/50 lg:w-full"
                  >
                    {form.photo ? (
                      <Image
                        src={form.photo}
                        alt="Applicant photograph"
                        fill
                        unoptimized
                        sizes="176px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex flex-col items-center gap-2 px-2 text-center text-slate-400 transition-colors group-hover:text-brand-600">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-premium-sm">
                          <Camera size={18} />
                        </span>
                        <span className="text-[10px] font-bold tracking-wide uppercase">Add Photo</span>
                      </span>
                    )}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  {form.photo && (
                    <button
                      type="button"
                      onClick={() => setField('photo', '')}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-red-100 bg-red-50 py-1.5 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-100"
                    >
                      <Trash2 size={11} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-2 text-center text-[10px] leading-tight text-slate-400">
                  Passport size
                  <br />
                  JPG / PNG · max 2 MB
                </p>
                {photoError && <p className="mt-1 text-center text-[10px] text-red-500">{photoError}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium-sm sm:p-5">
            <SectionHeading
              number={2}
              title="Parent / Guardian Details"
              description="Contact and occupation details of the student's parents."
              icon={UsersRound}
            />

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <ParentBlock title="Father's Details">
                <Field label="Name" required>
                  <TextInput
                    required
                    value={form.fatherName}
                    onChange={(event) => setField('fatherName', event.target.value)}
                    placeholder="Father's full name"
                  />
                </Field>
                <Field label="Occupation">
                  <TextInput
                    value={form.fatherOccupation}
                    onChange={(event) => setField('fatherOccupation', event.target.value)}
                    placeholder="Occupation"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mobile No.">
                    <TextInput
                      type="tel"
                      value={form.fatherPhone}
                      onChange={(event) => setField('fatherPhone', event.target.value)}
                      placeholder="Mobile number"
                    />
                  </Field>
                  <Field label="Email ID">
                    <TextInput
                      type="email"
                      value={form.fatherEmail}
                      onChange={(event) => setField('fatherEmail', event.target.value)}
                      placeholder="Email address"
                    />
                  </Field>
                </div>
              </ParentBlock>

              <ParentBlock title="Mother's Details">
                <Field label="Name" required>
                  <TextInput
                    required
                    value={form.motherName}
                    onChange={(event) => setField('motherName', event.target.value)}
                    placeholder="Mother's full name"
                  />
                </Field>
                <Field label="Occupation">
                  <TextInput
                    value={form.motherOccupation}
                    onChange={(event) => setField('motherOccupation', event.target.value)}
                    placeholder="Occupation"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mobile No.">
                    <TextInput
                      type="tel"
                      value={form.motherPhone}
                      onChange={(event) => setField('motherPhone', event.target.value)}
                      placeholder="Mobile number"
                    />
                  </Field>
                  <Field label="Email ID">
                    <TextInput
                      type="email"
                      value={form.motherEmail}
                      onChange={(event) => setField('motherEmail', event.target.value)}
                      placeholder="Email address"
                    />
                  </Field>
                </div>
              </ParentBlock>
            </div>

            <div className="mt-4 sm:max-w-xs">
              <Field label="Parent Annual Income">
                <TextInput
                  inputMode="numeric"
                  value={form.parentAnnualIncome}
                  onChange={(event) => setField('parentAnnualIncome', event.target.value)}
                  placeholder="Annual income"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium-sm sm:p-5">
            <SectionHeading
              number={3}
              title="Address (Correspondence Address)"
              description="Where the school can reach the student's family."
              icon={MapPin}
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_10rem]">
              <Field label="Address">
                <TextareaInput
                  rows={2}
                  value={form.address}
                  onChange={(event) => setField('address', event.target.value)}
                  placeholder="House no. / street, area / locality, city, state"
                />
              </Field>

              <Field label="Pin Code">
                <TextInput
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(event) => setField('pincode', event.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit pin code"
                />
              </Field>
            </div>
          </section>

          {error && (
            <div className="animate-fade-in-up rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-500">
            Fields marked <span className="text-red-500">*</span> are required.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm(emptyForm());
                setError('');
                setPhotoError('');
                setSubmitted(false);
              }}
            >
              Reset
            </Button>
            <Button type="submit" icon={Save} loading={saving} className="sm:min-w-40">
              Submit Admission
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
