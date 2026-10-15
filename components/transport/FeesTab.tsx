'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HandCoins, Plus, RefreshCw } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getOutstandingTransportFees, getRoutes, type OutstandingTransportFee, type TransportRoute } from '@/lib/transportService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import TransportStudentPicker from './TransportStudentPicker';
import GenerateTransportFeeModal from './GenerateTransportFeeModal';
import { daysUntil, EnumBadge, ErrorBanner, FilterBar, formatDate, formatMoney, MiniStat } from './transportUi';

/**
 * Transport fees — raise route-priced fees and track what's still unpaid.
 * Collection itself lives in Fees → Collect Fee; `collectHref` links there
 * when the current panel has access to it.
 */
export default function FeesTab({ collectHref }: { collectHref?: (feeId: number) => string }) {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [fees, setFees] = useState<OutstandingTransportFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [classId, setClassId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>('');
  const [generateOpen, setGenerateOpen] = useState(false);

  useEffect(() => {
    getRoutes({ active: true })
      .then((p) => setRoutes(p.content))
      .catch(() => setRoutes([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getOutstandingTransportFees({ studentId: studentId || undefined });
      setFees(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load outstanding transport fees.'));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const overdue = fees.filter((f) => f.status === 'OVERDUE' || (daysUntil(f.dueDate) ?? 0) < 0);
    return {
      count: fees.length,
      students: new Set(fees.map((f) => f.studentId)).size,
      due: fees.reduce((s, f) => s + (f.dueAmount || 0), 0),
      overdue: overdue.reduce((s, f) => s + (f.dueAmount || 0), 0),
      overdueCount: overdue.length,
    };
  }, [fees]);

  const columns: DataTableColumn<OutstandingTransportFee>[] = [
    {
      key: 'studentName',
      header: 'Student',
      sortable: true,
      accessor: (f) => f.studentName,
      render: (f) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{f.studentName}</p>
          <p className="truncate text-xs text-slate-400">{f.className || '—'}</p>
        </div>
      ),
    },
    { key: 'amount', header: 'Fee', align: 'right', sortable: true, accessor: (f) => f.amount, render: (f) => formatMoney(f.amount) },
    { key: 'paidAmount', header: 'Paid', align: 'right', sortable: true, accessor: (f) => f.paidAmount, render: (f) => <span className="text-emerald-600">{formatMoney(f.paidAmount)}</span> },
    {
      key: 'dueAmount',
      header: 'Due',
      align: 'right',
      sortable: true,
      accessor: (f) => f.dueAmount,
      render: (f) => <span className="font-bold text-red-600">{formatMoney(f.dueAmount)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due date',
      sortable: true,
      accessor: (f) => f.dueDate,
      render: (f) => {
        const days = daysUntil(f.dueDate);
        return (
          <div>
            <p className="whitespace-nowrap">{formatDate(f.dueDate)}</p>
            {days !== null && <p className={`text-[11px] ${days < 0 ? 'text-red-600' : 'text-slate-400'}`}>{days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}</p>}
          </div>
        );
      },
    },
    { key: 'status', header: 'Status', sortable: true, accessor: (f) => f.status, render: (f) => <EnumBadge value={f.status} /> },
    ...(collectHref
      ? [
          {
            key: 'actions',
            header: 'Actions',
            align: 'right' as const,
            render: (f: OutstandingTransportFee) => (
              <Link
                href={collectHref(f.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 px-2.5 text-xs font-semibold text-white shadow-glow-brand transition-transform hover:-translate-y-0.5"
              >
                <HandCoins size={13} />
                Collect
              </Link>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards — hidden for now, kept for later.
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Outstanding" value={formatMoney(stats.due)} tone="red" hint={`${stats.count} fee${stats.count === 1 ? '' : 's'}`} />
        <MiniStat label="Students owing" value={String(stats.students)} tone="indigo" />
        <MiniStat label="Overdue" value={formatMoney(stats.overdue)} tone={stats.overdueCount ? 'amber' : 'emerald'} hint={`${stats.overdueCount} past due date`} />
        <MiniStat label="Active routes" value={String(routes.length)} />
      </div>
      */}

      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}
      <ErrorBanner message={error} />

      <FilterBar>
        <TransportStudentPicker placeholder="All students"
          classId={classId}
          studentId={studentId}
          onChange={(c, s) => {
            setClassId(c);
            setStudentId(s);
          }}
        />
        {(classId || studentId) && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-0.5"
            onClick={() => {
              setClassId('');
              setStudentId('');
            }}
          >
            Show all students
          </Button>
        )}
        <div className="mb-0.5 ml-auto flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button size="sm" icon={Plus} onClick={() => setGenerateOpen(true)}>
            Generate Fee
          </Button>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={fees}
        rowKey={(f) => f.id}
        loading={loading}
        emptyTitle="No outstanding transport fees"
        emptyDescription={studentId ? 'This student has no unpaid transport fees.' : 'Every transport fee raised so far has been paid.'}
      />

      {generateOpen && (
        <GenerateTransportFeeModal
          routes={routes}
          onClose={() => setGenerateOpen(false)}
          onSaved={() => {
            setGenerateOpen(false);
            setNotice('Transport fee generated.');
            load();
          }}
        />
      )}
    </div>
  );
}
