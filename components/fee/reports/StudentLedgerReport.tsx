'use client';

import { useEffect, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { getAllFeePayments, getStudentFees, type FeePayment, type StudentFee } from '@/lib/feeService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StudentFeeStatusBadge } from '@/components/ui/Badge';
import StudentPicker from '../shared/StudentPicker';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');
const formatDateTime = (value: string) => (value ? new Date(value).toLocaleString() : '—');
const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** Student Ledger — one student's full fee history: outstanding/paid fees plus every payment recorded against them. */
export default function StudentLedgerReport() {
  const [classId, setClassId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>('');
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) {
      setFees([]);
      setPayments([]);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [feesContent, paymentsContent] = await Promise.all([
          getStudentFees({ studentId }).then((p) => p.content ?? []),
          getAllFeePayments({ studentId }).then((p) => p.content ?? []),
        ]);
        setFees(feesContent);
        setPayments(paymentsContent);
      } catch (err) {
        setError(apiErrorMessage(err, "Could not load this student's ledger."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const feeColumns: DataTableColumn<StudentFee>[] = [
    {
      key: 'feeType',
      header: 'Fee type',
      accessor: (f) => f.feeType,
      render: (f) => <span className="text-slate-600">{formatEnumLabel(f.feeType)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      accessor: (f) => f.amount,
      render: (f) => <span className="text-slate-700">₹{f.amount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      accessor: (f) => f.paidAmount,
      render: (f) => <span className="text-emerald-700">₹{f.paidAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'dueAmount',
      header: 'Due',
      align: 'right',
      accessor: (f) => f.dueAmount,
      render: (f) => <span className="font-semibold text-slate-900">₹{f.dueAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due date',
      accessor: (f) => f.dueDate,
      render: (f) => <span className="text-slate-600">{formatDate(f.dueDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (f) => <StudentFeeStatusBadge status={f.status} />,
    },
  ];

  const paymentColumns: DataTableColumn<FeePayment>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt No',
      accessor: (p) => p.receiptNumber,
      render: (p) => <span className="font-mono text-xs text-slate-600">{p.receiptNumber}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      align: 'right',
      accessor: (p) => p.totalAmount,
      render: (p) => <span className="font-semibold text-emerald-700">₹{p.totalAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'paymentMode',
      header: 'Mode',
      accessor: (p) => p.paymentMode,
      render: (p) => <span className="text-slate-600">{formatEnumLabel(p.paymentMode)}</span>,
    },
    {
      key: 'paidAt',
      header: 'Paid at',
      accessor: (p) => p.paidAt,
      render: (p) => <span className="text-slate-600">{formatDateTime(p.paidAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <StudentPicker
        classId={classId}
        studentId={studentId}
        onChange={(c, s) => {
          setClassId(c);
          setStudentId(s);
        }}
      />

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div>
        <p className="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Fees</p>
        <DataTable
          columns={feeColumns}
          data={fees}
          rowKey={(f) => f.id}
          loading={loading}
          pageSize={5}
          emptyTitle="No fees"
          emptyDescription={studentId ? 'This student has no fee records yet.' : 'Select a student to view their ledger.'}
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Payment history</p>
        <DataTable
          columns={paymentColumns}
          data={payments}
          rowKey={(p) => p.id}
          loading={loading}
          pageSize={5}
          emptyTitle="No payments"
          emptyDescription={studentId ? 'No payments recorded for this student yet.' : 'Select a student to view their ledger.'}
        />
      </div>
    </div>
  );
}
