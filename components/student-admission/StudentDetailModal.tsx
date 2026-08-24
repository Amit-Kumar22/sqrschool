'use client';

import { Calendar, GraduationCap, Phone, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
      size="md"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <DetailSection title="Admission" icon={Calendar}>
        <DetailRow label="Admission date" value={formatDate(student.admissionDate)} />
        <DetailRow label="Academic year" value={student.academicYear?.yearCode} />
        <DetailRow label="Class" value={student.section?.schoolClass?.className} />
        <DetailRow label="Section" value={student.section?.sectionName} />
      </DetailSection>

      <DetailSection title="Contact" icon={Phone}>
        <DetailRow label="Phone" value={student.user.phone} />
        <DetailRow label="Email" value={student.user.email} full />
      </DetailSection>

      <DetailSection title="Parents" icon={Users}>
        <DetailRow label="Father's name" value={student.fatherName} />
        <DetailRow label="Mother's name" value={student.motherName} />
        <DetailRow label="Parent phone" value={student.parentPhoneNumber} full />
      </DetailSection>
    </Modal>
  );
}

function DetailSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <Icon size={13} className="text-slate-400" />
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{title}</p>
      </div>
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, full = false }: { label: string; value?: string; full?: boolean }) {
  return (
    <div className={`text-sm ${full ? 'sm:col-span-2' : ''}`}>
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="block leading-snug font-medium break-words text-slate-700" title={value || undefined}>
        {value || '—'}
      </span>
    </div>
  );
}
