'use client';

import { useEffect, useState } from 'react';
import { CalendarPlus, Eye, NotebookPen, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteHomework, getHomeworks, type Homework } from '@/lib/homeworkService';
import { getTeacherSubjectMappings, type TeacherSubjectMapping } from '@/lib/teacherSubjectService';
import { getUser } from '@/lib/auth';
import { useSchoolCode } from '@/lib/useSchoolCode';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import HomeworkFormModal from '@/components/homework/HomeworkFormModal';
import AddDailyNoteModal from '@/components/homework/AddDailyNoteModal';
import HomeworkDetailModal from '@/components/homework/HomeworkDetailModal';

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

export default function TeacherHomeworkPage() {
  const { schoolCode: selectedSchoolCode, loading: schoolsLoading, error: schoolError } = useSchoolCode();

  const [assignments, setAssignments] = useState<TeacherSubjectMapping[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [totalMappingsInSchool, setTotalMappingsInSchool] = useState(0);

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addingNoteFor, setAddingNoteFor] = useState<Homework | null>(null);
  const [viewingItem, setViewingItem] = useState<Homework | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (schoolsLoading) return;
    // Filtering by id doesn't work here: mapping.teacher.id is the Teacher
    // entity's own id, not the login account's id from getUser() — the same
    // two-id-spaces mismatch already found on the Teacher Section page.
    // Email is stable across both and avoids that ambiguity. Normalized
    // case/whitespace since that's a common source of silent non-matches.
    const currentUserEmail = getUser()?.email?.trim().toLowerCase();
    const loadAssignments = async () => {
      setAssignmentsLoading(true);
      setError('');
      try {
        const result = await getTeacherSubjectMappings();
        setTotalMappingsInSchool(result.content.length);
        setAssignments(
          currentUserEmail
            ? result.content.filter((a) => a.teacher.email?.trim().toLowerCase() === currentUserEmail)
            : result.content,
        );
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load your assigned classes from the server.'));
      } finally {
        setAssignmentsLoading(false);
      }
    };
    loadAssignments();
  }, [schoolsLoading]);

  const loadHomeworks = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getHomeworks({ schoolCode: selectedSchoolCode });
      setHomeworks(result.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load homework from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolsLoading || !selectedSchoolCode) return;
    loadHomeworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolsLoading, selectedSchoolCode]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this homework? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteHomework(id);
      setHomeworks((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that homework.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreated = async () => {
    setCreateModalOpen(false);
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
      sortable: true,
      accessor: (item) => item.teacherSubjectSection.subject.subjectName,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.teacherSubjectSection.subject.subjectName}</p>
          <p className="text-xs text-slate-500">
            {item.teacherSubjectSection.section.schoolClass.className} {item.teacherSubjectSection.section.sectionName}
          </p>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Entries',
      sortable: true,
      accessor: (item) => item.notes.length,
      render: (item) => <span className="text-slate-600">{item.notes.length}</span>,
    },
    {
      key: 'latest',
      header: 'Latest date',
      render: (item) => {
        const latest = item.notes.slice().sort((a, b) => (a.homeworkDate < b.homeworkDate ? 1 : -1))[0];
        return <span className="text-slate-600">{latest ? formatDate(latest.homeworkDate) : '—'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => (item.active ? 1 : 0),
      render: (item) => <StatusBadge active={item.active} />,
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

  const canCreate = !schoolsLoading && !assignmentsLoading && assignments.length > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={NotebookPen}
        title="Homework"
        description="Set and track homework for your classes."
        actions={
          <Button
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
            disabled={!canCreate}
            title={!canCreate && !assignmentsLoading ? 'No assigned classes found for your account.' : undefined}
          >
            Add homework
          </Button>
        }
      />

      {(error || schoolError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || schoolError}
        </div>
      )}

      {!error && !schoolError && !assignmentsLoading && assignments.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {totalMappingsInSchool === 0
            ? 'No teacher-subject assignments exist in this school yet — ask a staff member to assign you to a class first (Staff → Teacher Section).'
            : `Found ${totalMappingsInSchool} assignment(s) in this school, but none match your account's email — this looks like a data mismatch rather than a missing assignment.`}
        </div>
      )}

      <DataTable
        columns={columns}
        data={homeworks}
        rowKey={(item) => item.id}
        loading={loading || schoolsLoading}
        emptyTitle="No homework yet"
        emptyDescription="Add homework for one of your classes to get started."
      />

      {createModalOpen && (
        <HomeworkFormModal
          schoolCode={selectedSchoolCode}
          assignments={assignments}
          defaultTeacherClassId={assignments[0]?.id ?? ''}
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
