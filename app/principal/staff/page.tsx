'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Eye, Plus, Search, Users, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { fetchAcrossAllSchools, getSchools, getStaffMembers, type School, type StaffMember, type StaffRole } from '@/lib/schoolService';
import { useSchoolCode } from '@/lib/useSchoolCode';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { RoleBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import StaffFormModal from '@/components/staff/StaffFormModal';
import StaffDetailModal from '@/components/staff/StaffDetailModal';

export default function PrincipalStaffPage() {
  const { schoolCode: selectedSchoolCode, loading: schoolsLoading, error: schoolError } = useSchoolCode();

  const [roleFilter, setRoleFilter] = useState<StaffRole | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);

  // Only needed when the account has no schoolCode of its own — lets the
  // "Add staff" form ask which school to attach the new member to, instead
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
        // Non-fatal — the "Add staff" school picker just stays empty.
      } finally {
        setSchoolsListLoading(false);
      }
    };
    loadSchools();
  }, [schoolsLoading, selectedSchoolCode]);

  const loadStaff = async (schoolCode: string) => {
    setLoading(true);
    setError('');
    try {
      const fetchFor = (code: string) =>
        getStaffMembers({ schoolCode: code, role: roleFilter || undefined, search: activeSearch || undefined });
      const content = schoolCode ? (await fetchFor(schoolCode)).content : await fetchAcrossAllSchools(fetchFor);
      setStaff(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load staff from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolsLoading) return;
    loadStaff(selectedSchoolCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchoolCode, schoolsLoading, roleFilter, activeSearch]);

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
          <IconButton
            icon={Eye}
            label="View details"
            onClick={(e) => {
              e.stopPropagation();
              setViewingStaff(member);
            }}
          />
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
          <Button
            icon={Plus}
            onClick={() => setFormModalOpen(true)}
            disabled={schoolsLoading || (!selectedSchoolCode && (schoolsListLoading || schools.length === 0))}
          >
            Add staff
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
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

      {(error || schoolError) && (
        <div className="animate-fade-in-up rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || schoolError}
        </div>
      )}

      <DataTable
        columns={columns}
        data={staff}
        rowKey={(member) => member.id}
        loading={loading || schoolsLoading}
        emptyTitle="No staff yet"
        emptyDescription="Add your first staff member to get started."
      />

      {formModalOpen && (
        <StaffFormModal
          schoolCode={selectedSchoolCode}
          schools={schools}
          onClose={() => setFormModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {viewingStaff && <StaffDetailModal staff={viewingStaff} onClose={() => setViewingStaff(null)} />}
    </div>
  );
}
