'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileWarning, Pencil, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  getDocumentExpiries,
  getDocumentRules,
  VEHICLE_TYPES,
  type DocumentExpiry,
  type DocumentRule,
  type VehicleType,
} from '@/lib/transportService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import SectionCard from '@/components/dashboard/SectionCard';
import DocumentRuleModal from './DocumentRuleModal';
import { EnumBadge, enumLabel, ErrorBanner, ExpiryChip, formatDate, MiniStat } from './transportUi';

const WINDOWS = [7, 15, 30, 60, 90];

/** Document compliance — what's expired or about to expire, and the per-vehicle-type rules behind it. */
export default function ComplianceTab() {
  const [withinDays, setWithinDays] = useState(30);
  const [expiries, setExpiries] = useState<DocumentExpiry[]>([]);
  const [rules, setRules] = useState<DocumentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingType, setEditingType] = useState<VehicleType | null>(null);

  const loadExpiries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setExpiries(await getDocumentExpiries(withinDays));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load document expiries.'));
    } finally {
      setLoading(false);
    }
  }, [withinDays]);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      setRules(await getDocumentRules());
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load document rules.'));
    } finally {
      setRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpiries();
  }, [loadExpiries]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const stats = useMemo(
    () => ({
      expired: expiries.filter((e) => e.expired).length,
      upcoming: expiries.filter((e) => !e.expired).length,
      vehicles: new Set(expiries.map((e) => e.vehicleId)).size,
    }),
    [expiries],
  );

  const ruleByType = useMemo(() => new Map(rules.map((r) => [r.vehicleType, r])), [rules]);

  const columns: DataTableColumn<DocumentExpiry>[] = [
    {
      key: 'registrationNumber',
      header: 'Vehicle',
      sortable: true,
      accessor: (e) => e.registrationNumber,
      render: (e) => <span className="font-semibold tracking-wide text-slate-900">{e.registrationNumber}</span>,
    },
    { key: 'documentType', header: 'Document', sortable: true, accessor: (e) => e.documentType, render: (e) => <EnumBadge value={e.documentType} /> },
    { key: 'expiryDate', header: 'Expiry date', sortable: true, accessor: (e) => e.expiryDate, render: (e) => formatDate(e.expiryDate) },
    {
      key: 'daysRemaining',
      header: 'Status',
      sortable: true,
      accessor: (e) => e.daysRemaining,
      render: (e) => <ExpiryChip days={e.expired ? Math.min(e.daysRemaining, -1) : e.daysRemaining} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards — hidden for now, kept for later.
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Expired" value={String(stats.expired)} tone={stats.expired ? 'red' : 'emerald'} />
        <MiniStat label={`Due in ${withinDays} days`} value={String(stats.upcoming)} tone={stats.upcoming ? 'amber' : 'emerald'} />
        <MiniStat label="Vehicles affected" value={String(stats.vehicles)} tone="indigo" />
      </div>
      */}

      <ErrorBanner message={error} />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-3">
          <div className="card-premium flex flex-wrap items-end gap-3 px-4 py-3.5">
            <div className="mr-auto flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FileWarning size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Renewal watchlist</p>
                <p className="text-xs text-slate-500">Expired documents plus those expiring soon</p>
              </div>
            </div>
            <SelectField label="Window" uiSize="sm" wrapperClassName="w-32" value={withinDays} onChange={(e) => setWithinDays(Number(e.target.value))}>
              {WINDOWS.map((d) => (
                <option key={d} value={d}>
                  Next {d} days
                </option>
              ))}
            </SelectField>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              className="mb-0.5"
              onClick={() => {
                loadExpiries();
                loadRules();
              }}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={expiries}
            rowKey={(e) => `${e.vehicleId}-${e.documentType}`}
            loading={loading}
            emptyTitle="All documents are in order"
            emptyDescription={`Nothing expired or expiring in the next ${withinDays} days.`}
          />
        </div>

        <SectionCard title="Document rules" subtitle="Required documents per vehicle type" icon={ShieldCheck} className="xl:col-span-2">
          {rulesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {VEHICLE_TYPES.map((type) => {
                const rule = ruleByType.get(type);
                return (
                  <li key={type} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50/30">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{enumLabel(type)}</p>
                      {rule ? (
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                          <RuleFlag on={rule.requireInsurance} label="Insurance" />
                          <RuleFlag on={rule.requireFitness} label="Fitness" />
                          <RuleFlag on={rule.requirePermit} label="Permit" />
                          <RuleFlag on={rule.requirePuc} label="PUC" />
                          <span className="text-slate-400">· alert {rule.alertDaysBefore}d before</span>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-xs text-slate-400">No rule configured</p>
                      )}
                    </div>
                    <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditingType(type)}>
                      {rule ? 'Edit' : 'Set up'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      {editingType && (
        <DocumentRuleModal
          vehicleType={editingType}
          rule={ruleByType.get(editingType) ?? null}
          onClose={() => setEditingType(null)}
          onSaved={() => {
            setEditingType(null);
            loadRules();
            loadExpiries();
          }}
        />
      )}
    </div>
  );
}

function RuleFlag({ on, label }: { on: boolean; label: string }) {
  const Icon = on ? CheckCircle2 : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 ${on ? 'text-emerald-600' : 'text-slate-300 line-through'}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}
