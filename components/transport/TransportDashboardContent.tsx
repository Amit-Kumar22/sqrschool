'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bus,
  CalendarClock,
  Fuel,
  GraduationCap,
  HardHat,
  IndianRupee,
  Loader2,
  RefreshCw,
  Route as RouteIcon,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { getTransportDashboard, type TransportDashboard } from '@/lib/transportService';
import StatCard from '@/components/dashboard/StatCard';
import SectionCard from '@/components/dashboard/SectionCard';
import DonutStat from '@/components/dashboard/charts/DonutStat';
import { STATUS_COLORS } from '@/components/dashboard/chartColors';
import Button from '@/components/ui/Button';
import { EnumBadge, ErrorBanner, ExpiryChip, formatDate, formatMoney } from './transportUi';

export type TransportSection = 'vehicles' | 'routes' | 'staff' | 'expenses' | 'salaries' | 'fees' | 'compliance';

/**
 * Transport overview. Navigation is supplied by the host: the Transport
 * panel passes `hrefFor` (real routes), the principal's tabbed page passes
 * `onOpen` (switch tab in place).
 */
export default function TransportDashboardContent({
  hrefFor,
  onOpen,
}: {
  hrefFor?: (section: TransportSection) => string;
  onOpen?: (section: TransportSection) => void;
}) {
  const [withinDays, setWithinDays] = useState(30);
  const [data, setData] = useState<TransportDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    setName(getUser()?.fullName ?? '');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getTransportDashboard(withinDays));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load the transport dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [withinDays]);

  useEffect(() => {
    load();
  }, [load]);

  const nav = { hrefFor, onOpen };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-700" />
      </div>
    );
  }

  const d = data;
  const monthlyCost = (d?.monthlySalaryExpense ?? 0) + (d?.monthlyVehicleExpense ?? 0);
  const salaryShare = monthlyCost ? Math.round(((d?.monthlySalaryExpense ?? 0) / monthlyCost) * 100) : 0;
  const fleetActivePct = d?.totalVehicles ? Math.round((d.activeVehicles / d.totalVehicles) * 100) : 0;
  const expiries = [...(d?.upcomingExpiries ?? [])].sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 px-6 py-6 text-white shadow-premium-lg">
        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />
        <Bus className="pointer-events-none absolute right-6 bottom-2 hidden text-white/[0.06] md:block" size={150} strokeWidth={1.2} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-brand-200/80 uppercase">Transport overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Welcome back{name ? `, ${name}` : ''}</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              {d ? (
                <>
                  {d.activeRoutes} active routes carrying {d.transportStudents} students on {d.activeVehicles} vehicles.
                  {d.expiredDocumentCount > 0 && <span className="text-rose-200"> {d.expiredDocumentCount} vehicle documents have expired.</span>}
                </>
              ) : (
                'Fleet, routes, crew and costs at a glance.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15 backdrop-blur">
              <p className="text-[10px] tracking-wider text-brand-100/70 uppercase">This month&apos;s cost</p>
              <p className="text-xl font-bold tabular-nums">{formatMoney(monthlyCost)}</p>
            </div>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <ErrorBanner message={error} />

      {d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard index={0} icon={Bus} label="Vehicles (active / total)" value={`${d.activeVehicles} / ${d.totalVehicles}`} />
            <StatCard index={1} icon={UserRound} label="Active drivers" value={String(d.activeDrivers)} color="indigo" />
            <StatCard index={2} icon={RouteIcon} label="Active routes" value={String(d.activeRoutes)} color="sky" />
            <StatCard index={3} icon={GraduationCap} label="Transport students" value={String(d.transportStudents)} color="violet" />
            <StatCard index={4} icon={Wallet} label="Salary expense (month)" value={formatMoney(d.monthlySalaryExpense)} color="emerald" />
            <StatCard index={5} icon={Fuel} label="Vehicle expense (month)" value={formatMoney(d.monthlyVehicleExpense)} color="amber" />
            <StatCard index={6} icon={IndianRupee} label="Outstanding fees" value={formatMoney(d.outstandingTransportFees)} color="rose" />
            <StatCard index={7} icon={ShieldAlert} label="Expired documents" value={String(d.expiredDocumentCount)} color={d.expiredDocumentCount ? 'rose' : 'emerald'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <SectionCard
              title="Document renewals"
              subtitle="Expired and upcoming vehicle document expiries"
              icon={CalendarClock}
              className="lg:col-span-3"
              right={
                <select
                  aria-label="Expiry window"
                  value={withinDays}
                  onChange={(e) => setWithinDays(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-premium-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                >
                  {[7, 15, 30, 60, 90].map((n) => (
                    <option key={n} value={n}>
                      Next {n} days
                    </option>
                  ))}
                </select>
              }
            >
              {expiries.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={20} />
                  </span>
                  <p className="text-sm font-semibold text-slate-800">All documents are valid</p>
                  <p className="text-xs text-slate-400">Nothing expires in the next {withinDays} days.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {expiries.slice(0, 8).map((e) => (
                    <li key={`${e.vehicleId}-${e.documentType}`} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${e.expired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}
                        >
                          {e.expired ? <AlertTriangle size={16} /> : <CalendarClock size={16} />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-wide text-slate-900">{e.registrationNumber}</p>
                          <p className="text-xs text-slate-400">{formatDate(e.expiryDate)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <EnumBadge value={e.documentType} />
                        <ExpiryChip days={e.expired ? Math.min(e.daysRemaining, -1) : e.daysRemaining} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {expiries.length > 0 && (
                <NavTarget nav={nav} section="compliance" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                  {expiries.length > 8 ? `View all ${expiries.length}` : 'Open compliance'} <ArrowRight size={13} />
                </NavTarget>
              )}
            </SectionCard>

            <SectionCard title="Monthly running cost" subtitle="Crew salaries vs vehicle expenses" icon={IndianRupee} className="lg:col-span-2">
              <div className="flex flex-col items-center gap-5">
                <DonutStat percentage={fleetActivePct} label="Fleet active" color={STATUS_COLORS.good} />
                <div className="w-full space-y-3">
                  <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-brand-500 transition-all duration-700" style={{ width: `${salaryShare}%` }} />
                    <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${monthlyCost ? 100 - salaryShare : 0}%` }} />
                  </div>
                  <CostRow color="bg-brand-500" label="Crew salaries" value={formatMoney(d.monthlySalaryExpense)} />
                  <CostRow color="bg-amber-400" label="Vehicle expenses" value={formatMoney(d.monthlyVehicleExpense)} />
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-sm">
                    <span className="font-semibold text-slate-700">Total</span>
                    <span className="font-bold text-slate-900 tabular-nums">{formatMoney(monthlyCost)}</span>
                  </div>
                  {d.transportStudents > 0 && (
                    <p className="text-center text-[11px] text-slate-400">≈ {formatMoney(Math.round(monthlyCost / d.transportStudents))} per student this month</p>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Quick access</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickTile nav={nav} section="vehicles" icon={Bus} title="Vehicles" text="Fleet register & documents" />
              <QuickTile nav={nav} section="routes" icon={RouteIcon} title="Routes & Students" text="Stops, timings, boarding" />
              <QuickTile nav={nav} section="staff" icon={HardHat} title="Transport Staff" text="Drivers, licences, duty" />
              <QuickTile nav={nav} section="expenses" icon={Fuel} title="Expenses" text="Fuel, service, repairs" />
              <QuickTile nav={nav} section="salaries" icon={Wallet} title="Staff Salaries" text="Generate, pay, slips" />
              <QuickTile nav={nav} section="fees" icon={Banknote} title="Transport Fees" text="Raise & track dues" />
              <QuickTile nav={nav} section="compliance" icon={ShieldAlert} title="Compliance" text="Renewals & document rules" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CostRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-slate-500">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-semibold text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

interface Navigator {
  hrefFor?: (section: TransportSection) => string;
  onOpen?: (section: TransportSection) => void;
}

/** A Link when the host gave real routes, otherwise a button that switches tab in place. */
function NavTarget({ nav, section, className, children }: { nav: Navigator; section: TransportSection; className: string; children: React.ReactNode }) {
  return nav.hrefFor ? (
    <Link href={nav.hrefFor(section)} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={() => nav.onOpen?.(section)} className={`text-left ${className}`}>
      {children}
    </button>
  );
}

function QuickTile({
  nav,
  section,
  icon: Icon,
  title,
  text,
}: {
  nav: Navigator;
  section: TransportSection;
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <NavTarget
      nav={nav}
      section={section}
      className="card-premium group flex items-center gap-3 px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-premium"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900">{title}</span>
        <span className="block truncate text-xs text-slate-500">{text}</span>
      </span>
      <ArrowRight size={15} className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
    </NavTarget>
  );
}
