'use client';

import { Globe, Loader2, Pencil, School as SchoolIcon, Users } from 'lucide-react';
import type { School } from '@/lib/schoolService';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

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
  const isLoading = loading || !school;

  return (
    <Modal
      icon={SchoolIcon}
      title={school ? school.schoolName : 'School details'}
      subtitle={school?.schoolCode || undefined}
      badge={school && !isLoading ? <StatusBadge active={school.active} /> : undefined}
      size="lg"
      onClose={onClose}
      footer={
        isLoading ? undefined : (
          <>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="button" icon={Pencil} onClick={onEdit}>
              Edit school
            </Button>
          </>
        )
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading school details…
        </div>
      ) : (
        <>
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

          <DetailSection title="Address">
            <DetailRow label="Building" value={school.address?.buildingName} />
            <DetailRow label="Street" value={school.address?.streetName} />
            <DetailRow label="Landmark" value={school.address?.landmark} />
            <DetailRow label="District" value={school.address?.district} />
            <DetailRow label="City" value={school.address?.city} />
            <DetailRow label="State" value={school.address?.stateName} />
            <DetailRow label="PIN code" value={school.address?.pin} />
          </DetailSection>
        </>
      )}
    </Modal>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
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
