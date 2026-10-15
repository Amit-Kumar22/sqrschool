'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bus,
  Clock,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  PowerOff,
  RefreshCw,
  Route as RouteIcon,
  SearchCheck,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deactivateRoute,
  DRIVER_DESIGNATIONS,
  formatTime,
  getRoutes,
  getTransportStaff,
  getVehicles,
  type TransportRoute,
  type TransportStaff,
  type Vehicle,
} from '@/lib/transportService';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import { StatusBadge } from '@/components/ui/Badge';
import RouteFormModal from './RouteFormModal';
import RouteAssignmentModal from './RouteAssignmentModal';
import RouteStudentsModal from './RouteStudentsModal';
import StudentRouteLookupModal from './StudentRouteLookupModal';
import { ErrorBanner, FilterBar, formatMoney, MiniStat } from './transportUi';

type ActiveFilter = 'true' | 'false' | '';

/** Routes board — one card per route with timings, crew, occupancy and stops. */
export default function RoutesTab() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<TransportStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('true');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransportRoute | null>(null);
  const [assigning, setAssigning] = useState<TransportRoute | null>(null);
  const [rosterFor, setRosterFor] = useState<TransportRoute | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  useEffect(() => {
    getVehicles({ active: true })
      .then((p) => setVehicles(p.content))
      .catch(() => setVehicles([]));
    getTransportStaff({ employmentStatus: 'ACTIVE' })
      .then((p) => setDrivers(p.content.filter((s) => DRIVER_DESIGNATIONS.includes(s.designation))))
      .catch(() => setDrivers([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getRoutes({ active: activeFilter === '' ? undefined : activeFilter === 'true' });
      setRoutes(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load routes.'));
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = routes.filter((r) => r.active);
    const students = active.reduce((s, r) => s + (r.assignedStudentCount || 0), 0);
    const seats = active.reduce((s, r) => s + (r.seatingCapacity || 0), 0);
    return {
      routes: active.length,
      students,
      occupancy: seats ? Math.round((students / seats) * 100) : 0,
      unstaffed: active.filter((r) => !r.vehicleId || !r.driverId).length,
    };
  }, [routes]);

  const handleDeactivate = async (r: TransportRoute) => {
    if (!confirm(`Deactivate ${r.routeName}? Students on it will need to be moved to another route.`)) return;
    setDeactivatingId(r.id);
    setError('');
    try {
      await deactivateRoute(r.id);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not deactivate the route.'));
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stat cards — hidden for now, kept for later.
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Active routes" value={String(stats.routes)} />
        <MiniStat label="Students boarded" value={String(stats.students)} tone="indigo" />
        <MiniStat label="Seat occupancy" value={`${stats.occupancy}%`} tone={stats.occupancy > 100 ? 'red' : stats.occupancy > 85 ? 'amber' : 'emerald'} />
        <MiniStat label="Missing vehicle/driver" value={String(stats.unstaffed)} tone={stats.unstaffed ? 'amber' : 'emerald'} />
      </div>
      */}

      <ErrorBanner message={error} />

      <FilterBar>
        <SelectField label="Show" wrapperClassName="w-40" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}>
          <option value="true">Active routes</option>
          <option value="false">Inactive routes</option>
          <option value="">All routes</option>
        </SelectField>
        <div className="mb-0.5 ml-auto flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={SearchCheck} onClick={() => setLookupOpen(true)}>
            Find Student
          </Button>
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
            New Route
          </Button>
        </div>
      </FilterBar>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-72 rounded-2xl" />
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="card-premium flex flex-col items-center gap-2 px-4 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <RouteIcon size={22} />
          </span>
          <p className="text-sm font-semibold text-slate-900">No routes found</p>
          <p className="text-xs text-slate-500">Create a route with its stops, then board students onto it.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {routes.map((r, i) => (
            <RouteCard
              key={r.id}
              route={r}
              index={i}
              deactivating={deactivatingId === r.id}
              onEdit={() => {
                setEditing(r);
                setFormOpen(true);
              }}
              onAssign={() => setAssigning(r)}
              onStudents={() => setRosterFor(r)}
              onDeactivate={() => handleDeactivate(r)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <RouteFormModal
          item={editing}
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
      {assigning && (
        <RouteAssignmentModal
          route={assigning}
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setAssigning(null)}
          onSaved={() => {
            setAssigning(null);
            load();
          }}
        />
      )}
      {rosterFor && <RouteStudentsModal route={rosterFor} routes={routes.filter((r) => r.active)} onClose={() => setRosterFor(null)} onChanged={load} />}
      {lookupOpen && <StudentRouteLookupModal onClose={() => setLookupOpen(false)} />}
    </div>
  );
}

function RouteCard({
  route: r,
  index,
  deactivating,
  onEdit,
  onAssign,
  onStudents,
  onDeactivate,
}: {
  route: TransportRoute;
  index: number;
  deactivating: boolean;
  onEdit: () => void;
  onAssign: () => void;
  onStudents: () => void;
  onDeactivate: () => void;
}) {
  const [showAllStops, setShowAllStops] = useState(false);
  const stops = [...r.stops].sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0));
  const visibleStops = showAllStops ? stops : stops.slice(0, 4);
  const capacity = r.seatingCapacity ?? 0;
  const pct = capacity ? Math.min(100, Math.round((r.assignedStudentCount / capacity) * 100)) : 0;
  const over = capacity > 0 && r.assignedStudentCount > capacity;
  const barColor = over ? 'bg-red-500' : pct > 85 ? 'bg-amber-500' : 'bg-brand-500';

  return (
    <div
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className={`card-premium animate-fade-in-up group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium-lg ${r.active ? '' : 'opacity-70'}`}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-emerald-400" />

      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-900">{r.routeName}</h3>
            {!r.active && <StatusBadge active={false} />}
          </div>
          {r.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{r.description}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tracking-tight text-brand-700 tabular-nums">{formatMoney(r.transportFee)}</p>
          <p className="text-[10px] tracking-wide text-slate-400 uppercase">Fee</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 px-5 text-xs">
        <Meta icon={Clock} label="Pickup" value={formatTime(r.pickupTime)} />
        <Meta icon={Clock} label="Drop" value={formatTime(r.dropTime)} />
        <Meta icon={Bus} label="Vehicle" value={r.vehicleNumber || 'Not assigned'} warn={!r.vehicleId} />
        <Meta icon={UserRound} label="Driver" value={r.driverName || 'Not assigned'} warn={!r.driverId} />
      </div>

      <div className="mt-4 px-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">
            <Users size={12} className="mr-1 inline" />
            {r.assignedStudentCount} student{r.assignedStudentCount === 1 ? '' : 's'}
          </span>
          <span className={over ? 'font-semibold text-red-600' : 'text-slate-400'}>{capacity ? `${r.assignedStudentCount}/${capacity} seats` : 'No vehicle capacity'}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${over ? 100 : pct}%` }} />
        </div>
      </div>

      <div className="mt-4 flex-1 px-5">
        <p className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Stops ({stops.length})</p>
        {stops.length === 0 ? (
          <p className="text-xs text-slate-400">No stops added.</p>
        ) : (
          <ol className="relative space-y-1.5 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-px before:bg-brand-200">
            {visibleStops.map((s, i) => (
              <li key={s.id ?? i} className="relative flex items-center justify-between gap-2 pl-5 text-xs">
                <span className="absolute left-0 top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full border-2 border-brand-500 bg-white" />
                <span className="truncate text-slate-700">{s.stopName}</span>
                <span className="shrink-0 tabular-nums text-slate-400">{formatTime(s.pickupTime)}</span>
              </li>
            ))}
          </ol>
        )}
        {stops.length > 4 && (
          <button type="button" onClick={() => setShowAllStops((v) => !v)} className="mt-1.5 inline-flex items-center gap-1 pl-5 text-[11px] font-semibold text-brand-600 hover:text-brand-700">
            <MoreHorizontal size={12} />
            {showAllStops ? 'Show less' : `${stops.length - 4} more stops`}
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <Button size="sm" icon={Users} onClick={onStudents}>
          Students
        </Button>
        <div className="flex items-center gap-0.5">
          <IconButton icon={Pencil} label="Edit route" variant="primary" onClick={onEdit} />
          <IconButton icon={UserCog} label="Assign vehicle & driver" variant="primary" onClick={onAssign} disabled={!r.active} />
          <IconButton icon={PowerOff} label="Deactivate route" variant="danger" loading={deactivating} onClick={onDeactivate} disabled={!r.active} />
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value, warn }: { icon: typeof MapPin; label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
      <Icon size={13} className={warn ? 'shrink-0 text-amber-500' : 'shrink-0 text-brand-600'} />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400">{label}</p>
        <p className={`truncate font-semibold ${warn ? 'text-amber-700' : 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
  );
}
