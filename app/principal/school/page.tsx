'use client';

import { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, School as SchoolIcon, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteSchool, getSchoolDetail, getSchools, type School } from '@/lib/schoolService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import SchoolFormModal from '@/components/school/SchoolFormModal';
import SchoolDetailModal from '@/components/school/SchoolDetailModal';

export default function PrincipalSchoolPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingSchool, setViewingSchool] = useState<School | null>(null);
  const [viewLoadingId, setViewLoadingId] = useState<number | null>(null);

  const loadSchools = async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getSchools();
      setSchools(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load schools from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const openCreateModal = () => {
    setEditingSchool(null);
    setFormModalOpen(true);
  };

  const openEditModal = (school: School) => {
    setViewModalOpen(false);
    setEditingSchool(school);
    setFormModalOpen(true);
  };

  const handleView = async (id: number) => {
    setViewModalOpen(true);
    setViewingSchool(null);
    setViewLoadingId(id);
    setError('');
    try {
      const detail = await getSchoolDetail(id);
      setViewingSchool(detail);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load school details.'));
      setViewModalOpen(false);
    } finally {
      setViewLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this school? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteSchool(id);
      setSchools((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that school.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingSchool(null);
    await loadSchools();
  };

  const columns: DataTableColumn<School>[] = [
    {
      key: 'schoolName',
      header: 'School',
      sortable: true,
      accessor: (school) => school.schoolName,
      render: (school) => (
        <div>
          <p className="font-semibold text-slate-900">{school.schoolName}</p>
          <p className="text-xs text-slate-500">{school.schoolCode || '—'}</p>
        </div>
      ),
    },
    {
      key: 'affiliationBoard',
      header: 'Board',
      sortable: true,
      accessor: (school) => school.affiliationBoard,
      render: (school) => <span className="text-slate-600">{school.affiliationBoard || '—'}</span>,
    },
    {
      key: 'principalName',
      header: 'Principal',
      sortable: true,
      accessor: (school) => school.principalName,
      render: (school) => <span className="text-slate-600">{school.principalName || '—'}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (school) => (
        <div className="text-xs">
          <p className="text-slate-700">{school.email || '—'}</p>
          <p className="text-slate-500">{school.phoneNumber || '—'}</p>
        </div>
      ),
    },
    {
      key: 'strength',
      header: 'Students / Teachers',
      align: 'center',
      widthClassName: 'w-36',
      accessor: (school) => school.totalStudents,
      render: (school) => (
        <span className="font-medium text-slate-700">
          {school.totalStudents} / {school.totalTeachers}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (school) => (school.active ? 1 : 0),
      render: (school) => <StatusBadge active={school.active} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-24',
      render: (school) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Eye}
            label="View details"
            loading={viewLoadingId === school.id}
            onClick={(e) => {
              e.stopPropagation();
              handleView(school.id);
            }}
          />
          <IconButton
            icon={Pencil}
            label="Edit school"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(school);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete school"
            variant="danger"
            loading={deletingId === school.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(school.id);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SchoolIcon}
        title="School Management"
        description="View and manage school records — profile, contact details and address."
        actions={
          <Button icon={Plus} onClick={openCreateModal}>
            Add school
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
        data={schools}
        rowKey={(school) => school.id}
        loading={loading}
        emptyTitle="No schools yet"
        emptyDescription="Add your first school record to get started."
      />

      {formModalOpen && (
        <SchoolFormModal
          school={editingSchool}
          onClose={() => {
            setFormModalOpen(false);
            setEditingSchool(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {viewModalOpen && (
        <SchoolDetailModal
          school={viewingSchool}
          loading={viewLoadingId !== null}
          onClose={() => {
            setViewModalOpen(false);
            setViewingSchool(null);
          }}
          onEdit={() => viewingSchool && openEditModal(viewingSchool)}
        />
      )}
    </div>
  );
}
