import { CalendarClock, Coffee } from 'lucide-react';
import SectionCard from './SectionCard';
import type { DashboardTimetableEntry } from '@/lib/dashboardService';

/** Today's period-by-period timetable — shared shape across teacher, student and parent dashboards. */
export default function TimetableListPanel({ entries }: { entries: DashboardTimetableEntry[] | null | undefined }) {
  const list = entries ?? [];
  return (
    <SectionCard title="Today's Timetable" icon={CalendarClock}>
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No periods scheduled today.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((entry, idx) => (
            <li
              key={`${entry.periodName}-${idx}`}
              style={{ animationDelay: `${idx * 40}ms` }}
              className={`animate-fade-in-up flex items-center justify-between gap-3 rounded-lg border p-3 ${
                entry.breakPeriod ? 'border-amber-100 bg-amber-50/60' : 'border-slate-100 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    entry.breakPeriod ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {entry.breakPeriod ? <Coffee size={14} /> : <CalendarClock size={14} />}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{entry.breakPeriod ? entry.periodName || 'Break' : entry.subjectName}</p>
                  {!entry.breakPeriod && <p className="text-xs text-slate-400">{entry.periodName} · {entry.teacherName}</p>}
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium text-slate-500">
                {entry.startTime} – {entry.endTime}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
