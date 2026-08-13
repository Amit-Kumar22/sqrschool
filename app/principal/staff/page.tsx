'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Eye, Plus, Search, Users, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getSchools, getStaffMembers, type School, type StaffMember, type StaffRole } from '@/lib/schoolService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { RoleBadge } from '@/components/ui/Badge';
import StaffFormModal from '@/components/staff/StaffFormModal';
import StaffDetailModal from '@/components/staff/StaffDetailModal';

export default function PrincipalStaffPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState('');

  const [roleFilter, setRoleFilter] = useState<StaffRole | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);

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

  const loadStaff = async (schoolCode: string) => {
    if (!schoolCode) {
      setStaff([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const page = await getStaffMembers({
        schoolCode,
        role: roleFilter || undefined,
        search: activeSearch || undefined,
      });
      setStaff(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load staff from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff(selectedSchoolCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchoolCode, roleFilter, activeSearch]);

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
    await loadStaff(selectedSchoolCode);
  };

  const columns: DataTableColumn<StaffMember>[] = [
    {
      key: 'fullName',
      header: 'Name',
      sortable: true,
      accessor: (member) => member.fullName,
      render: (member) => <p className="font-semibold text-slate-900">{member.fullName}</p>,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      accessor: (member) => member.email,
      render: (member) => <span className="text-slate-600">{member.email || '—'}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      accessor: (member) => member.phone,
      render: (member) => <span className="text-slate-600">{member.phone || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      accessor: (member) => member.role,
      render: (member) => <RoleBadge role={member.role} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-16',
      render: (member) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingStaff(member);
            }}
            title="View details"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Staff Management"
        description="View teaching and non-teaching staff, and add new members to a school."
        actions={
          <button
            onClick={() => setFormModalOpen(true)}
            disabled={schoolsLoading || schools.length === 0}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-premium disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
          >
            <Plus size={16} /> Add staff
          </button>
        }
      />

      {!schoolsLoading && schools.length === 0 && !error && (
        <div className="animate-fade-in-up rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Add a school first — staff are managed per school.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="block text-sm">
          <span className="sr-only">School</span>
          <select
            value={selectedSchoolCode}
            onChange={(e) => setSelectedSchoolCode(e.target.value)}
            disabled={schoolsLoading || schools.length === 0}
            className="h-9 min-w-48 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-50"
          >
            {schools.length === 0 && <option value="">No schools yet</option>}
            {schools.map((school) => (
              <option key={school.id} value={school.schoolCode}>
                {school.schoolName} ({school.schoolCode})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="sr-only">Role</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as StaffRole | '')}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
          >
            <option value="">All roles</option>
            <option value="TEACHER">Teacher</option>
            <option value="STAFF">Staff</option>
          </select>
        </label>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search staff"
              className="h-9 w-48 rounded-md border border-slate-200 bg-white pr-3 pl-8 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
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
      </div>

      {error && (
        <div className="animate-fade-in-up rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={staff}
        rowKey={(member) => member.id}
        loading={loading || schoolsLoading}
        emptyTitle="No staff yet"
        emptyDescription={
          schools.length === 0
            ? 'Add a school before adding staff.'
            : 'Add your first staff member to get started.'
        }
      />

      {formModalOpen && (
        <StaffFormModal
          schools={schools}
          defaultSchoolCode={selectedSchoolCode}
          onClose={() => setFormModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {viewingStaff && <StaffDetailModal staff={viewingStaff} onClose={() => setViewingStaff(null)} />}
    </div>
  );
}
