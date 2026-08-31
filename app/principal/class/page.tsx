'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteClass, getClasses, type SchoolClass } from '@/lib/classService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import ClassFormModal from '@/components/class/ClassFormModal';

export default function StaffClassPage() {
  const [items, setItems] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SchoolClass | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const content = (await getClasses()).content;
      setItems(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load classes from the server.'));
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

  const openEditModal = (item: SchoolClass) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this class? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteClass(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that class.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadItems();
  };

  const columns: DataTableColumn<SchoolClass>[] = [
    {
      key: 'className',
      header: 'Class',
      sortable: true,
      accessor: (item) => item.className,
      render: (item) => <p className="font-semibold text-slate-900">{item.className}</p>,
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
      <SetPageTitle title="Class" />

      <div className="flex justify-end">
        <Button icon={Plus} onClick={openCreateModal}>
          Add class
        </Button>
      </div>

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
        emptyTitle="No classes yet"
        emptyDescription="Add the first class to get started."
      />

      {formModalOpen && (
        <ClassFormModal
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
