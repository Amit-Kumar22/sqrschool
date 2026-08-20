'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Contact2, Eye, Search, Sparkles, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getSchoolLeads, type SchoolLead } from '@/lib/schoolLeadService';
import type { LucideIcon } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { LeadStatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import SchoolLeadDetailModal from '@/components/school-leads/SchoolLeadDetailModal';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

const isDueSoon = (value: string) => {
  if (!value) return false;
  const due = new Date(value).getTime();
  const in3Days = Date.now() + 3 * 24 * 60 * 60 * 1000;
  return due <= in3Days;
};

export default function SchoolLeadsPage() {
  const [leads, setLeads] = useState<SchoolLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewingLead, setViewingLead] = useState<SchoolLead | null>(null);

  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true);
      setError('');
      try {
        const page = await getSchoolLeads();
        setLeads(page.content);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load school leads from the server.'));
      } finally {
        setLoading(false);
      }
    };
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) =>
      [lead.schoolName, lead.city, lead.locality, lead.phone, lead.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    );
  }, [leads, search]);

  const newCount = useMemo(() => leads.filter((lead) => lead.status === 'NEW').length, [leads]);
  const followUpsDueCount = useMemo(() => leads.filter((lead) => isDueSoon(lead.nextFollowUpAt)).length, [leads]);

  const columns: DataTableColumn<SchoolLead>[] = [
    {
      key: 'schoolName',
      header: 'School',
      sortable: true,
      accessor: (item) => item.schoolName,
      render: (item) => <p className="truncate font-semibold text-slate-900">{item.schoolName}</p>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate text-slate-700">{item.phone || '—'}</p>
          <p className="truncate text-xs text-slate-500">{item.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'board',
      header: 'Board / Type',
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate text-slate-700">{item.board || '—'}</p>
          <p className="truncate text-xs text-slate-500">
            {[item.category, item.schoolType].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => item.status,
      render: (item) => <LeadStatusBadge status={item.status} />,
    },
    {
      key: 'nextFollowUpAt',
      header: 'Next Follow-up',
      sortable: true,
      accessor: (item) => item.nextFollowUpAt,
      render: (item) => (
        <span className={item.nextFollowUpAt && isDueSoon(item.nextFollowUpAt) ? 'font-medium text-amber-600' : 'text-slate-600'}>
          {formatDate(item.nextFollowUpAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-16',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Eye}
            label="View details"
            onClick={(e) => {
              e.stopPropagation();
              setViewingLead(item);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Contact2}
        title="School Leads"
        description="Track prospective schools and follow up on outreach."
      />

      <div className="flex flex-wrap gap-3">
        <MiniStat icon={Contact2} label="Total leads" value={loading ? '—' : String(leads.length)} />
        <MiniStat icon={Sparkles} label="New" value={loading ? '—' : String(newCount)} />
        <MiniStat icon={CalendarClock} label="Follow-ups due" value={loading ? '—' : String(followUpsDueCount)} />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by school, city, phone or email"
            className="h-9 w-full rounded-md border border-slate-200 bg-white pr-3 pl-8 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            title="Clear search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {error && (
        <div className="animate-fade-in-up rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredLeads}
        rowKey={(item) => item.id}
        loading={loading}
        onRowClick={(item) => setViewingLead(item)}
        emptyTitle="No school leads yet"
        emptyDescription="Leads captured from outreach will show up here."
      />

      {viewingLead && <SchoolLeadDetailModal lead={viewingLead} onClose={() => setViewingLead(null)} />}
    </div>
  );
}

/** Compact inline stat pill — smaller footprint than the dashboard StatCard, sized for a page sub-header strip. */
function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="card-premium flex items-center gap-2.5 px-3.5 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon size={14} />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold text-slate-900">{value}</p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}
