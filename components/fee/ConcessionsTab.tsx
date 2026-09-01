'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteStudentConcession,
  getFeeStructures,
  getStudentConcessions,
  type FeeStructure,
  type StudentConcession,
} from '@/lib/feeService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { ConcessionStatusBadge, ConcessionTypeBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import StudentPicker from './shared/StudentPicker';
import ConcessionFormModal from './ConcessionFormModal';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');
const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

/** Fee concession management panel — one tab of the Fee Management page. Concessions are scoped to one student at a time, picked the same way as Collect Fee. */
export default function ConcessionsTab() {
  const [classId, setClassId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>('');

  const [concessions, setConcessions] = useState<StudentConcession[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeStructuresLoading, setFeeStructuresLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentConcession | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadConcessions = async () => {
    if (!studentId) {
      setConcessions([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const content = (await getStudentConcessions({ studentId })).content;
      setConcessions(content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load concessions for this student.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConcessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    if (!classId) {
      setFeeStructures([]);
      return;
    }
    let cancelled = false;
    setFeeStructuresLoading(true);
    getFeeStructures({ classId })
      .then((page) => {
        if (!cancelled) setFeeStructures(page.content ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setFeeStructures([]);
          setError(apiErrorMessage(err, 'Could not load fee structures for this class.'));
        }
      })
      .finally(() => {
        if (!cancelled) setFeeStructuresLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: StudentConcession) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this concession? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteStudentConcession(id);
      setConcessions((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that concession.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadConcessions();
  };

  const feeStructureTitle = (feeStructureId: number) =>
    feeStructures.find((fs) => fs.id === feeStructureId)?.title ?? `#${feeStructureId}`;

  const formatDiscount = (item: StudentConcession) =>
    item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : formatCurrency(item.discountValue);

  const columns: DataTableColumn<StudentConcession>[] = [
    {
      key: 'feeStructureId',
      header: 'Fee structure',
      accessor: (item) => feeStructureTitle(item.feeStructureId),
      render: (item) => <span className="font-medium text-slate-900">{feeStructureTitle(item.feeStructureId)}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      accessor: (item) => item.type,
      render: (item) => <ConcessionTypeBadge type={item.type} />,
    },
    {
      key: 'discountValue',
      header: 'Discount',
      align: 'right',
      sortable: true,
      accessor: (item) => item.discountValue,
      render: (item) => <span className="font-medium text-slate-700">{formatDiscount(item)}</span>,
    },
    {
      key: 'maxDiscountAmount',
      header: 'Max discount',
      align: 'right',
      sortable: true,
      accessor: (item) => item.maxDiscountAmount,
      render: (item) => <span className="text-slate-500">{item.maxDiscountAmount ? formatCurrency(item.maxDiscountAmount) : '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <ConcessionStatusBadge status={item.status} />,
    },
    {
      key: 'remarks',
      header: 'Remarks',
      accessor: (item) => item.remarks,
      render: (item) => <span className="text-slate-600">{item.remarks || '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      accessor: (item) => item.createdAt,
      render: (item) => <span className="text-slate-500">{formatDate(item.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-20',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
          />
        </div>
      ),
    },
  ];

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
        <div className="flex flex-col items-end gap-1">
          <Button
            icon={Plus}
            size="sm"
            disabled={!studentId || feeStructuresLoading || feeStructures.length === 0}
            title={
              studentId && !feeStructuresLoading && feeStructures.length === 0
                ? 'This class has no fee structures yet — add one in the Fee Structure tab first.'
                : undefined
            }
            onClick={openCreateModal}
          >
            Add Concession
          </Button>
          {studentId && !feeStructuresLoading && feeStructures.length === 0 && (
            <span className="text-right text-xs text-amber-600">No fee structures for this class yet.</span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={concessions}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle={studentId ? 'No concessions yet' : 'Select a student'}
        emptyDescription={studentId ? 'Add a concession for this student to get started.' : 'Pick a class and student above to view their concessions.'}
      />

      {formModalOpen && studentId && (
        <ConcessionFormModal
          item={editingItem}
          studentId={studentId}
          feeStructures={feeStructures}
          onClose={() => {
            setFormModalOpen(false);
            setEditingItem(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
