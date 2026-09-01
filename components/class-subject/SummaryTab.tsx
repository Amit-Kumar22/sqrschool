'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSubjects, type Subject } from '@/lib/subjectService';
import { getClassSubjects } from '@/lib/classSubjectService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';

/** Splits a free-text class name into a bold primary line and a muted secondary line, e.g. "9 — A" -> ["9", "A"], "1 Sec. A" -> ["1", "Sec. A"]. Falls back to a single line when no such split is found. */
function splitClassLabel(name: string): { primary: string; secondary?: string } {
  const dashMatch = name.match(/^(.*?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) return { primary: dashMatch[1].trim(), secondary: dashMatch[2].trim() };
  const secMatch = name.match(/^(\S+)\s+(Sec\.?.*)$/i);
  if (secMatch) return { primary: secMatch[1].trim(), secondary: secMatch[2].trim() };
  return { primary: name };
}

const pairKey = (classId: number, subjectId: number) => `${classId}-${subjectId}`;

/** Assignment Matrix — every class × every subject, one DataTable column per subject, sourced from the full class-subject list. */
export default function SummaryTab() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignedPairs, setAssignedPairs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [classesPage, subjectsPage, mappingsPage] = await Promise.all([
          getClasses(),
          getSubjects(),
          getClassSubjects({ size: 1000 }),
        ]);
        setClasses(classesPage.content ?? []);
        setSubjects(subjectsPage.content ?? []);
        setAssignedPairs(new Set((mappingsPage.content ?? []).map((m) => pairKey(m.classId, m.subjectId))));
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load the assignment matrix.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = useMemo<DataTableColumn<SchoolClass>[]>(() => {
    const subjectColumns: DataTableColumn<SchoolClass>[] = subjects.map((subject) => ({
      key: `subject-${subject.id}`,
      header: subject.subjectName,
      align: 'center',
      render: (cls) =>
        assignedPairs.has(pairKey(cls.id, subject.id)) ? (
          <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Check size={12} strokeWidth={3} />
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    }));

    return [
      {
        key: 'class',
        header: 'Class',
        render: (cls) => {
          const { primary, secondary } = splitClassLabel(cls.className);
          return (
            <div>
              <p className="text-sm font-semibold text-slate-900">{primary}</p>
              {secondary && <p className="text-xs text-slate-400">{secondary}</p>}
            </div>
          );
        },
      },
      ...subjectColumns,
      {
        key: 'total',
        header: 'Total',
        align: 'center',
        render: (cls) => (
          <span className="text-sm font-semibold text-slate-700">
            {subjects.filter((s) => assignedPairs.has(pairKey(cls.id, s.id))).length}
          </span>
        ),
      },
    ];
  }, [subjects, assignedPairs]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Assignment Matrix</h2>
        <p className="text-xs text-slate-500">Rows = classes · Columns = subjects · ✓ = assigned</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={classes}
        rowKey={(cls) => cls.id}
        loading={loading}
        pageSize={0}
        emptyTitle="No classes yet"
        emptyDescription="Add a class to see it in the assignment matrix."
      />
    </div>
  );
}
