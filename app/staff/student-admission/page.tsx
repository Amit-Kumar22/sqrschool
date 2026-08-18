'use client';

import { useEffect, useState } from 'react';
import { Eye, Plus, UserPlus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getStudentAdmissions, type StudentAdmission } from '@/lib/studentService';
import { fetchAcrossAllSchools, getSchools, type School } from '@/lib/schoolService';
import { useSchoolCode } from '@/lib/useSchoolCode';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import StudentAdmissionFormModal from '@/components/student-admission/StudentAdmissionFormModal';
import StudentDetailModal from '@/components/student-admission/StudentDetailModal';

export default function StaffStudentAdmissionPage() {
  const { schoolCode: selectedSchoolCode, loading: schoolsLoading, error: schoolError } = useSchoolCode();

  const [students, setStudents] = useState<StudentAdmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<StudentAdmission | null>(null);

  // Only needed when the account has no schoolCode of its own — lets the
  // "Add student" form ask which school to admit the student into, instead
  // of staying disabled forever for admins who manage more than one school.
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsListLoading, setSchoolsListLoading] = useState(false);

  useEffect(() => {
    if (schoolsLoading || selectedSchoolCode) return;
    const loadSchools = async () => {
      setSchoolsListLoading(true);
      try {
        const page = await getSchools();
        setSchools(page.content);
      } catch {
        // Non-fatal — the "Add student" school picker just stays empty.
      } finally {
        setSchoolsListLoading(false);
      }
    };
    loadSchools();
  }, [schoolsLoading, selectedSchoolCode]);

  const loadStudents = async (schoolCode: string) => {
    setLoading(true);
    setError('');
    try {
      const content = schoolCode
        ? (await getStudentAdmissions({ schoolCode })).content
        : await fetchAcrossAllSchools((code) => getStudentAdmissions({ schoolCode: code }));
      setStudents(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load students from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolsLoading) return;
    loadStudents(selectedSchoolCode);
  }, [selectedSchoolCode, schoolsLoading]);

  const handleSaved = async () => {
    setFormModalOpen(false);
    await loadStudents(selectedSchoolCode);
  };

  const columns: DataTableColumn<StudentAdmission>[] = [
    {
      key: 'admissionNumber',
      header: 'Admission No.',
      sortable: true,
      accessor: (item) => item.admissionNumber,
      render: (item) => <p className="font-semibold text-slate-900">{item.admissionNumber}</p>,
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      accessor: (item) => item.user?.fullName,
      render: (item) => <span className="text-slate-700">{item.user?.fullName || '—'}</span>,
    },
    {
      key: 'class',
      header: 'Class / Section',
      render: (item) => (
        <span className="text-slate-600">
          {item.section ? `${item.section.schoolClass?.className} - ${item.section.sectionName}` : '—'}
        </span>
      ),
    },
    {
      key: 'academicYear',
      header: 'Academic Year',
      render: (item) => <span className="text-slate-600">{item.academicYear?.yearCode || '—'}</span>,
    },
    {
      key: 'fatherName',
      header: "Father's Name",
      accessor: (item) => item.fatherName,
      render: (item) => <span className="text-slate-600">{item.fatherName || '—'}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      accessor: (item) => item.user?.phone,
      render: (item) => <span className="text-slate-600">{item.user?.phone || '—'}</span>,
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
      widthClassName: 'w-16',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingStudent(item);
            }}
            title="View details"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={UserPlus}
        title="Student Admission"
        description="View admitted students and add new admissions to a school."
        actions={
          <button
            onClick={() => setFormModalOpen(true)}
            disabled={schoolsLoading || (!selectedSchoolCode && (schoolsListLoading || schools.length === 0))}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-premium-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={16} /> Add student
          </button>
        }
      />

      {(error || schoolError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || schoolError}
        </div>
      )}

      <DataTable
        columns={columns}
        data={students}
        rowKey={(item) => item.id}
        loading={loading || schoolsLoading}
        emptyTitle="No students yet"
        emptyDescription="Admit the first student to get started."
      />

      {formModalOpen && (
        <StudentAdmissionFormModal
          schoolCode={selectedSchoolCode}
          schools={schools}
          onClose={() => setFormModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {viewingStudent && <StudentDetailModal student={viewingStudent} onClose={() => setViewingStudent(null)} />}
    </div>
  );
}
