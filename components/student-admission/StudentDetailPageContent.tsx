'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarCheck, GraduationCap, IdCard, Loader2, Pencil, Phone, Trash2, User, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteStudent, getStudentAdmissions, type StudentAdmission } from '@/lib/studentService';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SegmentedTabs, { type SegmentedTabItem } from '@/components/ui/SegmentedTabs';
import PersonAttendanceCalendar from '@/components/attendance/PersonAttendanceCalendar';
import StudentEditFormModal from './StudentEditFormModal';

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

type DetailTab = 'details' | 'attendance';

const TABS: SegmentedTabItem[] = [
  { key: 'details', label: 'Details', icon: IdCard },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
];

export default function StudentDetailPageContent({ studentId, initialTab }: { studentId: number; initialTab?: DetailTab }) {
  const router = useRouter();
  const backToList = () => router.push('/principal/student-admission');

  const [student, setStudent] = useState<StudentAdmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab ?? 'details');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getStudentAdmissions();
      const found = (page.content ?? []).find((s) => s.id === studentId);
      setStudent(found ?? null);
      if (!found) setError('Student not found.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load this student from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleDelete = async () => {
    if (!student) return;
    if (!confirm(`Delete ${student.studentUser?.fullName ?? 'this student'}? This cannot be undone.`)) return;
    setDeleting(true);
    setError('');
    try {
      await deleteStudent(student.id);
      backToList();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this student.'));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading student…
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4">
        <BackButton onClick={backToList} />
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || 'Student not found.'}
        </div>
      </div>
    );
  }

  const initials = (student.studentUser?.fullName ?? '?')
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
                <h1 className="text-base font-bold text-slate-900 sm:text-lg">{student.studentUser?.fullName || '—'}</h1>
                <StatusBadge active={student.active} />
              </div>
              <p className="text-xs text-slate-500">
                {student.admissionNumber}
                {student.studentCode ? ` · ${student.studentCode}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={Pencil} variant="secondary" onClick={() => setEditModalOpen(true)}>
              Edit
            </Button>
            <Button icon={Trash2} variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <SegmentedTabs tabs={TABS} active={activeTab} onChange={(key) => setActiveTab(key as DetailTab)} />

      {activeTab === 'details' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailCard title="Admission" icon={GraduationCap} accent="from-sky-500 via-blue-400 to-sky-500" iconBg="bg-sky-50 text-sky-600">
            <DetailRow label="Admission date" value={formatDate(student.admissionDate)} />
            <DetailRow label="Class" value={student.schoolClass?.className} />
            <DetailRow label="Roll number" value={student.rollNumber} />
          </DetailCard>

          <DetailCard title="Personal" icon={User} accent="from-amber-400 via-orange-400 to-amber-400" iconBg="bg-amber-50 text-amber-600">
            <DetailRow label="Date of birth" value={formatDate(student.dob)} />
            <DetailRow label="Gender" value={student.gender} />
            <DetailRow label="Blood group" value={student.bloodGroup} />
          </DetailCard>

          <DetailCard title="Contact" icon={Phone} accent="from-emerald-500 via-teal-400 to-emerald-500" iconBg="bg-emerald-50 text-emerald-600">
            <DetailRow label="Phone" value={student.studentUser?.phone} />
            <DetailRow label="Email" value={student.studentUser?.email} full />
            <DetailRow label="Address" value={student.address} full />
            <DetailRow label="Pin code" value={student.pincode} />
          </DetailCard>

          <DetailCard title="Parents" icon={Users} accent="from-rose-500 via-red-400 to-rose-500" iconBg="bg-rose-50 text-rose-600">
            <DetailRow label="Father's name" value={student.fatherName} />
            <DetailRow label="Mother's name" value={student.motherName} />
            <DetailRow label="Parent phone" value={student.parentUser?.phone} />
            <DetailRow label="Parent email" value={student.parentUser?.email} full />
          </DetailCard>
        </div>
      )}

      {activeTab === 'attendance' && <PersonAttendanceCalendar personName={student.studentUser?.fullName ?? ''} />}

      {editModalOpen && (
        <StudentEditFormModal
          student={student}
          onClose={() => setEditModalOpen(false)}
          onSaved={async () => {
            setEditModalOpen(false);
            await load();
          }}
        />
      )}
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
      <ArrowLeft size={15} /> Back to students
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
