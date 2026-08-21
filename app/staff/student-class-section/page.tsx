'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteStudentClassSection,
  getClassSectionRoster,
  getStudentAdmissions,
  getStudentClassSection,
  type RosterStudent,
  type StudentAdmission,
  type StudentClassSection,
} from '@/lib/studentService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getAcademicYears, type AcademicYear } from '@/lib/academicYearService';
import { fetchAcrossAllSchools } from '@/lib/schoolService';
import { useSchoolCode } from '@/lib/useSchoolCode';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import StudentClassSectionFormModal from '@/components/student-class-section/StudentClassSectionFormModal';

interface RosterRow {
  student: RosterStudent;
  className: string;
  sectionName: string;
  academicYear: string;
}

export default function StaffStudentClassSectionPage() {
  const { schoolCode: selectedSchoolCode, loading: schoolsLoading, error: schoolError } = useSchoolCode();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<StudentAdmission[]>([]);
  const [refDataLoading, setRefDataLoading] = useState(false);

  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [yearFilter, setYearFilter] = useState('');

  const [rows, setRows] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentClassSection | null>(null);
  const [editingLoadingId, setEditingLoadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (schoolsLoading) return;
    const loadRefData = async () => {
      setRefDataLoading(true);
      setError('');
      try {
        const [classesContent, yearsContent, studentsContent] = selectedSchoolCode
          ? await Promise.all([
              getClasses({ schoolCode: selectedSchoolCode }).then((p) => p.content),
              getAcademicYears({ schoolCode: selectedSchoolCode }).then((p) => p.content),
              getStudentAdmissions({ schoolCode: selectedSchoolCode }).then((p) => p.content),
            ])
          : await Promise.all([
              fetchAcrossAllSchools((code) => getClasses({ schoolCode: code })),
              fetchAcrossAllSchools((code) => getAcademicYears({ schoolCode: code })),
              fetchAcrossAllSchools((code) => getStudentAdmissions({ schoolCode: code })),
            ]);
        setClasses(classesContent);
        setAcademicYears(yearsContent);
        setStudents(studentsContent);
        setClassFilter((prev) => prev || (classesContent[0]?.id ?? ''));
        setYearFilter((prev) => prev || yearsContent[0]?.yearCode || '');
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes, academic years or students from the server.'));
      } finally {
        setRefDataLoading(false);
      }
    };
    loadRefData();
  }, [selectedSchoolCode, schoolsLoading]);

  const loadRoster = async (classId: number | '', academicYear: string) => {
    setRows([]);
    if (!classId) return;

    setLoading(true);
    setError('');
    try {
      const result = await getClassSectionRoster({ classId, academicYear: academicYear || undefined });
      setRows(
        result.content.flatMap((group) =>
          group.students.map((student) => ({
            student,
            className: group.className,
            sectionName: group.sectionName,
            academicYear: group.academicYear,
          })),
        ),
      );
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load the class roster from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolsLoading || refDataLoading) return;
    loadRoster(classFilter, yearFilter);
  }, [schoolsLoading, refDataLoading, classFilter, yearFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  // The roster only gives each student's own id — fetching by id here
  // assumes that id doubles as the student-class-section assignment id.
  // If this 404s ("... not found"), that assumption is wrong, same as the
  // teacherId mix-up on the Teacher Section page.
  const openEditModal = async (row: RosterRow) => {
    setError('');
    setEditingLoadingId(row.student.id);
    try {
      const detail = await getStudentClassSection(row.student.id);
      setEditingItem(detail);
      setFormModalOpen(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load this assignment for editing.'));
    } finally {
      setEditingLoadingId(null);
    }
  };

  const handleDelete = async (row: RosterRow) => {
    if (!confirm(`Remove ${row.student.fullName} from ${row.className} ${row.sectionName}? This cannot be undone.`)) return;
    setDeletingId(row.student.id);
    setError('');
    try {
      await deleteStudentClassSection(row.student.id);
      await loadRoster(classFilter, yearFilter);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove that assignment.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadRoster(classFilter, yearFilter);
  };

  const columns: DataTableColumn<RosterRow>[] = [
    {
      key: 'student',
      header: 'Student',
      sortable: true,
      accessor: (row) => row.student.fullName,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.student.fullName}</p>
          <p className="text-xs text-slate-500">{row.student.email}</p>
        </div>
      ),
    },
    {
      key: 'section',
      header: 'Class / Section',
      render: (row) => (
        <span className="text-slate-600">
          {row.className} · {row.sectionName}
        </span>
      ),
    },
    {
      key: 'academicYear',
      header: 'Academic Year',
      sortable: true,
      accessor: (row) => row.academicYear,
      render: (row) => <span className="text-slate-600">{row.academicYear}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-20',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            loading={editingLoadingId === row.student.id}
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === row.student.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
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
      ? 'Add a class before assigning a student.'
      : academicYears.length === 0
        ? 'Add an academic year before assigning a student.'
        : students.length === 0
          ? 'Add a student admission before assigning a student.'
          : '';
  const canCreate = dataReady && !missingPrerequisite;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={UsersRound}
        title="Student Class Section"
        description="Assign students to a class section for an academic year."
        actions={
          <Button icon={Plus} onClick={openCreateModal} disabled={!canCreate} title={missingPrerequisite || undefined}>
            Add assignment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SelectField label="Class" value={classFilter} onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : '')}>
          <option value="" disabled>
            Select a class
          </option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.className}
            </option>
          ))}
        </SelectField>

        <SelectField label="Academic year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">All academic years</option>
          {academicYears.map((year) => (
            <option key={year.id} value={year.yearCode}>
              {year.yearCode}
            </option>
          ))}
        </SelectField>
      </div>

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
        data={rows}
        rowKey={(row) => row.student.id}
        loading={loading || schoolsLoading || refDataLoading}
        emptyTitle="No students assigned yet"
        emptyDescription={
          missingPrerequisite || (classFilter ? 'Add the first student assignment for this class.' : 'Select a class to view its roster.')
        }
      />

      {formModalOpen && (
        <StudentClassSectionFormModal
          item={editingItem}
          classes={classes}
          students={students}
          academicYears={academicYears}
          defaultAcademicYear={yearFilter}
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
