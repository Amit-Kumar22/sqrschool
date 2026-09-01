'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteSubject, getSubjects, type Subject } from '@/lib/subjectService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import SubjectFormModal from '@/components/subject/SubjectFormModal';

/** Subject catalog — plain CRUD list. Every subject here is what the Assign Subjects and Summary tabs cross-reference by subjectId. */
export default function SubjectsTab() {
  const [items, setItems] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameFilter, setNameFilter] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subject | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadItems = async (subjectName: string) => {
    setLoading(true);
    setError('');
    try {
      const content = (await getSubjects({ subjectName: subjectName || undefined })).content;
      setItems(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load subjects from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(nameFilter);
  }, [nameFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: Subject) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subject? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteSubject(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that subject.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadItems(nameFilter);
  };

  const columns: DataTableColumn<Subject>[] = [
    {
      key: 'subjectName',
      header: 'Subject',
      sortable: true,
      accessor: (item) => item.subjectName,
      render: (item) => <p className="font-semibold text-slate-900">{item.subjectName}</p>,
    },
    {
      key: 'subjectCode',
      header: 'Code',
      sortable: true,
      accessor: (item) => item.subjectCode,
      render: (item) => <span className="text-slate-600">{item.subjectCode}</span>,
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
      <div className="flex flex-wrap items-end justify-between gap-2">
        <TextField
          label="Search"
          icon={Search}
          placeholder="Search by subject name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          wrapperClassName="max-w-xs"
        />

        <Button icon={Plus} onClick={openCreateModal}>
          Add subject
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No subjects yet"
        emptyDescription="Add the first subject to get started."
      />

      {formModalOpen && (
        <SubjectFormModal
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
