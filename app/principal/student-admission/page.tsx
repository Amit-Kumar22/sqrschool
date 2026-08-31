'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteStudent, getStudentAdmissions, type FeeStatus, type StudentAdmission } from '@/lib/studentService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import StudentAdmissionFormModal from '@/components/student-admission/StudentAdmissionFormModal';
import StudentEditFormModal from '@/components/student-admission/StudentEditFormModal';

const FEE_STATUS_OPTIONS: { value: FeeStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'DUES', label: 'Dues' },
  { value: 'PAID', label: 'Paid' },
];

export default function StaffStudentAdmissionPage() {
  const router = useRouter();

  const [students, setStudents] = useState<StudentAdmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<FeeStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentAdmission | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setClassesLoading(true);
    getClasses()
      .then((page) => {
        const content = page.content ?? [];
        setClasses(content);
        setClassFilter((prev) => prev || (content[0]?.id ?? ''));
      })
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, []);

  // classId is required by the backend — nothing loads until a class is selected.
  const loadStudents = async () => {
    if (!classFilter) return;
    setLoading(true);
    setError('');
    try {
      const content = (
        await getStudentAdmissions({
          classId: classFilter,
          feeStatus: feeStatusFilter || undefined,
          search: activeSearch || undefined,
        })
      ).content;
      setStudents(content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load students from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, feeStatusFilter, activeSearch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm.trim());
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    await loadStudents();
  };

  const handleEditSaved = async () => {
    setEditingStudent(null);
    await loadStudents();
  };

  const handleDelete = async (student: StudentAdmission) => {
    if (!confirm(`Delete ${student.studentUser?.fullName ?? 'this student'}? This cannot be undone.`)) return;
    setDeletingId(student.id);
    setError('');
    try {
      await deleteStudent(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that student.'));
    } finally {
      setDeletingId(null);
    }
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
      accessor: (item) => item.studentUser?.fullName,
      render: (item) => <span className="text-slate-700">{item.studentUser?.fullName || '—'}</span>,
    },
    {
      key: 'class',
      header: 'Class',
      render: (item) => <span className="text-slate-600">{item.schoolClass?.className || '—'}</span>,
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
      accessor: (item) => item.studentUser?.phone,
      render: (item) => <span className="text-slate-600">{item.studentUser?.phone || '—'}</span>,
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
      widthClassName: 'w-24',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Eye}
            label="View details"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/principal/student-admission/${item.id}`);
            }}
          />
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              setEditingStudent(item);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SetPageTitle title="Student Admission" />

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-wrap items-end gap-2">
          <SelectField
            label="Class"
            required
            wrapperClassName="w-40"
            value={classFilter}
            disabled={classesLoading || classes.length === 0}
            onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="" disabled>
              {classesLoading ? 'Loading…' : 'Select a class'}
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Fee status"
            wrapperClassName="w-40"
            value={feeStatusFilter}
            onChange={(e) => setFeeStatusFilter(e.target.value as FeeStatus | '')}
          >
            <option value="">All fee statuses</option>
            {FEE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students"
                className="h-10 w-52 rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm text-slate-700 shadow-premium-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              title="Search"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
            >
              <Search size={15} />
            </button>
            {activeSearch && (
              <button
                type="button"
                onClick={clearSearch}
                title="Clear search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <X size={15} />
              </button>
            )}
          </form>
        </div>

        <Button icon={Plus} onClick={() => setFormModalOpen(true)}>
          Add student
        </Button>
      </div>

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

      {editingStudent && (
        <StudentEditFormModal student={editingStudent} onClose={() => setEditingStudent(null)} onSaved={handleEditSaved} />
      )}
    </div>
  );
}
