'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Eye, Plus, Search, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getStaffMembers, type StaffMember, type StaffRole } from '@/lib/schoolService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { RoleBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import StaffFormModal from '@/components/staff/StaffFormModal';
import StaffDetailModal from '@/components/staff/StaffDetailModal';

export default function PrincipalStaffPage() {
  const [roleFilter, setRoleFilter] = useState<StaffRole | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);

  const loadStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const content = (await getStaffMembers({ role: roleFilter || undefined, search: activeSearch || undefined })).content;
      setStaff(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load staff from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, activeSearch]);

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
    await loadStaff();
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
      <SetPageTitle title="Staff Management" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="block text-sm">
            <span className="sr-only">Role</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as StaffRole | '')}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
            >
              <option value="">All roles</option>
              <option value="TEACHER">Teacher</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
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
                className="h-9 w-48 rounded-md border border-slate-200 bg-white pr-3 pl-8 text-sm text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              title="Search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-700 text-white transition-colors hover:bg-amber-800"
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
        data={staff}
        rowKey={(member) => member.id}
        loading={loading}
        emptyTitle="No staff yet"
        emptyDescription="Add your first staff member to get started."
      />

      {formModalOpen && <StaffFormModal onClose={() => setFormModalOpen(false)} onSaved={handleSaved} />}

      {viewingStaff && <StaffDetailModal staff={viewingStaff} onClose={() => setViewingStaff(null)} />}
    </div>
  );
}
