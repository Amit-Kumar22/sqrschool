'use client';

import { useEffect, useState } from 'react';
import { CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteAcademicYear,
  getAcademicYears,
  type AcademicYear,
} from '@/lib/academicYearService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import AcademicYearFormModal from '@/components/academic-year/AcademicYearFormModal';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

export default function StaffAcademicYearPage() {
  const [items, setItems] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYear | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const content = (await getAcademicYears()).content;
      setItems(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load academic years from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: AcademicYear) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this academic year? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteAcademicYear(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that record.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadItems();
  };

  const columns: DataTableColumn<AcademicYear>[] = [
    {
      key: 'yearCode',
      header: 'Year',
      sortable: true,
      accessor: (item) => item.yearCode,
      render: (item) => <p className="font-semibold text-slate-900">{item.yearCode}</p>,
    },
    {
      key: 'startDate',
      header: 'Start date',
      sortable: true,
      accessor: (item) => item.startDate,
      render: (item) => <span className="text-slate-600">{formatDate(item.startDate)}</span>,
    },
    {
      key: 'endDate',
      header: 'End date',
      sortable: true,
      accessor: (item) => item.endDate,
      render: (item) => <span className="text-slate-600">{formatDate(item.endDate)}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => <span className="line-clamp-1 text-slate-600">{item.description || '—'}</span>,
    },
    {
      key: 'locked',
      header: 'Lock status',
      render: (item) => <StatusBadge active={!item.locked} activeLabel="Open" inactiveLabel="Locked" />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => (item.active ? 1 : 0),
      render: (item) => <StatusBadge active={item.active} />,
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
        icon={CalendarRange}
        title="Academic Year"
        description="Manage academic year terms for a school."
        actions={
          <Button icon={Plus} onClick={openCreateModal}>
            Add academic year
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No academic years yet"
        emptyDescription="Add the first academic year to get started."
      />

      {formModalOpen && (
        <AcademicYearFormModal
          item={editingItem}
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
