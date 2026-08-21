'use client';

import { useEffect, useState } from 'react';
import { BookMarked, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteSubject, getSubjects, type Subject } from '@/lib/subjectService';
import { fetchAcrossAllSchools, getSchools, type School } from '@/lib/schoolService';
import { useSchoolCode } from '@/lib/useSchoolCode';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import SubjectFormModal from '@/components/subject/SubjectFormModal';

export default function StaffSubjectPage() {
  const { schoolCode: selectedSchoolCode, loading: schoolsLoading, error: schoolError } = useSchoolCode();

  const [items, setItems] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameFilter, setNameFilter] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subject | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Only needed when the account has no schoolCode of its own — lets the
  // "Add subject" form ask which school to attach the new subject to, instead
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
        // Non-fatal — the "Add subject" school picker just stays empty.
      } finally {
        setSchoolsListLoading(false);
      }
    };
    loadSchools();
  }, [schoolsLoading, selectedSchoolCode]);

  const loadItems = async (schoolCode: string, subjectName: string) => {
    setLoading(true);
    setError('');
    try {
      const content = schoolCode
        ? (await getSubjects({ schoolCode, subjectName: subjectName || undefined })).content
        : await fetchAcrossAllSchools((code) => getSubjects({ schoolCode: code, subjectName: subjectName || undefined }));
      setItems(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load subjects from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolsLoading) return;
    loadItems(selectedSchoolCode, nameFilter);
  }, [selectedSchoolCode, schoolsLoading, nameFilter]);

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
    await loadItems(selectedSchoolCode, nameFilter);
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
    <div className="space-y-4">
      <PageHeader
        icon={BookMarked}
        title="Subject"
        description="Manage subjects for a school."
        actions={
          <Button
            icon={Plus}
            onClick={openCreateModal}
            disabled={schoolsLoading || (!selectedSchoolCode && (schoolsListLoading || schools.length === 0))}
          >
            Add subject
          </Button>
        }
      />

      <TextField
        label="Search"
        icon={Search}
        placeholder="Search by subject name"
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        wrapperClassName="max-w-xs"
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
        emptyTitle="No subjects yet"
        emptyDescription="Add the first subject to get started."
      />

      {formModalOpen && (
        <SubjectFormModal
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
