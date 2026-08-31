'use client';

import { useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import { getFeePayments, type FeePayment, type StudentFee } from '@/lib/feeService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';

const formatDateTime = (value: string) => (value ? new Date(value).toLocaleString() : '—');

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function FeePaymentsModal({ fee, onClose }: { fee: StudentFee; onClose: () => void }) {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getFeePayments(fee.id)
      .then((data) => {
        if (!cancelled) setPayments(data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load payment history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fee.id]);

  return (
    <Modal icon={History} title="Payment history" subtitle={`${fee.studentName} · ${formatEnumLabel(fee.feeType)}`} size="sm" onClose={onClose}>
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : payments.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No payments recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{p.receiptNumber}</p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(p.paidAt)} · {formatEnumLabel(p.paymentMode)}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-emerald-700">₹{p.totalAmount.toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
