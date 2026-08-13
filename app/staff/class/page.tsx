'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteClass, getClasses, type SchoolClass } from '@/lib/classService';
import { getSchools, type School } from '@/lib/schoolService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import ClassFormModal from '@/components/class/ClassFormModal';

export default function StaffClassPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState('');

  const [items, setItems] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SchoolClass | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const loadSchools = async () => {
      setSchoolsLoading(true);
      setError('');
      try {
        const page = await getSchools();
        setSchools(page.content);
        if (page.content.length > 0) setSelectedSchoolCode(page.content[0].schoolCode);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load schools from the server.'));
      } finally {
        setSchoolsLoading(false);
      }
    };
    loadSchools();
  }, []);

  const loadItems = async (schoolCode: string) => {
    if (!schoolCode) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const page = await getClasses({ schoolCode });
      setItems(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load classes from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(selectedSchoolCode);
  }, [selectedSchoolCode]);

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
    await loadItems(selectedSchoolCode);
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
            title="Edit"
            className="rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            disabled={deletingId === item.id}
            title="Delete"
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {deletingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={BookOpen}
        title="Class"
        description="Manage classes for a school."
        actions={
          <button
            onClick={openCreateModal}
            disabled={schoolsLoading || schools.length === 0}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-premium-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={16} /> Add class
          </button>
        }
      />

      {!schoolsLoading && schools.length === 0 && !error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Add a school first — classes are managed per school.
        </div>
      )}

      <label className="block text-sm">
        <span className="sr-only">School</span>
        <select
          value={selectedSchoolCode}
          onChange={(e) => setSelectedSchoolCode(e.target.value)}
          disabled={schoolsLoading || schools.length === 0}
          className="h-9 min-w-48 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-50"
        >
          {schools.length === 0 && <option value="">No schools yet</option>}
          {schools.map((school) => (
            <option key={school.id} value={school.schoolCode}>
              {school.schoolName} ({school.schoolCode})
            </option>
          ))}
        </select>
      </label>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading || schoolsLoading}
        emptyTitle="No classes yet"
        emptyDescription={schools.length === 0 ? 'Add a school before adding classes.' : 'Add the first class to get started.'}
      />

      {formModalOpen && (
        <ClassFormModal
          item={editingItem}
          schools={schools}
          defaultSchoolCode={selectedSchoolCode}
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
