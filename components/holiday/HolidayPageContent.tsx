'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteHoliday, getHolidays, type Holiday } from '@/lib/holidayService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import HolidayFormModal from '@/components/holiday/HolidayFormModal';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** Shared holiday-management page — rendered from both /staff/holiday and /teacher/holiday, same as FeeStructurePageContent. */
export default function HolidayPageContent() {
  const [items, setItems] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Holiday | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getHolidays();
      setItems(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load holidays from the server.'));
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

  const openEditModal = (item: Holiday) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this holiday? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteHoliday(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that holiday.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadItems();
  };

  const columns: DataTableColumn<Holiday>[] = [
    {
      key: 'holidayName',
      header: 'Holiday',
      sortable: true,
      accessor: (item) => item.holidayName,
      render: (item) => <p className="font-semibold text-slate-900">{item.holidayName}</p>,
    },
    {
      key: 'holidayDate',
      header: 'Date',
      sortable: true,
      accessor: (item) => item.holidayDate,
      render: (item) => <span className="text-slate-600">{formatDate(item.holidayDate)}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => <span className="line-clamp-1 text-slate-600">{item.description || '—'}</span>,
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
        icon={CalendarDays}
        title="Holidays"
        description="Manage the school's holiday calendar."
        actions={
          <Button icon={Plus} onClick={openCreateModal}>
            Add holiday
          </Button>
        }
      />

      {error && (
        <div className="animate-fade-in-up rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No holidays yet"
        emptyDescription="Add the first holiday to get started."
      />

      {formModalOpen && (
        <HolidayFormModal
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
