'use client';

import { useEffect, useState } from 'react';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteFeeStructure, getFeeStructures, type FeeStructure } from '@/lib/feeService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { FeeFrequencyBadge, FeeTypeBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import FeeStructureFormModal from '@/components/fee/FeeStructureFormModal';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

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

/** Fee structure management panel — one tab of the Fee Management page. Classes are filtered via a dropdown. */
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

  const handleDownloadFeeStructures = () => {
    const header = ['ID', 'Title', 'Class ID', 'Class Name', 'Academic Year', 'Fee Type', 'Frequency', 'Amount', 'Description', 'Created At'];
    const dataRows = feeStructures.map((f) => [
      String(f.id),
      f.title,
      String(f.classId),
      f.className || selectedClassName || '',
      f.academicYear,
      f.feeType,
      f.frequency,
      String(f.amount),
      f.description || '',
      f.createdAt || '',
    ]);
    const cName = (selectedClassName || 'all').replace(/\s+/g, '-').toLowerCase();
    downloadCsv(`fee-structures-${cName}-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...dataRows]);
  };

  const handleDownloadSingleStructure = (item: FeeStructure) => {
    const header = ['ID', 'Title', 'Class ID', 'Class Name', 'Academic Year', 'Fee Type', 'Frequency', 'Amount', 'Description', 'Created At'];
    const row = [
      String(item.id),
      item.title,
      String(item.classId),
      item.className || selectedClassName || '',
      item.academicYear,
      item.feeType,
      item.frequency,
      String(item.amount),
      item.description || '',
      item.createdAt || '',
    ];
    const slugTitle = item.title.replace(/\s+/g, '-').toLowerCase();
    downloadCsv(`fee-structure-${slugTitle}.csv`, [header, row]);
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
      widthClassName: 'w-28',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Download}
            label="Download fee structure"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadSingleStructure(item);
            }}
          />
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
      <div className="flex flex-wrap items-end justify-between gap-2">
        <SelectField
          label="Class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : '')}
          disabled={classesLoading || classes.length === 0}
          wrapperClassName="w-44"
        >
          {classesLoading && classes.length === 0 ? (
            <option value="">Loading classes…</option>
          ) : classes.length === 0 ? (
            <option value="">No classes</option>
          ) : (
            classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.className}
              </option>
            ))
          )}
        </SelectField>
        <div className="flex items-center gap-2">
          <Button
            icon={Download}
            variant="secondary"
            size="sm"
            disabled={feeStructures.length === 0}
            onClick={handleDownloadFeeStructures}
          >
            Download CSV
          </Button>
          <Button icon={Plus} size="sm" onClick={openCreateModal} disabled={classesLoading || classes.length === 0}>
            Add Fee Structure
          </Button>
        </div>
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
