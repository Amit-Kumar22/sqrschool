'use client';

import { Eye } from 'lucide-react';
import type { Homework } from '@/lib/homeworkService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { HomeworkNoteStatusBadge } from '@/components/ui/Badge';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');
const dayLabel = (day: string) => (day ? day.charAt(0) + day.slice(1).toLowerCase() : '—');

export default function HomeworkDetailModal({ item, onClose }: { item: Homework; onClose: () => void }) {
  return (
    <Modal
      icon={Eye}
      title={`${item.subjectName} homework`}
      subtitle={`${item.className} · ${item.teacherName} · ${dayLabel(item.dayOfWeek)}, ${item.periodName}`}
      size="md"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>
            Homework date: <span className="font-medium text-slate-700">{formatDate(item.homeworkDate)}</span>
          </span>
          <span>
            Due date: <span className="font-medium text-slate-700">{formatDate(item.dueDate)}</span>
          </span>
        </div>

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
                  <HomeworkNoteStatusBadge status={note.status} />
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
