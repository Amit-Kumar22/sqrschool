import { Megaphone } from 'lucide-react';
import SectionCard from './SectionCard';
import { NoticePriorityBadge, NoticeStatusBadge } from '@/components/ui/Badge';
import type { DashboardNotice } from '@/lib/dashboardService';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');

/** Recent-notices feed shared by every dashboard — admin, teacher, student and parent all return the same DashboardNotice shape. */
export default function NoticeListPanel({ notices }: { notices: DashboardNotice[] | null | undefined }) {
  const list = notices ?? [];
  return (
    <SectionCard title="Recent Notices" icon={Megaphone}>
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No notices published yet.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((notice, idx) => (
            <li
              key={notice.id}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="animate-fade-in-up rounded-lg border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:border-indigo-100 hover:bg-indigo-50/40"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{notice.title}</p>
                <span className="shrink-0 text-[11px] text-slate-400">{formatDate(notice.publishDate)}</span>
              </div>
              {notice.content && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{notice.content}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <NoticePriorityBadge priority={notice.priority} />
                <NoticeStatusBadge status={notice.status} />
                {notice.authorName && <span className="text-[11px] text-slate-400">by {notice.authorName}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
