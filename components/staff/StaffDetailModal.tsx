'use client';

import { UserCircle } from 'lucide-react';
import type { StaffMember } from '@/lib/schoolService';
import { RoleBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function StaffDetailModal({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
  return (
    <Modal
      icon={UserCircle}
      title={staff.fullName}
      subtitle={staff.email}
      badge={<RoleBadge role={staff.role} />}
      size="sm"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <DetailSection title="Contact">
        <DetailRow label="Email" value={staff.email} />
        <DetailRow label="Phone" value={staff.phone} />
      </DetailSection>
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

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-sm">
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="block truncate font-medium text-slate-700">{value || '—'}</span>
    </div>
  );
}
