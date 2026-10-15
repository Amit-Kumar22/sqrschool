'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bus, History, Link2Off, Pencil, Phone, Plus, RefreshCw, Search, UserX } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deactivateTransportStaff,
  DRIVER_DESIGNATIONS,
  EMPLOYMENT_STATUSES,
  getTransportStaff,
  getVehicles,
  STAFF_DESIGNATIONS,
  unassignStaffVehicle,
  type EmploymentStatus,
  type StaffDesignation,
  type TransportStaff,
  type Vehicle,
} from '@/lib/transportService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';
import TransportStaffFormModal from './TransportStaffFormModal';
import AssignVehicleModal from './AssignVehicleModal';
import StaffSalaryHistoryModal from './StaffSalaryHistoryModal';
import { EnumBadge, enumLabel, ErrorBanner, ExpiryCell, FilterBar, formatMoney, MiniStat, Pill } from './transportUi';
import { useDebounced } from './useDebounced';

/** Transport crew register — drivers (with licence validity), conductors, helpers and in-charges. */
export default function StaffTab() {
  const [staff, setStaff] = useState<TransportStaff[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [designation, setDesignation] = useState<StaffDesignation | ''>('');
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | ''>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search.trim(), 350);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransportStaff | null>(null);
  const [assigning, setAssigning] = useState<TransportStaff | null>(null);
  const [historyFor, setHistoryFor] = useState<TransportStaff | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    getVehicles({ active: true })
      .then((p) => setVehicles(p.content))
      .catch(() => setVehicles([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getTransportStaff({
        designation: designation || undefined,
        employmentStatus: employmentStatus || undefined,
        search: debouncedSearch || undefined,
      });
      setStaff(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load transport staff.'));
    } finally {
      setLoading(false);
    }
  }, [designation, employmentStatus, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = staff.filter((s) => s.employmentStatus === 'ACTIVE');
    return {
      total: staff.length,
      drivers: active.filter((s) => DRIVER_DESIGNATIONS.includes(s.designation)).length,
      expiredLicences: staff.filter((s) => s.licenceExpired && s.employmentStatus !== 'RELIEVED').length,
      payroll: active.reduce((sum, s) => sum + (s.monthlySalary || 0), 0),
    };
  }, [staff]);

  const runAction = async (s: TransportStaff, action: () => Promise<void>, failMsg: string) => {
    setBusyId(s.id);
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, failMsg));
    } finally {
      setBusyId(null);
    }
  };

  const columns: DataTableColumn<TransportStaff>[] = [
    {
      key: 'name',
      header: 'Staff',
      sortable: true,
      accessor: (s) => s.name,
      render: (s) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
            {s.name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{s.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-slate-400">
              <Phone size={11} />
              {s.mobileNumber || '—'}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'designation', header: 'Designation', sortable: true, accessor: (s) => s.designation, render: (s) => <EnumBadge value={s.designation} /> },
    {
      key: 'licence',
      header: 'Licence',
      sortable: true,
      accessor: (s) => s.licenceExpiry,
      render: (s) =>
        s.licenceNumber || s.licenceExpiry ? (
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-slate-700">{s.licenceNumber || '—'}</p>
            <ExpiryCell date={s.licenceExpiry} />
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      sortable: true,
      accessor: (s) => s.assignedVehicleNumber,
      render: (s) =>
        s.assignedVehicleNumber ? (
          <Pill tone="indigo">
            <Bus size={11} />
            {s.assignedVehicleNumber}
          </Pill>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        ),
    },
    {
      key: 'monthlySalary',
      header: 'Salary',
      align: 'right',
      sortable: true,
      accessor: (s) => s.monthlySalary,
      render: (s) => <span className="font-semibold text-slate-700">{formatMoney(s.monthlySalary)}</span>,
    },
    { key: 'employmentStatus', header: 'Status', sortable: true, accessor: (s) => s.employmentStatus, render: (s) => <EnumBadge value={s.employmentStatus} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-0.5">
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={() => {
              setEditing(s);
              setFormOpen(true);
            }}
          />
          <IconButton icon={Bus} label="Assign vehicle" variant="primary" disabled={s.employmentStatus === 'RELIEVED'} onClick={() => setAssigning(s)} />
          {s.assignedVehicleId && (
            <IconButton
              icon={Link2Off}
              label="Unassign vehicle"
              loading={busyId === s.id}
              onClick={() => runAction(s, () => unassignStaffVehicle(s.id), 'Could not unassign the vehicle.')}
            />
          )}
          <IconButton icon={History} label="Salary history" onClick={() => setHistoryFor(s)} />
          <IconButton
            icon={UserX}
            label="Relieve (deactivate)"
            variant="danger"
            disabled={s.employmentStatus === 'RELIEVED'}
            onClick={() => {
              if (!confirm(`Mark ${s.name} as relieved? They will be removed from active duty.`)) return;
              runAction(s, () => deactivateTransportStaff(s.id), 'Could not deactivate the staff member.');
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards — hidden for now, kept for later.
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Staff listed" value={String(stats.total)} />
        <MiniStat label="Active drivers" value={String(stats.drivers)} tone="indigo" />
        <MiniStat label="Expired licences" value={String(stats.expiredLicences)} tone={stats.expiredLicences ? 'red' : 'emerald'} />
        <MiniStat label="Monthly payroll" value={formatMoney(stats.payroll)} tone="emerald" hint="Active staff" />
      </div>
      */}

      <ErrorBanner message={error} />

      <FilterBar>
        <TextField
          label="Search"
          icon={Search}
          placeholder="Name, mobile or licence"
          wrapperClassName="w-full sm:w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectField label="Designation" wrapperClassName="w-48" value={designation} onChange={(e) => setDesignation(e.target.value as StaffDesignation | '')}>
          <option value="">All designations</option>
          {STAFF_DESIGNATIONS.map((d) => (
            <option key={d} value={d}>
              {enumLabel(d)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Employment"
          wrapperClassName="w-40"
          value={employmentStatus}
          onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus | '')}
        >
          <option value="">All statuses</option>
          {EMPLOYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {enumLabel(s)}
            </option>
          ))}
        </SelectField>
        {(designation || employmentStatus || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-0.5"
            onClick={() => {
              setDesignation('');
              setEmploymentStatus('');
              setSearch('');
            }}
          >
            Clear filters
          </Button>
        )}
        <div className="mb-0.5 ml-auto flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add Staff
          </Button>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={staff}
        rowKey={(s) => s.id}
        loading={loading}
        emptyTitle="No transport staff found"
        emptyDescription={designation || employmentStatus || search ? 'No staff match the current filters.' : 'Add drivers, conductors and helpers to get started.'}
      />

      {formOpen && (
        <TransportStaffFormModal
          item={editing}
          vehicles={vehicles}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
      {assigning && (
        <AssignVehicleModal
          staff={assigning}
          vehicles={vehicles}
          onClose={() => setAssigning(null)}
          onSaved={() => {
            setAssigning(null);
            load();
          }}
        />
      )}
      {historyFor && <StaffSalaryHistoryModal staff={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
}
