'use client';

import { UserCircle, X } from 'lucide-react';
import type { StaffMember } from '@/lib/schoolService';
import { RoleBadge } from '@/components/ui/Badge';

export default function StaffDetailModal({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-md rounded-2xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{staff.fullName}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-premium">
              <UserCircle size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{staff.fullName}</p>
              <p className="text-xs text-slate-500">{staff.email}</p>
            </div>
            <span className="ml-auto shrink-0">
              <RoleBadge role={staff.role} />
            </span>
          </div>

          <DetailSection title="Contact" last>
            <DetailRow label="Email" value={staff.email} />
            <DetailRow label="Phone" value={staff.phone} />
          </DetailSection>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
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
    <div className={`mt-5 ${last ? '' : ''}`}>
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
