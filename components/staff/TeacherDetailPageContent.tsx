'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, GraduationCap, Layers, Loader2, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getAllTeacherStaff, type TeacherStaffMember } from '@/lib/schoolService';
import { StatusBadge } from '@/components/ui/Badge';

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

export default function TeacherDetailPageContent({ teacherId }: { teacherId: number }) {
  const router = useRouter();
  const backToList = () => router.push('/principal/staff');

  const [teacher, setTeacher] = useState<TeacherStaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getAllTeacherStaff();
      const found = (page.content ?? []).find((t) => t.id === teacherId);
      setTeacher(found ?? null);
      if (!found) setError('Teacher not found.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load this teacher from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading teacher…
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="space-y-4">
        <BackButton onClick={backToList} />
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || 'Teacher not found.'}
        </div>
      </div>
    );
  }

  const initials = (teacher.teacherUser?.fullName ?? '?')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-4">
      <BackButton onClick={backToList} />

      <div className="card-premium animate-fade-in-up relative overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-700 to-orange-800 text-lg font-semibold text-white shadow-glow-amber">
              {initials || '?'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 sm:text-lg">{teacher.teacherUser?.fullName || '—'}</h1>
                <StatusBadge active={teacher.active} />
              </div>
              <p className="text-xs text-slate-500">
                {teacher.employeeCode}
                {teacher.subject?.subjectName ? ` · ${teacher.subject.subjectName}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Contact" icon={Phone} accent="from-emerald-500 via-teal-400 to-emerald-500" iconBg="bg-emerald-50 text-emerald-600">
          <DetailRow label="Phone" value={teacher.teacherUser?.phone} />
          <DetailRow label="Email" value={teacher.teacherUser?.email} full />
        </DetailCard>

        <DetailCard title="Teaching details" icon={GraduationCap} accent="from-sky-500 via-blue-400 to-sky-500" iconBg="bg-sky-50 text-sky-600">
          <DetailRow label="Subject" value={teacher.subject?.subjectName} />
          <DetailRow label="Employee code" value={teacher.employeeCode} />
          <DetailRow label="Qualification" value={teacher.qualification} />
          <DetailRow label="Experience" value={teacher.experienceYears != null ? `${teacher.experienceYears} yrs` : undefined} />
        </DetailCard>

        <DetailCard title="Account" icon={BadgeCheck} accent="from-violet-500 via-purple-400 to-violet-500" iconBg="bg-violet-50 text-violet-600">
          <DetailRow label="Role" value={teacher.teacherUser?.role} />
          <DetailRow label="Account status" value={teacher.teacherUser?.status} />
          <DetailRow label="Joined" value={formatDate(teacher.teacherUser?.createdAt)} />
        </DetailCard>

        <DetailCard title="Assigned classes" icon={Layers} accent="from-rose-500 via-red-400 to-rose-500" iconBg="bg-rose-50 text-rose-600">
          {teacher.assignedClasses?.length ? (
            <div className="flex flex-wrap gap-1.5 sm:col-span-2">
              {teacher.assignedClasses.map((cls) => (
                <span
                  key={cls.id}
                  className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20"
                >
                  {cls.className}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 sm:col-span-2">No classes assigned yet.</p>
          )}
        </DetailCard>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-amber-700"
    >
      <ArrowLeft size={15} /> Back to teachers
    </button>
  );
}

function DetailCard({
  title,
  icon: Icon,
  accent,
  iconBg,
  children,
}: {
  title: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
  children: ReactNode;
}) {
  return (
    <div className="card-premium animate-fade-in-up relative overflow-hidden p-4">
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon size={14} />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, full = false }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={`text-sm ${full ? 'sm:col-span-2' : ''}`}>
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="block leading-snug font-medium break-words text-slate-700" title={value || undefined}>
        {value || '—'}
      </span>
    </div>
  );
}
