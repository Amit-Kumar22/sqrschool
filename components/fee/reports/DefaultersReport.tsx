'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getStudentFees, markOverdueStudentFees, type StudentFee } from '@/lib/feeService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StudentFeeStatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');
const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** Defaulters — every student fee currently flagged OVERDUE, with a manual trigger for the overdue sweep. */
export default function DefaultersReport() {
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const content = (await getStudentFees({ status: 'OVERDUE' })).content;
      setFees(content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load defaulters from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkOverdue = async () => {
    setMarking(true);
    setError('');
    setNotice('');
    try {
      const count = await markOverdueStudentFees();
      setNotice(`${count} fee${count === 1 ? '' : 's'} marked overdue.`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not run the overdue check.'));
    } finally {
      setMarking(false);
    }
  };

  const columns: DataTableColumn<StudentFee>[] = [
    {
      key: 'studentName',
      header: 'Student',
      sortable: true,
      accessor: (f) => f.studentName,
      render: (f) => <span className="font-medium text-slate-900">{f.studentName}</span>,
    },
    {
      key: 'className',
      header: 'Class',
      accessor: (f) => f.className,
      render: (f) => <span className="text-slate-600">{f.className}</span>,
    },
    {
      key: 'feeType',
      header: 'Fee type',
      accessor: (f) => f.feeType,
      render: (f) => <span className="text-slate-600">{formatEnumLabel(f.feeType)}</span>,
    },
    {
      key: 'dueAmount',
      header: 'Due',
      align: 'right',
      sortable: true,
      accessor: (f) => f.dueAmount,
      render: (f) => <span className="font-semibold text-red-600">₹{f.dueAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due date',
      sortable: true,
      accessor: (f) => f.dueDate,
      render: (f) => <span className="text-slate-600">{formatDate(f.dueDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (f) => <StudentFeeStatusBadge status={f.status} />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">Student fees flagged overdue.</p>
        <Button icon={RefreshCw} size="sm" variant="secondary" loading={marking} onClick={handleMarkOverdue}>
          Run overdue check
        </Button>
      </div>

      {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <DataTable
        columns={columns}
        data={fees}
        rowKey={(f) => f.id}
        loading={loading}
        emptyTitle="No defaulters"
        emptyDescription="No student fees are currently overdue."
      />
    </div>
  );
}
