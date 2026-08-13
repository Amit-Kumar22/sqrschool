'use client';

import { Globe, GraduationCap, Loader2, Pencil, Users, X } from 'lucide-react';
import type { School } from '@/lib/schoolService';
import { StatusBadge } from '@/components/ui/Badge';

export default function SchoolDetailModal({
  school,
  loading,
  onClose,
  onEdit,
}: {
  school: School | null;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-2xl rounded-2xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{school ? school.schoolName : 'School details'}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {loading || !school ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading school details…
          </div>
        ) : (
          <div className="scrollbar-thin max-h-[75vh] overflow-y-auto px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-premium">
                <GraduationCap size={20} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{school.schoolName}</p>
                <p className="text-xs text-slate-500">{school.schoolCode || '—'}</p>
              </div>
              <span className="ml-auto shrink-0">
                <StatusBadge active={school.active} />
              </span>
            </div>

            <DetailSection title="Basic information">
              <DetailRow label="Registration number" value={school.registrationNumber} />
              <DetailRow label="Affiliation board" value={school.affiliationBoard} />
              <DetailRow label="Established year" value={school.establishedYear ? String(school.establishedYear) : ''} />
              <DetailRow label="Principal name" value={school.principalName} />
            </DetailSection>

            <DetailSection title="Contact & web">
              <DetailRow label="Email" value={school.email} />
              <DetailRow label="Phone number" value={school.phoneNumber} />
              <DetailRow label="Alternate phone" value={school.alternatePhone} />
              <DetailRow
                label="Website"
                value={
                  school.website ? (
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                    >
                      <Globe size={12} /> {school.website}
                    </a>
                  ) : (
                    ''
                  )
                }
              />
            </DetailSection>

            <DetailSection title="Statistics">
              <DetailRow
                label="Total students"
                value={
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} className="text-slate-400" /> {school.totalStudents}
                  </span>
                }
              />
              <DetailRow
                label="Total teachers"
                value={
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} className="text-slate-400" /> {school.totalTeachers}
                  </span>
                }
              />
            </DetailSection>

            <DetailSection title="Address" last>
              <DetailRow label="Building" value={school.address?.buildingName} />
              <DetailRow label="Street" value={school.address?.streetName} />
              <DetailRow label="Landmark" value={school.address?.landmark} />
              <DetailRow label="District" value={school.address?.district} />
              <DetailRow label="City" value={school.address?.city} />
              <DetailRow label="State" value={school.address?.stateName} />
              <DetailRow label="PIN code" value={school.address?.pin} />
            </DetailSection>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-premium"
              >
                <Pencil size={14} /> Edit school
              </button>
            </div>
          </div>
        )}
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

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="text-sm">
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="block truncate font-medium text-slate-700">{value || '—'}</span>
    </div>
  );
}
