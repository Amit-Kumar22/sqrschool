'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Eye, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getTeacherDashboard } from '@/lib/dashboardService';
import { deleteHomework, getTeacherHomeworks, type Homework } from '@/lib/homeworkService';
import { getTeacherWeeklyTimetable, type TeacherWeeklyTimetableEntry } from '@/lib/timetableService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';
import HomeworkFormModal from '@/components/homework/HomeworkFormModal';
import AddDailyNoteModal from '@/components/homework/AddDailyNoteModal';
import HomeworkDetailModal from '@/components/homework/HomeworkDetailModal';

const PAGE_SIZE = 10;

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');
const dayLabel = (day: string) => (day ? day.charAt(0) + day.slice(1).toLowerCase() : '—');

/** name (deduplicated) options for a filter dropdown, sourced from the teacher's own timetable slots. */
function distinctOptions(slots: TeacherWeeklyTimetableEntry[], idKey: 'classId' | 'subjectId', nameKey: 'className' | 'subjectName') {
  const map = new Map<number, string>();
  slots.forEach((slot) => map.set(slot[idKey], slot[nameKey]));
  return Array.from(map, ([id, name]) => ({ id, name }));
}

export default function TeacherHomeworkPage() {
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [profileError, setProfileError] = useState('');

  const [slots, setSlots] = useState<TeacherWeeklyTimetableEntry[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [subjectFilter, setSubjectFilter] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addingNoteFor, setAddingNoteFor] = useState<Homework | null>(null);
  const [viewingItem, setViewingItem] = useState<Homework | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    getTeacherDashboard()
      .then((dashboard) => setTeacherId(dashboard.profile.teacherId))
      .catch((err) => setProfileError(apiErrorMessage(err, 'Could not load your teacher profile from the server.')));
  }, []);

  useEffect(() => {
    setSlotsLoading(true);
    getTeacherWeeklyTimetable()
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, []);

  const classOptions = useMemo(() => distinctOptions(slots, 'classId', 'className'), [slots]);
  const subjectOptions = useMemo(() => distinctOptions(slots, 'subjectId', 'subjectName'), [slots]);

  const loadHomeworks = async () => {
    if (!teacherId) return;
    setLoading(true);
    setError('');
    try {
      const result = await getTeacherHomeworks({
        teacherId,
        sectionId: classFilter || undefined,
        subjectId: subjectFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        size: PAGE_SIZE,
      });
      setHomeworks(result.content ?? []);
      setTotalPages(result.totalPages ?? 0);
      setTotalElements(result.totalElements ?? 0);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load homework from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, classFilter, subjectFilter, fromDate, toDate, page]);

  const hasActiveFilter = !!(classFilter || subjectFilter || fromDate || toDate);
  const resetFilters = () => {
    setClassFilter('');
    setSubjectFilter('');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this homework? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteHomework(id);
      await loadHomeworks();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that homework.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreated = async () => {
    setCreateModalOpen(false);
    setPage(0);
    await loadHomeworks();
  };

  const handleDailyAdded = async () => {
    setAddingNoteFor(null);
    await loadHomeworks();
  };

  const columns: DataTableColumn<Homework>[] = [
    {
      key: 'class',
      header: 'Class',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.subjectName}</p>
          <p className="text-xs text-slate-500">{item.className}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (item) => (
        <div>
          <p className="text-slate-700">{item.periodName}</p>
          <p className="text-xs text-slate-400">{dayLabel(item.dayOfWeek)}</p>
        </div>
      ),
    },
    {
      key: 'homeworkDate',
      header: 'Homework date',
      render: (item) => <span className="text-slate-600">{formatDate(item.homeworkDate)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due date',
      render: (item) => <span className="text-slate-600">{formatDate(item.dueDate)}</span>,
    },
    {
      key: 'notes',
      header: 'Entries',
      render: (item) => <span className="text-slate-600">{item.notes.length}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-28',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={CalendarPlus}
            label="Add daily note"
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              setAddingNoteFor(item);
            }}
          />
          <IconButton
            icon={Eye}
            label="View"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              setViewingItem(item);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
          />
        </div>
      ),
    },
  ];

  const canCreate = !slotsLoading && slots.length > 0;

  return (
    <div className="space-y-4">
      <SetPageTitle title="Homework" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Homework</h1>
          <p className="text-sm text-slate-500">Set and track homework for your scheduled classes</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
          disabled={!canCreate}
          title={!canCreate && !slotsLoading ? 'No scheduled class periods found for your account.' : undefined}
        >
          Add homework
        </Button>
      </div>

      {(error || profileError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || profileError}
        </div>
      )}

      {!error && !slotsLoading && slots.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          No periods are assigned to you on the weekly timetable yet — ask the principal to add you to a class period first.
        </div>
      )}

      <div className="card-premium p-4">
        <div className="flex flex-wrap items-end gap-1.5">
          <SelectField
            label="Class"
            uiSize="sm"
            wrapperClassName="w-40"
            value={classFilter}
            disabled={classOptions.length === 0}
            onChange={(e) => {
              setClassFilter(e.target.value ? Number(e.target.value) : '');
              setPage(0);
            }}
          >
            <option value="">All classes</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Subject"
            uiSize="sm"
            wrapperClassName="w-40"
            value={subjectFilter}
            disabled={subjectOptions.length === 0}
            onChange={(e) => {
              setSubjectFilter(e.target.value ? Number(e.target.value) : '');
              setPage(0);
            }}
          >
            <option value="">All subjects</option>
            {subjectOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>

          <TextField
            label="From date"
            type="date"
            wrapperClassName="w-36"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
            }}
          />
          <TextField
            label="To date"
            type="date"
            wrapperClassName="w-36"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
            }}
          />

          {hasActiveFilter && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={homeworks}
        rowKey={(item) => item.id}
        loading={loading}
        pageSize={0}
        emptyTitle="No homework yet"
        emptyDescription="Add homework for one of your scheduled classes to get started."
      />

      {!loading && homeworks.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages} · {totalElements} total
          </span>
          <div className="flex items-center gap-1">
            <IconButton icon={ChevronLeft} label="Previous page" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />
            <IconButton
              icon={ChevronRight}
              label="Next page"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            />
          </div>
        </div>
      )}

      {createModalOpen && (
        <HomeworkFormModal
          slots={slots}
          defaultWeeklyTimetableId={slots[0]?.id ?? ''}
          onClose={() => setCreateModalOpen(false)}
          onSaved={handleCreated}
        />
      )}

      {addingNoteFor && (
        <AddDailyNoteModal homework={addingNoteFor} onClose={() => setAddingNoteFor(null)} onSaved={handleDailyAdded} />
      )}

      {viewingItem && <HomeworkDetailModal item={viewingItem} onClose={() => setViewingItem(null)} />}
    </div>
  );
}
