'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getAdminHomeworks, type Homework, type HomeworkNoteStatus } from '@/lib/homeworkService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSubjects, type Subject } from '@/lib/subjectService';
import { getAllTeacherStaff, type TeacherStaffMember } from '@/lib/schoolService';
import { DAYS_OF_WEEK, getPeriods, type DayOfWeek, type Period } from '@/lib/timetableService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';
import HomeworkDetailModal from '@/components/homework/HomeworkDetailModal';

const PAGE_SIZE = 10;

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');
const dayLabel = (day: DayOfWeek) => day.charAt(0) + day.slice(1).toLowerCase();

const NOTE_STATUS_OPTIONS: HomeworkNoteStatus[] = ['ACTIVE', 'INACTIVE'];

interface Filters {
  classId: number | '';
  subjectId: number | '';
  teacherId: number | '';
  dayOfWeek: DayOfWeek | '';
  periodId: number | '';
  homeworkDateFrom: string;
  homeworkDateTo: string;
  dueDateFrom: string;
  dueDateTo: string;
  noteStatus: HomeworkNoteStatus | '';
  keyword: string;
}

const BLANK_FILTERS: Filters = {
  classId: '',
  subjectId: '',
  teacherId: '',
  dayOfWeek: '',
  periodId: '',
  homeworkDateFrom: '',
  homeworkDateTo: '',
  dueDateFrom: '',
  dueDateTo: '',
  noteStatus: '',
  keyword: '',
};

/** Read-only, filterable homework register across every teacher — Principal panel only (no create/edit/delete here, that lives in the Teacher panel). */
export default function AdminHomeworkContent() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<TeacherStaffMember[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [refLoading, setRefLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>(BLANK_FILTERS);
  const [keywordInput, setKeywordInput] = useState('');
  const [page, setPage] = useState(0);

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewingItem, setViewingItem] = useState<Homework | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [classesRes, subjectsRes, teachersRes] = await Promise.all([getClasses(), getSubjects(), getAllTeacherStaff()]);
        if (cancelled) return;
        setClasses(classesRes.content ?? []);
        setSubjects(subjectsRes.content ?? []);
        setTeachers(teachersRes.content ?? []);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load filter options.'));
      } finally {
        if (!cancelled) setRefLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Periods are scoped per class, so the Period filter only makes sense once
  // a class is picked — re-fetched and reset whenever the class filter changes.
  useEffect(() => {
    if (!filters.classId) {
      setPeriods([]);
      return;
    }
    let cancelled = false;
    getPeriods({ classId: filters.classId })
      .then((res) => !cancelled && setPeriods(res ?? []))
      .catch(() => !cancelled && setPeriods([]));
    return () => {
      cancelled = true;
    };
  }, [filters.classId]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value, ...(key === 'classId' ? { periodId: '' as Filters['periodId'] } : {}) }));
    setPage(0);
  };

  const loadHomeworks = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminHomeworks({
        classId: filters.classId || undefined,
        subjectId: filters.subjectId || undefined,
        teacherId: filters.teacherId || undefined,
        dayOfWeek: filters.dayOfWeek || undefined,
        periodId: filters.periodId || undefined,
        homeworkDateFrom: filters.homeworkDateFrom || undefined,
        homeworkDateTo: filters.homeworkDateTo || undefined,
        dueDateFrom: filters.dueDateFrom || undefined,
        dueDateTo: filters.dueDateTo || undefined,
        noteStatus: filters.noteStatus || undefined,
        keyword: filters.keyword || undefined,
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
  }, [filters, page]);

  const hasActiveFilter = Object.values(filters).some(Boolean);
  const resetFilters = () => {
    setFilters(BLANK_FILTERS);
    setKeywordInput('');
    setPage(0);
  };

  const handleKeywordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFilter('keyword', keywordInput.trim());
  };

  const columns: DataTableColumn<Homework>[] = [
    {
      key: 'class',
      header: 'Class / Subject',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.subjectName}</p>
          <p className="text-xs text-slate-500">{item.className}</p>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (item) => <span className="text-slate-700">{item.teacherName || '—'}</span>,
    },
    {
      key: 'period',
      header: 'Day / Period',
      render: (item) => (
        <div>
          <p className="text-slate-700">{item.periodName}</p>
          <p className="text-xs text-slate-400">{item.dayOfWeek ? item.dayOfWeek.charAt(0) + item.dayOfWeek.slice(1).toLowerCase() : '—'}</p>
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
      widthClassName: 'w-16',
      render: (item) => (
        <div className="flex items-center justify-end">
          <IconButton
            icon={Eye}
            label="View"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              setViewingItem(item);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SetPageTitle title="Homework" />

      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Homework</h1>
        <p className="text-sm text-slate-500">School-wide homework register across every class and teacher</p>
      </div>

      <div className="card-premium p-4">
        <div className="flex flex-wrap items-end gap-1.5">
          <SelectField
            label="Class"
            uiSize="sm"
            wrapperClassName="w-32"
            value={filters.classId}
            disabled={refLoading || classes.length === 0}
            onChange={(e) => setFilter('classId', e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Subject"
            uiSize="sm"
            wrapperClassName="w-36"
            value={filters.subjectId}
            disabled={refLoading || subjects.length === 0}
            onChange={(e) => setFilter('subjectId', e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjectName}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Teacher"
            uiSize="sm"
            wrapperClassName="w-40"
            value={filters.teacherId}
            disabled={refLoading || teachers.length === 0}
            onChange={(e) => setFilter('teacherId', e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.teacherUser.fullName}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Day"
            uiSize="sm"
            wrapperClassName="w-28"
            value={filters.dayOfWeek}
            onChange={(e) => setFilter('dayOfWeek', e.target.value as DayOfWeek | '')}
          >
            <option value="">All days</option>
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {dayLabel(day)}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Period"
            uiSize="sm"
            wrapperClassName="w-28"
            value={filters.periodId}
            disabled={!filters.classId || periods.length === 0}
            onChange={(e) => setFilter('periodId', e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">{!filters.classId ? 'Select class first' : 'All periods'}</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Note status"
            uiSize="sm"
            wrapperClassName="w-28"
            value={filters.noteStatus}
            onChange={(e) => setFilter('noteStatus', e.target.value as HomeworkNoteStatus | '')}
          >
            <option value="">All</option>
            {NOTE_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Homework from"
            type="date"
            wrapperClassName="w-36"
            value={filters.homeworkDateFrom}
            onChange={(e) => setFilter('homeworkDateFrom', e.target.value)}
          />
          <TextField
            label="Homework to"
            type="date"
            wrapperClassName="w-36"
            value={filters.homeworkDateTo}
            onChange={(e) => setFilter('homeworkDateTo', e.target.value)}
          />
          <TextField
            label="Due from"
            type="date"
            wrapperClassName="w-36"
            value={filters.dueDateFrom}
            onChange={(e) => setFilter('dueDateFrom', e.target.value)}
          />
          <TextField
            label="Due to"
            type="date"
            wrapperClassName="w-36"
            value={filters.dueDateTo}
            onChange={(e) => setFilter('dueDateTo', e.target.value)}
          />

          <form onSubmit={handleKeywordSubmit} className="flex flex-1 items-end gap-1.5">
            <TextField
              label="Keyword"
              icon={Search}
              wrapperClassName="flex-1 min-w-[160px]"
              placeholder="Search questions…"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
            />
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          {hasActiveFilter && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <DataTable
        columns={columns}
        data={homeworks}
        rowKey={(item) => item.id}
        loading={loading}
        pageSize={0}
        onRowClick={(item) => setViewingItem(item)}
        emptyTitle="No homework found"
        emptyDescription={
          hasActiveFilter ? 'No homework matches these filters — try widening the search.' : 'No homework has been recorded by any teacher yet.'
        }
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

      {viewingItem && <HomeworkDetailModal item={viewingItem} onClose={() => setViewingItem(null)} />}
    </div>
  );
}
