'use client';

import { FormEvent, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { createPeriod, deletePeriod, formatTime, type Period } from '@/lib/timetableService';

/**
 * Bespoke modal shell (not the shared Modal component) — the requested design
 * is a plain white card with no icon badge/accent bar/subtitle, a bounded
 * scrollable period list, and a persistent inline "Add New Row" form instead
 * of a popup, which doesn't fit Modal's chrome.
 */
export default function ManagePeriodsModal({
  classId,
  periods,
  onClose,
  onChanged,
}: {
  classId: number;
  periods: Period[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakPeriod, setBreakPeriod] = useState(false);
  const [adding, setAdding] = useState(false);

  const sorted = [...periods].sort((a, b) => a.periodOrder - b.periodOrder);
  const nextOrder = (sorted[sorted.length - 1]?.periodOrder ?? 0) + 1;

  let periodCounter = 0;

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this period? Any subjects assigned to it will also be removed.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deletePeriod(id);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that period.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a label.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Please set both start and end time.');
      return;
    }
    if (endTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }

    setAdding(true);
    setError('');
    try {
      await createPeriod({ name: name.trim(), classId, periodOrder: nextOrder, startTime, endTime, breakPeriod });
      setName('');
      setStartTime('');
      setEndTime('');
      setBreakPeriod(false);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add that period.'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="animate-scale-in flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-premium-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Manage Periods</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 transition-colors hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {error && <div className="mb-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        {sorted.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No periods yet for this class.</p>
        ) : (
          <div className="scrollbar-thin -mx-1 max-h-56 flex-1 space-y-1.5 overflow-y-auto px-1">
            {sorted.map((period) => {
              if (!period.breakPeriod) periodCounter += 1;
              return (
                <div
                  key={period.id}
                  className={`flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2 ${
                    period.breakPeriod ? 'border-amber-100 bg-amber-50/60' : 'border-slate-100 bg-slate-50/70'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-4 shrink-0 text-center text-xs text-slate-400">{period.breakPeriod ? '—' : periodCounter}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{period.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatTime(period.startTime)} – {formatTime(period.endTime)}
                        {period.breakPeriod && <span className="ml-1.5 italic text-amber-600">break</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(period.id)}
                    disabled={deletingId === period.id}
                    aria-label="Delete"
                    className="shrink-0 text-red-500 transition-colors hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-bold text-slate-900">Add New Row</p>
          <form onSubmit={handleAdd} className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">Label</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Period 9"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 shadow-premium-sm placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm text-slate-700 shadow-premium-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm text-slate-700 shadow-premium-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={breakPeriod}
                onChange={(e) => setBreakPeriod(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500/30"
              />
              This is a break / lunch (not editable in timetable)
            </label>

            <button
              type="submit"
              disabled={adding}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-amber-700 text-sm font-semibold text-white shadow-glow-amber transition-all hover:-translate-y-0.5 hover:bg-amber-800 hover:shadow-glow-amber-lg disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              <Plus size={15} /> {adding ? 'Adding…' : 'Add Period'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
