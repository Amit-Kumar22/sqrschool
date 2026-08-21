'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteTeacherSubjectMapping,
  getTeacherSubjectMappings,
  type TeacherSubjectMapping,
} from '@/lib/teacherSubjectService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSubjects, type Subject } from '@/lib/subjectService';
import { getAllTeachers } from '@/lib/schoolService';
import type { StudentAdmission } from '@/lib/studentService';
import { useSchoolCode } from '@/lib/useSchoolCode';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import TeacherSubjectFormModal from '@/components/teacher-subject/TeacherSubjectFormModal';

export default function StaffTeacherSectionPage() {
  const { schoolCode: selectedSchoolCode, loading: schoolsLoading, error: schoolError } = useSchoolCode();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<StudentAdmission[]>([]);
  const [refDataLoading, setRefDataLoading] = useState(false);

  const [mappings, setMappings] = useState<TeacherSubjectMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeacherSubjectMapping | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (schoolsLoading || !selectedSchoolCode) return;
    const loadRefData = async () => {
      setRefDataLoading(true);
      setError('');
      try {
        const [classesPage, subjectsPage, teachersPage] = await Promise.all([
          getClasses({ schoolCode: selectedSchoolCode }),
          getSubjects({ schoolCode: selectedSchoolCode }),
          getAllTeachers({ schoolCode: selectedSchoolCode }),
        ]);
        setClasses(classesPage.content);
        setSubjects(subjectsPage.content);
        setTeachers(teachersPage.content);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes, subjects or teachers from the server.'));
      } finally {
        setRefDataLoading(false);
      }
    };
    loadRefData();
  }, [selectedSchoolCode, schoolsLoading]);

  const loadMappings = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getTeacherSubjectMappings();
      setMappings(result.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load teacher-subject assignments from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolsLoading) return;
    loadMappings();
  }, [schoolsLoading]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: TeacherSubjectMapping) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this assignment? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteTeacherSubjectMapping(id);
      setMappings((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that assignment.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadMappings();
  };

  const columns: DataTableColumn<TeacherSubjectMapping>[] = [
    {
      key: 'teacher',
      header: 'Teacher',
      sortable: true,
      accessor: (item) => item.teacher.fullName,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.teacher.fullName}</p>
          <p className="text-xs text-slate-500">{item.teacher.email}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      accessor: (item) => item.subject.subjectName,
      render: (item) => <span className="text-slate-700">{item.subject.subjectName}</span>,
    },
    {
      key: 'section',
      header: 'Class / Section',
      render: (item) => (
        <span className="text-slate-600">
          {item.section.schoolClass.className} · {item.section.sectionName}
        </span>
      ),
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
      widthClassName: 'w-20',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
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

  const dataReady = !schoolsLoading && !refDataLoading;
  const missingPrerequisite = !dataReady
    ? ''
    : classes.length === 0
      ? 'Add a class before creating an assignment.'
      : subjects.length === 0
        ? 'Add a subject before creating an assignment.'
        : teachers.length === 0
          ? 'No teachers found for this school yet.'
          : '';
  const canCreate = dataReady && !missingPrerequisite;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={UserCog}
        title="Teacher Section"
        description="Assign teachers to a subject for a class section."
        actions={
          <Button icon={Plus} onClick={openCreateModal} disabled={!canCreate} title={missingPrerequisite || undefined}>
            Add assignment
          </Button>
        }
      />

      {(error || schoolError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || schoolError}
        </div>
      )}

      {!error && !schoolError && missingPrerequisite && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {missingPrerequisite}
        </div>
      )}

      <DataTable
        columns={columns}
        data={mappings}
        rowKey={(item) => item.id}
        loading={loading || schoolsLoading}
        emptyTitle="No assignments yet"
        emptyDescription={missingPrerequisite || 'Add the first teacher-subject assignment to get started.'}
      />

      {formModalOpen && (
        <TeacherSubjectFormModal
          item={editingItem}
          schoolCode={selectedSchoolCode}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
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
