'use client';

import { useEffect, useState } from 'react';
import { IndianRupee, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteFeeStructure, getFeeStructures, type FeeStructure } from '@/lib/feeService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getAcademicYears, type AcademicYear } from '@/lib/academicYearService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { FeeTypeBadge, StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import FeeStructureFormModal from '@/components/fee/FeeStructureFormModal';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

/** Fee structure management page — shared between the Principal and Staff panels (see their /fee-structure routes). */
export default function FeeStructurePageContent() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classFilter, setClassFilter] = useState<number | ''>('');

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState<number | ''>('');

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
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes from the server.'));
      } finally {
        setClassesLoading(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadYears = async () => {
      setYearsLoading(true);
      setError('');
      try {
        const content = (await getAcademicYears()).content;
        setAcademicYears(content);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load academic years from the server.'));
      } finally {
        setYearsLoading(false);
      }
    };
    loadYears();
  }, []);

  const loadFeeStructures = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { classId: classFilter || undefined, academicYearId: yearFilter || undefined };
      const content = (await getFeeStructures(params)).content;
      setFeeStructures(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load fee structures from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, yearFilter]);

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
      key: 'className',
      header: 'Class',
      sortable: true,
      accessor: (item) => item.className,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.className}</p>
          <p className="text-xs text-slate-500">{item.yearCode}</p>
        </div>
      ),
    },
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
      sortable: true,
      accessor: (item) => item.amount,
      render: (item) => <span className="font-medium text-slate-700">₹{item.amount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'dueMonth',
      header: 'Due month',
      sortable: true,
      accessor: (item) => item.dueMonth,
      render: (item) => (
        <span className="text-slate-600">
          {new Date(2000, item.dueMonth - 1, 1).toLocaleString('en-US', { month: 'long' })}
        </span>
      ),
    },
    {
      key: 'optional',
      header: 'Optional',
      render: (item) => <StatusBadge active={item.optional} activeLabel="Optional" inactiveLabel="Mandatory" />,
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
    <div className="space-y-4">
      <PageHeader
        icon={IndianRupee}
        title="Fee Structure"
        description="Define fee structures per class and academic year."
        actions={
          <Button icon={Plus} onClick={openCreateModal} disabled={classesLoading || classes.length === 0 || yearsLoading || academicYears.length === 0}>
            Add fee structure
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SelectField
          label="Class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.className}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Academic year"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All academic years</option>
          {academicYears.map((year) => (
            <option key={year.id} value={year.id}>
              {year.yearCode}
            </option>
          ))}
        </SelectField>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={feeStructures}
        rowKey={(item) => item.id}
        loading={loading || classesLoading || yearsLoading}
        emptyTitle="No fee structures yet"
        emptyDescription={
          classes.length === 0
            ? 'Add a class before defining a fee structure.'
            : academicYears.length === 0
              ? 'Add an academic year before defining a fee structure.'
              : 'Add the first fee structure to get started.'
        }
      />

      {formModalOpen && (
        <FeeStructureFormModal
          item={editingItem}
          classes={classes}
          academicYears={academicYears}
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
