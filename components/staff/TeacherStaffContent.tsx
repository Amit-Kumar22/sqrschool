'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getAllTeacherStaff, type TeacherStaffMember } from '@/lib/schoolService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StaffFormModal from '@/components/staff/StaffFormModal';

export default function TeacherStaffContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [teachers, setTeachers] = useState<TeacherStaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);

  const loadTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const content = (await getAllTeacherStaff({ search: activeSearch || undefined })).content;
      setTeachers(content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load teachers from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm.trim());
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    await loadTeachers();
  };

  const columns: DataTableColumn<TeacherStaffMember>[] = [
    {
      key: 'name',
      header: 'Teacher',
      sortable: true,
      accessor: (item) => item.teacherUser?.fullName,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.teacherUser?.fullName || '—'}</p>
          <p className="text-xs text-slate-500">{item.teacherUser?.email}</p>
        </div>
      ),
    },
    {
      key: 'employeeCode',
      header: 'Employee Code',
      sortable: true,
      accessor: (item) => item.employeeCode,
      render: (item) => <span className="text-slate-600">{item.employeeCode || '—'}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      accessor: (item) => item.teacherUser?.phone,
      render: (item) => <span className="text-slate-600">{item.teacherUser?.phone || '—'}</span>,
    },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      accessor: (item) => item.subject?.subjectName,
      render: (item) => <span className="text-slate-600">{item.subject?.subjectName || '—'}</span>,
    },
    {
      key: 'qualification',
      header: 'Qualification',
      render: (item) => <span className="text-slate-600">{item.qualification || '—'}</span>,
    },
    {
      key: 'experience',
      header: 'Experience',
      align: 'center',
      widthClassName: 'w-24',
      accessor: (item) => item.experienceYears ?? -1,
      render: (item) => (
        <span className="text-slate-600">{item.experienceYears != null ? `${item.experienceYears} yrs` : '—'}</span>
      ),
    },
    {
      key: 'assignedClasses',
      header: 'Assigned Classes',
      render: (item) => (
        <span className="text-slate-600">
          {item.assignedClasses?.length ? item.assignedClasses.map((c) => c.className).join(', ') : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => (item.active ? 1 : 0),
      render: (item) => <StatusBadge active={item.active} />,
    },
  ];

  return (
    <div className="space-y-6">
      <SetPageTitle title="Teachers" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone or employee code"
              className="h-9 w-72 rounded-md border border-slate-200 bg-white pr-3 pl-8 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            title="Search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
          >
            <Search size={15} />
          </button>
          {activeSearch && (
            <button
              type="button"
              onClick={clearSearch}
              title="Clear search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <X size={15} />
            </button>
          )}
        </form>

        <Button icon={Plus} onClick={() => setFormModalOpen(true)}>
          Add staff
        </Button>
      </div>

      {error && (
        <div className="animate-fade-in-up rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={teachers}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No teachers yet"
        emptyDescription="Add your first teacher to get started."
      />

      {formModalOpen && <StaffFormModal onClose={() => setFormModalOpen(false)} onSaved={handleSaved} />}
    </div>
  );
}
