'use client';

import { useEffect, useState } from 'react';
import { Eye, Plus, UserPlus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getStudentAdmissions, type StudentAdmission } from '@/lib/studentService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import StudentAdmissionFormModal from '@/components/student-admission/StudentAdmissionFormModal';
import StudentDetailModal from '@/components/student-admission/StudentDetailModal';

export default function StaffStudentAdmissionPage() {
  const [students, setStudents] = useState<StudentAdmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<StudentAdmission | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const content = (await getStudentAdmissions()).content;
      setStudents(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load students from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSaved = async () => {
    setFormModalOpen(false);
    await loadStudents();
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
          <IconButton
            icon={Eye}
            label="View details"
            onClick={(e) => {
              e.stopPropagation();
              setViewingStudent(item);
            }}
          />
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
          <Button icon={Plus} onClick={() => setFormModalOpen(true)}>
            Add student
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={students}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No students yet"
        emptyDescription="Admit the first student to get started."
      />

      {formModalOpen && (
        <StudentAdmissionFormModal onClose={() => setFormModalOpen(false)} onSaved={handleSaved} />
      )}

      {viewingStudent && <StudentDetailModal student={viewingStudent} onClose={() => setViewingStudent(null)} />}
    </div>
  );
}
