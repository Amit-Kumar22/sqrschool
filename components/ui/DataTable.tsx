'use client';

import { ReactNode, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronUp,
  FileText,
  Inbox,
} from 'lucide-react';

export interface DataTableColumn<T> {
  /** Unique column id. Also used as the React key for cells. */
  key: string;
  header: string;
  /** Custom cell renderer. Falls back to `accessor(row)` when omitted. */
  render?: (row: T) => ReactNode;
  /** Plain value used for default rendering and for sorting. */
  accessor?: (row: T) => string | number | null | undefined;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  widthClassName?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  /** Rows per page. Set to 0 to disable pagination entirely. Defaults to 10. */
  pageSize?: number;
}

const alignClass = (align?: 'left' | 'center' | 'right') =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

/**
 * Premium, config-driven data table for record lists across the admin panel.
 * Pages own their columns (a plain array of {key, header, render, ...}) and
 * pass raw data — this component only handles presentation, sorting,
 * pagination, and loading/empty states.
 */
export default function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  skeletonRows = 5,
  emptyTitle = 'No records found',
  emptyDescription = 'There is nothing to show here yet.',
  onRowClick,
  pageSize = 10,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.accessor) return data;
    return [...data].sort((a, b) => {
      const av = col.accessor!(a) ?? '';
      const bv = col.accessor!(b) ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  // Clamp derived from render, not an effect — data can shrink (e.g. after a
  // delete) leaving `page` pointing past the new last page.
  const currentPage = Math.min(page, totalPages);
  const paginated = pageSize > 0 ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize) : sorted;

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, sorted.length);

  return (
    <div className="card-premium overflow-hidden">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm tabular-nums">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-950 via-indigo-800 to-indigo-950">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3.5 text-xs font-semibold tracking-wider text-white/90 uppercase ${col.widthClassName ?? ''} ${alignClass(col.align)}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="group inline-flex items-center gap-1 transition-colors hover:text-white"
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp size={13} />
                        ) : (
                          <ChevronDown size={13} />
                        )
                      ) : (
                        <ChevronsUpDown size={13} className="opacity-0 transition-opacity group-hover:opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4">
                      <div className="skeleton h-4 w-full max-w-40 rounded-md" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <Inbox size={20} />
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{emptyTitle}</p>
                    <p className="text-xs text-slate-500">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
                  className={`animate-fade-in-up group transition-colors even:bg-slate-50/70 hover:bg-indigo-50/60 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 align-middle text-slate-700 ${alignClass(col.align)} ${col.className ?? ''} ${
                        colIdx === 0 ? 'border-l-2 border-transparent transition-colors group-hover:border-indigo-500' : ''
                      }`}
                    >
                      {col.render ? col.render(row) : (col.accessor?.(row) ?? null)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && sorted.length > 0 && pageSize > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <FileText size={14} />
            {rangeStart}-{rangeEnd} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <PageButton onClick={() => setPage(1)} disabled={currentPage === 1} label="First page">
              <ChevronsLeft size={14} />
            </PageButton>
            <PageButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              label="Previous page"
            >
              <ChevronLeft size={14} />
            </PageButton>
            <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-indigo-600 px-2 text-xs font-semibold text-white">
              {currentPage}
            </span>
            <PageButton
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              label="Next page"
            >
              <ChevronRight size={14} />
            </PageButton>
            <PageButton onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} label="Last page">
              <ChevronsRight size={14} />
            </PageButton>
          </div>
        </div>
      )}
    </div>
  );
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
