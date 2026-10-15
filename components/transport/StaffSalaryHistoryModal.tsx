'use client';

import { useEffect, useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  getTransportSalariesByStaff,
  SALARY_STATUSES,
  type TransportSalary,
  type TransportSalaryStatus,
  type TransportStaff,
} from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/FormField';
import { EnumBadge, enumLabel, ErrorBanner, formatMoney, formatMonth } from './transportUi';

/** One crew member's salary history, optionally narrowed by status. */
export default function StaffSalaryHistoryModal({ staff, onClose }: { staff: TransportStaff; onClose: () => void }) {
  const [status, setStatus] = useState<TransportSalaryStatus | ''>('');
  const [rows, setRows] = useState<TransportSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getTransportSalariesByStaff(staff.id, { status: status || undefined })
      .then((page) => !cancelled && setRows(page.content))
      .catch((err) => !cancelled && setError(apiErrorMessage(err, 'Could not load salary history.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [staff.id, status]);

  const paidTotal = useMemo(() => rows.filter((r) => r.status === 'PAID').reduce((s, r) => s + (r.netPayable || 0), 0), [rows]);

  return (
    <Modal icon={History} title="Salary history" subtitle={`${staff.name} · ${enumLabel(staff.designation)}`} size="lg" onClose={onClose}>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SelectField label="Status" uiSize="sm" wrapperClassName="w-40" value={status} onChange={(e) => setStatus(e.target.value as TransportSalaryStatus | '')}>
            <option value="">All statuses</option>
            {SALARY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {enumLabel(s)}
              </option>
            ))}
          </SelectField>
          <p className="text-xs text-slate-500">
            Paid in list: <span className="font-semibold text-emerald-700">{formatMoney(paidTotal)}</span>
          </p>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No salary records yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatMonth(r.salaryMonth)}</p>
                  <p className="text-xs text-slate-400">
                    Basic {formatMoney(r.basicSalary)}
                    {r.paymentMode ? ` · ${enumLabel(r.paymentMode)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-nums text-brand-700">{formatMoney(r.netPayable)}</span>
                  <EnumBadge value={r.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
