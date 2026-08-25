'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ClipboardList, FileQuestion, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteExam, getExams, type Exam } from '@/lib/examService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSections, type Section } from '@/lib/classSectionService';
import { getSubjects, type Subject } from '@/lib/subjectService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { ExamStatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import ExamFormModal from '@/components/exam/ExamFormModal';

const formatDateTime = (value: string) => (value ? new Date(value).toLocaleString() : '—');

/** Exam management page — shared between the Principal and Staff panels (see their /exams routes). */
export default function ExamsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/principal') ? '/principal' : '/staff';

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classFilter, setClassFilter] = useState<number | ''>('');

  const [filterSections, setFilterSections] = useState<Section[]>([]);
  const [sectionFilter, setSectionFilter] = useState<number | ''>('');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<number | ''>('');

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Exam | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      setClassesLoading(true);
      setError('');
      try {
        const content = (await getClasses()).content;
        setClasses(content);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes from the server.'));
      } finally {
        setClassesLoading(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      setSubjectsLoading(true);
      setError('');
      try {
        const content = (await getSubjects()).content;
        setSubjects(content);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load subjects from the server.'));
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, []);

  // Section filter options depend on the selected class filter.
  useEffect(() => {
    setSectionFilter('');
    if (!classFilter) {
      setFilterSections([]);
      return;
    }
    let cancelled = false;
    getSections({ classId: classFilter })
      .then((result) => {
        if (!cancelled) setFilterSections(result.sections);
      })
      .catch(() => {
        if (!cancelled) setFilterSections([]);
      });
    return () => {
      cancelled = true;
    };
  }, [classFilter]);

  const loadExams = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        classId: classFilter || undefined,
        subjectId: subjectFilter || undefined,
        sectionId: sectionFilter || undefined,
      };
      const content = (await getExams(params)).content;
      setExams(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load exams from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, subjectFilter, sectionFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: Exam) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this exam? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteExam(id);
      setExams((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that exam.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadExams();
  };

  const columns: DataTableColumn<Exam>[] = [
    {
      key: 'name',
      header: 'Exam',
      sortable: true,
      accessor: (item) => item.name,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">
            {item.schoolClassName} · {item.subjectName || `Subject #${item.subjectId}`}
          </p>
        </div>
      ),
    },
    {
      key: 'sections',
      header: 'Sections',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.sections.length === 0 ? (
            <span className="text-slate-400">—</span>
          ) : (
            item.sections.map((s) => (
              <span key={s.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {s.name}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'durationMinutes',
      header: 'Duration',
      sortable: true,
      accessor: (item) => item.durationMinutes,
      render: (item) => <span className="text-slate-600">{item.durationMinutes} min</span>,
    },
    {
      key: 'marks',
      header: 'Marks',
      render: (item) => (
        <span className="text-slate-600">
          {item.passingMarks} / {item.totalMarks}
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Schedule',
      sortable: true,
      accessor: (item) => item.startDate,
      render: (item) => (
        <div className="text-xs text-slate-600">
          <p>{formatDateTime(item.startDate)}</p>
          <p className="text-slate-400">to {formatDateTime(item.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => item.status,
      render: (item) => <ExamStatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-28',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={FileQuestion}
            label="Manage questions"
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`${basePath}/exams/${item.id}/questions`);
            }}
          />
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
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

  return (
    <div className="space-y-4">
      <PageHeader
        icon={ClipboardList}
        title="Exams"
        description="Schedule and manage exams for a class."
        actions={
          <Button
            icon={Plus}
            onClick={openCreateModal}
            disabled={classesLoading || classes.length === 0 || subjectsLoading || subjects.length === 0}
          >
            Add exam
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SelectField
          label="Class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.className}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Section"
          value={sectionFilter}
          disabled={!classFilter}
          onChange={(e) => setSectionFilter(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All sections</option>
          {filterSections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.sectionName}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Subject"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.subjectName}
            </option>
          ))}
        </SelectField>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={exams}
        rowKey={(item) => item.id}
        loading={loading || classesLoading || subjectsLoading}
        emptyTitle="No exams yet"
        emptyDescription={
          classes.length === 0
            ? 'Add a class before scheduling an exam.'
            : subjects.length === 0
              ? 'Add a subject before scheduling an exam.'
              : 'Add the first exam to get started.'
        }
      />

      {formModalOpen && (
        <ExamFormModal
          item={editingItem}
          classes={classes}
          subjects={subjects}
          defaultClassId={classFilter}
          onClose={() => {
            setFormModalOpen(false);
            setEditingItem(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
