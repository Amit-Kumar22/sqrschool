'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bus, Pencil, Plus, Power, PowerOff, RefreshCw, Search } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deactivateVehicle,
  getVehicles,
  reactivateVehicle,
  VEHICLE_TYPES,
  type Vehicle,
  type VehicleType,
} from '@/lib/transportService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';
import { StatusBadge } from '@/components/ui/Badge';
import VehicleFormModal from './VehicleFormModal';
import { daysUntil, EnumBadge, enumLabel, ErrorBanner, ExpiryCell, FilterBar, MiniStat } from './transportUi';
import { useDebounced } from './useDebounced';

type ActiveFilter = '' | 'true' | 'false';

const docDates = (v: Vehicle) => [v.insuranceExpiry, v.fitnessExpiry, v.permitExpiry, v.pucExpiry];

/** Fleet register — vehicles with their four statutory document expiries at a glance. */
export default function VehiclesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [typeFilter, setTypeFilter] = useState<VehicleType | ''>('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search.trim(), 350);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getVehicles({
        vehicleType: typeFilter || undefined,
        active: activeFilter === '' ? undefined : activeFilter === 'true',
        search: debouncedSearch || undefined,
      });
      setVehicles(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load vehicles.'));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, activeFilter, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = vehicles.filter((v) => v.active);
    let expired = 0;
    let dueSoon = 0;
    for (const v of active) {
      for (const d of docDates(v)) {
        const days = daysUntil(d);
        if (days === null) continue;
        if (days < 0) expired++;
        else if (days <= 30) dueSoon++;
      }
    }
    return {
      total: vehicles.length,
      active: active.length,
      seats: active.reduce((sum, v) => sum + (v.seatingCapacity || 0), 0),
      expired,
      dueSoon,
    };
  }, [vehicles]);

  const toggleActive = async (v: Vehicle) => {
    if (v.active && !confirm(`Deactivate ${v.registrationNumber}? It will no longer be available for routes.`)) return;
    setTogglingId(v.id);
    setError('');
    try {
      if (v.active) await deactivateVehicle(v.id);
      else await reactivateVehicle(v.id);
      setVehicles((prev) => prev.map((x) => (x.id === v.id ? { ...x, active: !v.active } : x)));
    } catch (err) {
      setError(apiErrorMessage(err, `Could not ${v.active ? 'deactivate' : 'reactivate'} the vehicle.`));
    } finally {
      setTogglingId(null);
    }
  };

  const columns: DataTableColumn<Vehicle>[] = [
    {
      key: 'registrationNumber',
      header: 'Vehicle',
      sortable: true,
      accessor: (v) => v.registrationNumber,
      render: (v) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Bus size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-wide text-slate-900">{v.registrationNumber}</p>
            <p className="truncate text-xs text-slate-400">{v.model || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'vehicleType', header: 'Type', sortable: true, accessor: (v) => v.vehicleType, render: (v) => <EnumBadge value={v.vehicleType} /> },
    { key: 'seatingCapacity', header: 'Seats', align: 'center', sortable: true, accessor: (v) => v.seatingCapacity },
    { key: 'insurance', header: 'Insurance', sortable: true, accessor: (v) => v.insuranceExpiry, render: (v) => <ExpiryCell date={v.insuranceExpiry} /> },
    { key: 'fitness', header: 'Fitness', sortable: true, accessor: (v) => v.fitnessExpiry, render: (v) => <ExpiryCell date={v.fitnessExpiry} /> },
    { key: 'permit', header: 'Permit', sortable: true, accessor: (v) => v.permitExpiry, render: (v) => <ExpiryCell date={v.permitExpiry} /> },
    { key: 'puc', header: 'PUC', sortable: true, accessor: (v) => v.pucExpiry, render: (v) => <ExpiryCell date={v.pucExpiry} /> },
    { key: 'active', header: 'Status', sortable: true, accessor: (v) => (v.active ? 1 : 0), render: (v) => <StatusBadge active={v.active} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={() => {
              setEditing(v);
              setFormOpen(true);
            }}
          />
          <IconButton
            icon={v.active ? PowerOff : Power}
            label={v.active ? 'Deactivate' : 'Reactivate'}
            variant={v.active ? 'danger' : 'primary'}
            loading={togglingId === v.id}
            onClick={() => toggleActive(v)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards — hidden for now, kept for later.
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Vehicles" value={String(stats.total)} hint={`${stats.active} active`} />
        <MiniStat label="Seating capacity" value={String(stats.seats)} tone="indigo" hint="Across active vehicles" />
        <MiniStat label="Docs due ≤ 30 days" value={String(stats.dueSoon)} tone={stats.dueSoon ? 'amber' : 'emerald'} />
        <MiniStat label="Docs expired" value={String(stats.expired)} tone={stats.expired ? 'red' : 'emerald'} />
      </div>
      */}

      <ErrorBanner message={error} />

      <FilterBar>
        <TextField
          label="Search"
          icon={Search}
          placeholder="Registration or model"
          wrapperClassName="w-full sm:w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectField label="Type" wrapperClassName="w-44" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as VehicleType | '')}>
          <option value="">All types</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {enumLabel(t)}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" wrapperClassName="w-36" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </SelectField>
        {(typeFilter || activeFilter || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-0.5"
            onClick={() => {
              setTypeFilter('');
              setActiveFilter('');
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
            Add Vehicle
          </Button>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={vehicles}
        rowKey={(v) => v.id}
        loading={loading}
        emptyTitle="No vehicles found"
        emptyDescription={typeFilter || activeFilter || search ? 'No vehicles match the current filters.' : 'Add your first vehicle to build the fleet.'}
      />

      {formOpen && (
        <VehicleFormModal
          item={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
