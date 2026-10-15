'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Banknote } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { generateTransportFee, getStudentRouteAssignment, type TransportRoute } from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';
import TransportStudentPicker from './TransportStudentPicker';
import { currentAcademicYear, formatMoney, FormError, todayInput } from './transportUi';

function plusDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(y, m - 1, d + days);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

/**
 * Raises a TRANSPORT_FEE for one student, priced from the route's transport
 * fee. When opened from a route roster the student and route are fixed;
 * otherwise picking a student pre-selects the route they're boarded on.
 */
export default function GenerateTransportFeeModal({
  routes,
  preset,
  onClose,
  onSaved,
}: {
  routes: TransportRoute[];
  preset?: { studentId: number; studentName: string; routeId: number };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [classId, setClassId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>(preset?.studentId ?? '');
  const [routeId, setRouteId] = useState<number | ''>(preset?.routeId ?? '');
  const [routeHint, setRouteHint] = useState('');
  const [feeDate, setFeeDate] = useState(todayInput());
  const [dueDate, setDueDate] = useState(plusDays(todayInput(), 15));
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Look up which route the picked student rides so the fee defaults to it.
  useEffect(() => {
    if (preset || !studentId) return;
    let cancelled = false;
    setRouteHint('');
    getStudentRouteAssignment(studentId)
      .then((a) => {
        if (cancelled || !a) return;
        setRouteId(a.routeId);
        setRouteHint(`Boarded on ${a.routeName}${a.stopName ? ` · ${a.stopName}` : ''}`);
      })
      .catch(() => !cancelled && setRouteHint('This student is not assigned to any route yet.'));
    return () => {
      cancelled = true;
    };
  }, [studentId, preset]);

  const route = routes.find((r) => r.id === routeId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentId) return setError('Choose a student.');
    if (!routeId) return setError('Choose a route.');
    if (dueDate < feeDate) return setError('Due date cannot be before the fee date.');
    if (!academicYear.trim()) return setError('Academic year is required.');
    setSaving(true);
    setError('');
    try {
      await generateTransportFee({ studentId, routeId, feeDate, dueDate, academicYear: academicYear.trim() });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not generate the transport fee.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Banknote}
      accent="emerald"
      title="Generate transport fee"
      subtitle={preset ? preset.studentName : 'Creates a TRANSPORT_FEE priced from the route.'}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="transport-fee-form" loading={saving}>
            Generate fee
          </Button>
        </>
      }
    >
      <form id="transport-fee-form" onSubmit={handleSubmit} className="grid gap-4">
        {!preset && (
          <TransportStudentPicker
            classId={classId}
            studentId={studentId}
            onChange={(c, s) => {
              setClassId(c);
              setStudentId(s);
            }}
          />
        )}

        <SelectField
          label="Route"
          required
          disabled={!!preset}
          hint={routeHint || undefined}
          value={routeId}
          onChange={(e) => setRouteId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="" disabled>
            Select a route
          </option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.routeName} — {formatMoney(r.transportFee)}
            </option>
          ))}
        </SelectField>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <TextField label="Fee date" type="date" required value={feeDate} onChange={(e) => setFeeDate(e.target.value)} />
          <TextField label="Due date" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <TextField label="Academic year" required placeholder="2026-27" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <div>
            <p className="text-xs text-emerald-700/80">Amount (from route)</p>
            <p className="text-sm font-medium text-emerald-900">{route?.routeName ?? 'No route selected'}</p>
          </div>
          <p className="text-xl font-bold tracking-tight text-emerald-700 tabular-nums">{formatMoney(route?.transportFee)}</p>
        </div>
        <p className="-mt-2 text-[11px] text-slate-400">Collect payment and print receipts from Fees → Collect Fee as usual.</p>

        <FormError message={error} />
      </form>
    </Modal>
  );
}
