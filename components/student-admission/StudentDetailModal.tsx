'use client';

import { UserCircle, X } from 'lucide-react';
import type { StudentAdmission } from '@/lib/studentService';
import { StatusBadge } from '@/components/ui/Badge';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

export default function StudentDetailModal({ student, onClose }: { student: StudentAdmission; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-md rounded-xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{student.user.fullName}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-premium">
              <UserCircle size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{student.user.fullName}</p>
              <p className="text-xs text-slate-500">{student.admissionNumber}</p>
            </div>
            <span className="ml-auto shrink-0">
              <StatusBadge active={student.active} />
            </span>
          </div>

          <DetailSection title="Admission">
            <DetailRow label="Admission date" value={formatDate(student.admissionDate)} />
            <DetailRow label="Academic year" value={student.academicYear?.yearCode} />
            <DetailRow label="Class" value={student.section?.schoolClass?.className} />
            <DetailRow label="Section" value={student.section?.sectionName} />
          </DetailSection>

          <DetailSection title="Contact">
            <DetailRow label="Phone" value={student.user.phone} />
            <DetailRow label="Email" value={student.user.email} />
          </DetailSection>

          <DetailSection title="Parents" last>
            <DetailRow label="Father's name" value={student.fatherName} />
            <DetailRow label="Mother's name" value={student.motherName} />
            <DetailRow label="Parent phone" value={student.parentPhoneNumber} />
          </DetailSection>

          <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, last = false, children }: { title: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={`mt-4 ${last ? '' : ''}`}>
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{title}</p>
      <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-sm">
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="block truncate font-medium text-slate-700">{value || '—'}</span>
    </div>
  );
}
