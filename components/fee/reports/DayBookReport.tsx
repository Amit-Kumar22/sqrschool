'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getAllFeePayments, getStudentFees, type FeePayment, type StudentFee } from '@/lib/feeService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';

const today = () => new Date().toISOString().slice(0, 10);
const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Day Book — every fee payment recorded on a given date, enriched with student/class/fee-type from the student-fees list since the payments endpoint only returns ids. */
export default function DayBookReport() {
  const [date, setDate] = useState(today());
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [feesById, setFeesById] = useState<Map<number, StudentFee>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [paymentsContent, feesContent] = await Promise.all([
          getAllFeePayments({ feeDate: date }).then((p) => p.content ?? []),
          getStudentFees()
            .then((p) => p.content ?? [])
            .catch(() => []),
        ]);
        setPayments(paymentsContent);
        setFeesById(new Map(feesContent.map((f) => [f.id, f])));
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load the day book from the server.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date]);

  const totalCollected = useMemo(() => payments.reduce((sum, p) => sum + p.totalAmount, 0), [payments]);

  const columns: DataTableColumn<FeePayment>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt No',
      sortable: true,
      accessor: (p) => p.receiptNumber,
      render: (p) => <span className="font-mono text-xs text-slate-600">{p.receiptNumber}</span>,
    },
    {
      key: 'student',
      header: 'Student',
      accessor: (p) => feesById.get(p.studentFeeId)?.studentName,
      render: (p) => <span className="font-medium text-slate-900">{feesById.get(p.studentFeeId)?.studentName ?? `#${p.studentId}`}</span>,
    },
    {
      key: 'class',
      header: 'Class',
      accessor: (p) => feesById.get(p.studentFeeId)?.className,
      render: (p) => <span className="text-slate-600">{feesById.get(p.studentFeeId)?.className ?? '—'}</span>,
    },
    {
      key: 'feeType',
      header: 'Fee type',
      accessor: (p) => feesById.get(p.studentFeeId)?.feeType,
      render: (p) => {
        const feeType = feesById.get(p.studentFeeId)?.feeType;
        return <span className="text-slate-600">{feeType ? formatEnumLabel(feeType) : '—'}</span>;
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      accessor: (p) => p.totalAmount,
      render: (p) => <span className="font-semibold text-emerald-700">₹{p.totalAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'mode',
      header: 'Mode',
      accessor: (p) => p.paymentMode,
      render: (p) => <span className="text-slate-600">{formatEnumLabel(p.paymentMode)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (p) => p.status,
      render: (p) => <span className="text-slate-600">{p.status}</span>,
    },
  ];

  const exportCsv = () => {
    const header = ['Receipt No', 'Student', 'Class', 'Fee type', 'Amount', 'Mode', 'Status'];
    const rows = payments.map((p) => {
      const fee = feesById.get(p.studentFeeId);
      return [
        p.receiptNumber,
        fee?.studentName ?? String(p.studentId),
        fee?.className ?? '',
        fee?.feeType ?? '',
        String(p.totalAmount),
        p.paymentMode,
        p.status,
      ];
    });
    downloadCsv(`day-book-${date}.csv`, [header, ...rows]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="day-book-date" className="text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="day-book-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 shadow-premium-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
          />
        </div>
        <Button icon={Download} size="sm" variant="secondary" onClick={exportCsv} disabled={payments.length === 0}>
          Export CSV
        </Button>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <DataTable
        columns={columns}
        data={payments}
        rowKey={(p) => p.id}
        loading={loading}
        emptyTitle="No payments"
        emptyDescription="No fee payments were collected on this date."
      />

      {!loading && payments.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-slate-500">
          <span>
            Transactions: <strong className="text-slate-700">{payments.length}</strong>
          </span>
          <span>
            Total Collected: <strong className="text-emerald-700">₹{totalCollected.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
