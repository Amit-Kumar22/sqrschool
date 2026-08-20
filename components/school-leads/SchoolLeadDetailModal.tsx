'use client';

import { Building2 } from 'lucide-react';
import type { SchoolLead } from '@/lib/schoolLeadService';
import { LeadStatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const formatDateTime = (value: string) => (value ? new Date(value).toLocaleString() : '—');

export default function SchoolLeadDetailModal({ lead, onClose }: { lead: SchoolLead; onClose: () => void }) {
  const location = [lead.locality, lead.city].filter(Boolean).join(', ');

  return (
    <Modal
      icon={Building2}
      title={lead.schoolName}
      subtitle={location || undefined}
      badge={<LeadStatusBadge status={lead.status} />}
      size="sm"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <DetailSection title="Address">
        <DetailRow label="Address" value={lead.address} full />
        <DetailRow label="Locality" value={lead.locality} />
        <DetailRow label="City" value={lead.city} />
        <DetailRow label="State" value={lead.state} />
        <DetailRow label="Pincode" value={lead.pincode} />
      </DetailSection>

      <DetailSection title="Contact">
        <DetailRow label="Phone" value={lead.phone} />
        <DetailRow label="Alternate phone" value={lead.alternatePhone} />
        <DetailRow label="Email" value={lead.email} />
        <DetailRow label="Website" value={lead.website} />
      </DetailSection>

      <DetailSection title="School">
        <DetailRow label="Category" value={lead.category} />
        <DetailRow label="Board" value={lead.board} />
        <DetailRow label="Type" value={lead.schoolType} />
      </DetailSection>

      <DetailSection title="Follow-up">
        <DetailRow label="Last contacted" value={formatDateTime(lead.lastContactedAt)} />
        <DetailRow label="Next follow-up" value={formatDateTime(lead.nextFollowUpAt)} />
      </DetailSection>

      {lead.notes && (
        <DetailSection title="Notes">
          <p className="col-span-2 text-sm whitespace-pre-wrap text-slate-700">{lead.notes}</p>
        </DetailSection>
      )}
    </Modal>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{title}</p>
      <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, full = false }: { label: string; value?: string; full?: boolean }) {
  return (
    <div className={`text-sm ${full ? 'sm:col-span-2' : ''}`}>
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="block truncate font-medium text-slate-700">{value || '—'}</span>
    </div>
  );
}
