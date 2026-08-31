'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { getStudentFees, type StudentFee } from '@/lib/feeService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StudentFeeStatusBadge } from '@/components/ui/Badge';
import TabPill from '@/components/ui/TabPill';

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** Class Report — every student fee for one class, with running totals. */
export default function ClassReport() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState<number | ''>('');
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getClasses()
      .then((page) => {
        const content = page.content ?? [];
        setClasses(content);
        setClassId((prev) => prev || (content[0]?.id ?? ''));
      })
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    setError('');
    getStudentFees({ classId })
      .then((page) => setFees(page.content ?? []))
      .catch((err) => setError(apiErrorMessage(err, "Could not load this class's fees.")))
      .finally(() => setLoading(false));
  }, [classId]);

  const totals = useMemo(
    () =>
      fees.reduce(
        (acc, f) => ({ amount: acc.amount + f.amount, paid: acc.paid + f.paidAmount, due: acc.due + f.dueAmount }),
        { amount: 0, paid: 0, due: 0 },
      ),
    [fees],
  );

  const columns: DataTableColumn<StudentFee>[] = [
    {
      key: 'studentName',
      header: 'Student',
      sortable: true,
      accessor: (f) => f.studentName,
      render: (f) => <span className="font-medium text-slate-900">{f.studentName}</span>,
    },
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
      sortable: true,
      accessor: (f) => f.amount,
      render: (f) => <span className="text-slate-700">₹{f.amount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      sortable: true,
      accessor: (f) => f.paidAmount,
      render: (f) => <span className="text-emerald-700">₹{f.paidAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'dueAmount',
      header: 'Due',
      align: 'right',
      sortable: true,
      accessor: (f) => f.dueAmount,
      render: (f) => <span className="font-semibold text-slate-900">₹{f.dueAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (f) => <StudentFeeStatusBadge status={f.status} />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="scrollbar-thin flex flex-wrap gap-1 overflow-x-auto">
        {classes.map((cls) => (
          <TabPill key={cls.id} label={cls.className} active={classId === cls.id} onClick={() => setClassId(cls.id)} />
        ))}
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <DataTable
        columns={columns}
        data={fees}
        rowKey={(f) => f.id}
        loading={loading}
        emptyTitle="No fee records"
        emptyDescription="This class has no student fees generated yet."
      />

      {!loading && fees.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-slate-500">
          <span>
            Total: <strong className="text-slate-700">₹{totals.amount.toLocaleString('en-IN')}</strong>
          </span>
          <span>
            Paid: <strong className="text-emerald-700">₹{totals.paid.toLocaleString('en-IN')}</strong>
          </span>
          <span>
            Due: <strong className="text-red-600">₹{totals.due.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
