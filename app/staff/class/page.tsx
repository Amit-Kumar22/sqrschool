'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteClass, getClasses, type SchoolClass } from '@/lib/classService';
import { fetchAcrossAllSchools, getSchools, type School } from '@/lib/schoolService';
import { useSchoolCode } from '@/lib/useSchoolCode';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import ClassFormModal from '@/components/class/ClassFormModal';

export default function StaffClassPage() {
  const { schoolCode: selectedSchoolCode, loading: schoolsLoading, error: schoolError } = useSchoolCode();

  const [items, setItems] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SchoolClass | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Only needed when the account has no schoolCode of its own — lets the
  // "Add class" form ask which school to attach the new class to, instead
  // of staying disabled forever for admins who manage more than one school.
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsListLoading, setSchoolsListLoading] = useState(false);

  useEffect(() => {
    if (schoolsLoading || selectedSchoolCode) return;
    const loadSchools = async () => {
      setSchoolsListLoading(true);
      try {
        const page = await getSchools();
        setSchools(page.content);
      } catch {
        // Non-fatal — the "Add class" school picker just stays empty.
      } finally {
        setSchoolsListLoading(false);
      }
    };
    loadSchools();
  }, [schoolsLoading, selectedSchoolCode]);

  const loadItems = async (schoolCode: string) => {
    setLoading(true);
    setError('');
    try {
      const content = schoolCode
        ? (await getClasses({ schoolCode })).content
        : await fetchAcrossAllSchools((code) => getClasses({ schoolCode: code }));
      setItems(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load classes from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolsLoading) return;
    loadItems(selectedSchoolCode);
  }, [selectedSchoolCode, schoolsLoading]);

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
        icon={BookOpen}
        title="Class"
        description="Manage classes for a school."
        actions={
          <Button
            icon={Plus}
            onClick={openCreateModal}
            disabled={schoolsLoading || (!selectedSchoolCode && (schoolsListLoading || schools.length === 0))}
          >
            Add class
          </Button>
        }
      />

      {(error || schoolError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || schoolError}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading || schoolsLoading}
        emptyTitle="No classes yet"
        emptyDescription="Add the first class to get started."
      />

      {formModalOpen && (
        <ClassFormModal
          item={editingItem}
          schoolCode={selectedSchoolCode}
          schools={schools}
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
