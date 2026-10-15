'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Loader2, MapPin, Route as RouteIcon, SearchCheck } from 'lucide-react';
import { getStudentRouteAssignment, type StudentRouteAssignment } from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import TransportStudentPicker from './TransportStudentPicker';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from './transportUi';

/** "Which bus does this student take?" — looks up one student's current route assignment. */
export default function StudentRouteLookupModal({ onClose }: { onClose: () => void }) {
  const [classId, setClassId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>('');
  const [result, setResult] = useState<StudentRouteAssignment | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'none' | 'found'>('idle');

  useEffect(() => {
    if (!studentId) {
      setState('idle');
      return;
    }
    let cancelled = false;
    setState('loading');
    getStudentRouteAssignment(studentId)
      .then((a) => {
        if (cancelled) return;
        setResult(a);
        setState(a ? 'found' : 'none');
      })
      .catch(() => !cancelled && setState('none'));
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return (
    <Modal icon={SearchCheck} title="Find a student's route" subtitle="Look up current boarding details." onClose={onClose}>
      <div className="grid gap-4">
        <TransportStudentPicker
          classId={classId}
          studentId={studentId}
          onChange={(c, s) => {
            setClassId(c);
            setStudentId(s);
          }}
        />

        {state === 'loading' && (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-brand-600" />
          </div>
        )}
        {state === 'none' && (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            This student is not using school transport.
          </p>
        )}
        {state === 'found' && result && (
          <div className="animate-fade-in-up rounded-xl border border-brand-200 bg-brand-50/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{result.studentName}</p>
                <p className="text-xs text-slate-500">Admission no. {result.admissionNumber || '—'}</p>
              </div>
              <StatusBadge active={result.active} />
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Info icon={RouteIcon} label="Route" value={result.routeName} />
              <Info icon={MapPin} label="Stop" value={result.stopName || '—'} />
              <Info icon={MapPin} label="Boarding point" value={result.boardingPoint || '—'} />
              <Info icon={CalendarDays} label="Effective from" value={formatDate(result.effectiveFrom)} />
            </dl>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="mt-0.5 shrink-0 text-brand-600" />
      <div>
        <dt className="text-[11px] text-slate-400">{label}</dt>
        <dd className="font-medium text-slate-800">{value}</dd>
      </div>
    </div>
  );
}
