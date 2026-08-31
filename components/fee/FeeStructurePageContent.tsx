'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteFeeStructure, getFeeStructures, type FeeStructure } from '@/lib/feeService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { FeeFrequencyBadge, FeeTypeBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import TabPill from '@/components/ui/TabPill';
import FeeStructureFormModal from '@/components/fee/FeeStructureFormModal';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

/** Fee structure management panel — one tab of the Fee Management page. Classes are browsed as pills rather than a dropdown since a school only has a handful. */
export default function FeeStructurePageContent() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  // Starts true (not false) so the fee-structures effect below skips its
  // first run on mount — otherwise it fires with classFilter still '' in
  // the same commit as loadClasses's own setClassesLoading(true), before
  // that update has flushed, and fetches the unfiltered list once before
  // classes resolve and correct it.
  const [classesLoading, setClassesLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<number | ''>('');

  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeStructure | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      setClassesLoading(true);
      setError('');
      try {
        const content = (await getClasses()).content;
        setClasses(content);
        setClassFilter((prev) => prev || (content[0]?.id ?? ''));
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes from the server.'));
      } finally {
        setClassesLoading(false);
      }
    };
    loadClasses();
  }, []);

  const loadFeeStructures = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { classId: classFilter || undefined };
      const content = (await getFeeStructures(params)).content;
      setFeeStructures(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load fee structures from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classesLoading) return;
    loadFeeStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classesLoading, classFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: FeeStructure) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this fee structure? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteFeeStructure(id);
      setFeeStructures((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that fee structure.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadFeeStructures();
  };

  const columns: DataTableColumn<FeeStructure>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      accessor: (item) => item.title,
      render: (item) => <p className="font-semibold text-slate-900">{item.title}</p>,
    },
    {
      key: 'feeType',
      header: 'Fee type',
      sortable: true,
      accessor: (item) => item.feeType,
      render: (item) => <FeeTypeBadge feeType={item.feeType} />,
    },
    {
      key: 'academicYear',
      header: 'Academic Year',
      sortable: true,
      accessor: (item) => item.academicYear,
      render: (item) => <span className="text-slate-600">{item.academicYear || '—'}</span>,
    },
    {
      key: 'frequency',
      header: 'Frequency',
      sortable: true,
      accessor: (item) => item.frequency,
      render: (item) => <FeeFrequencyBadge frequency={item.frequency} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      accessor: (item) => item.amount,
      render: (item) => <span className="font-medium text-slate-700">₹{item.amount.toLocaleString('en-IN')}</span>,
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

  const selectedClassName = classes.find((cls) => cls.id === classFilter)?.className;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="scrollbar-thin flex flex-wrap gap-1 overflow-x-auto">
          {classesLoading && classes.length === 0 ? (
            <span className="px-1 text-xs text-slate-400">Loading classes…</span>
          ) : (
            classes.map((cls) => (
              <TabPill key={cls.id} label={cls.className} active={classFilter === cls.id} onClick={() => setClassFilter(cls.id)} />
            ))
          )}
        </div>
        <Button icon={Plus} size="sm" onClick={openCreateModal} disabled={classesLoading || classes.length === 0}>
          Add Fee Structure
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm font-semibold text-slate-900">
        {selectedClassName ? `Class ${selectedClassName} — Fee Structures` : 'Fee Structures'}
      </p>

      <DataTable
        columns={columns}
        data={feeStructures}
        rowKey={(item) => item.id}
        loading={loading || classesLoading}
        emptyTitle="No fee structures yet"
        emptyDescription={
          classes.length === 0
            ? 'Add a class before defining a fee structure.'
            : 'Add the first fee structure to get started.'
        }
      />

      {formModalOpen && (
        <FeeStructureFormModal
          item={editingItem}
          classes={classes}
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
