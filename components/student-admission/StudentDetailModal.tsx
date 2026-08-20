'use client';

import { GraduationCap } from 'lucide-react';
import type { StudentAdmission } from '@/lib/studentService';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

export default function StudentDetailModal({ student, onClose }: { student: StudentAdmission; onClose: () => void }) {
  return (
    <Modal
      icon={GraduationCap}
      title={student.user.fullName}
      subtitle={student.admissionNumber}
      badge={<StatusBadge active={student.active} />}
      size="sm"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
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

      <DetailSection title="Parents">
        <DetailRow label="Father's name" value={student.fatherName} />
        <DetailRow label="Mother's name" value={student.motherName} />
        <DetailRow label="Parent phone" value={student.parentPhoneNumber} />
      </DetailSection>
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

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-sm">
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="block truncate font-medium text-slate-700">{value || '—'}</span>
    </div>
  );
}
