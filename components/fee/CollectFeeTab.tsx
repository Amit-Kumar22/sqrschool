'use client';

import { useEffect, useState } from 'react';
import { CircleDollarSign, History, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteStudentFee, getStudentFees, type StudentFee } from '@/lib/feeService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { FeeTypeBadge, StudentFeeStatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import StudentPicker from './shared/StudentPicker';
import RecordPaymentModal from './RecordPaymentModal';
import GenerateFeeModal from './GenerateFeeModal';
import FeePaymentsModal from './FeePaymentsModal';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');
const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export default function CollectFeeTab() {
  const [classId, setClassId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>('');
  const [studentName, setStudentName] = useState('');

  const [fees, setFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [payingItem, setPayingItem] = useState<StudentFee | null>(null);
  const [viewingItem, setViewingItem] = useState<StudentFee | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadFees = async () => {
    if (!studentId) {
      setFees([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const content = (await getStudentFees({ studentId })).content;
      setFees(content ?? []);
      setStudentName(content?.[0]?.studentName ?? '');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load fees for this student.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleDelete = async (fee: StudentFee) => {
    if (!confirm('Delete this fee record? This cannot be undone.')) return;
    setDeletingId(fee.id);
    setError('');
    try {
      await deleteStudentFee(fee.id);
      setFees((prev) => prev.filter((f) => f.id !== fee.id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this fee record.'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<StudentFee>[] = [
    {
      key: 'feeType',
      header: 'Fee type',
      sortable: true,
      accessor: (item) => item.feeType,
      render: (item) => <FeeTypeBadge feeType={item.feeType} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      accessor: (item) => item.amount,
      render: (item) => <span className="text-slate-700">{formatCurrency(item.amount)}</span>,
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      sortable: true,
      accessor: (item) => item.paidAmount,
      render: (item) => <span className="text-emerald-700">{formatCurrency(item.paidAmount)}</span>,
    },
    {
      key: 'dueAmount',
      header: 'Due',
      align: 'right',
      sortable: true,
      accessor: (item) => item.dueAmount,
      render: (item) => <span className="font-semibold text-slate-900">{formatCurrency(item.dueAmount)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due date',
      sortable: true,
      accessor: (item) => item.dueDate,
      render: (item) => <span className="text-slate-600">{formatDate(item.dueDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StudentFeeStatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-28',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={CircleDollarSign}
            label="Collect payment"
            variant="primary"
            disabled={item.status === 'PAID'}
            onClick={(e) => {
              e.stopPropagation();
              setPayingItem(item);
            }}
          />
          <IconButton
            icon={History}
            label="Payment history"
            onClick={(e) => {
              e.stopPropagation();
              setViewingItem(item);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
          />
        </div>
      ),
    },
  ];

  const totalDue = fees.reduce((sum, f) => sum + f.dueAmount, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <StudentPicker
          classId={classId}
          studentId={studentId}
          onChange={(c, s) => {
            setClassId(c);
            setStudentId(s);
          }}
        />
        <Button icon={Plus} size="sm" disabled={!classId || !studentId} onClick={() => setGenerateModalOpen(true)}>
          Generate Fee
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={fees}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle={studentId ? 'No fees yet' : 'Select a student'}
        emptyDescription={studentId ? 'Generate a fee for this student to get started.' : 'Pick a class and student above to view their fees.'}
      />

      {!loading && fees.length > 0 && (
        <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500">
          <span>Total due:</span>
          <strong className={totalDue > 0 ? 'text-red-600' : 'text-emerald-700'}>{formatCurrency(totalDue)}</strong>
        </div>
      )}

      {generateModalOpen && classId && studentId && (
        <GenerateFeeModal
          classId={classId}
          studentId={studentId}
          studentName={studentName || 'this student'}
          onClose={() => setGenerateModalOpen(false)}
          onSaved={async () => {
            setGenerateModalOpen(false);
            await loadFees();
          }}
        />
      )}

      {payingItem && (
        <RecordPaymentModal
          fee={payingItem}
          onClose={() => setPayingItem(null)}
          onSaved={async () => {
            setPayingItem(null);
            await loadFees();
          }}
        />
      )}

      {viewingItem && <FeePaymentsModal fee={viewingItem} onClose={() => setViewingItem(null)} />}
    </div>
  );
}
