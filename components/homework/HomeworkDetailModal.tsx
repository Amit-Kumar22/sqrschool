'use client';

import { Eye } from 'lucide-react';
import type { Homework } from '@/lib/homeworkService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

export default function HomeworkDetailModal({ item, onClose }: { item: Homework; onClose: () => void }) {
  const { teacherSubjectSection } = item;

  return (
    <Modal
      icon={Eye}
      title={`${teacherSubjectSection.subject.subjectName} homework`}
      subtitle={`${teacherSubjectSection.section.schoolClass.className} ${teacherSubjectSection.section.sectionName}`}
      size="md"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="grid gap-3">
        {item.notes.length === 0 ? (
          <p className="text-sm text-slate-500">No homework entries yet.</p>
        ) : (
          item.notes
            .slice()
            .sort((a, b) => (a.homeworkDate < b.homeworkDate ? 1 : -1))
            .map((note) => (
              <div key={note.id} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{formatDate(note.homeworkDate)}</span>
                  <StatusBadge active={note.active} />
                </div>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {note.questions.map((question, idx) => (
                    <li key={idx}>{question}</li>
                  ))}
                </ul>
              </div>
            ))
        )}
      </div>
    </Modal>
  );
}
