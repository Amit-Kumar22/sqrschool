'use client';

import { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getTeacherSubjectMappingsAdmin, type TeacherSubjectMapping } from '@/lib/teacherSubjectService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';

export default function PrincipalTeacherSectionPage() {
  const [mappings, setMappings] = useState<TeacherSubjectMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMappings = async () => {
      setLoading(true);
      setError('');
      try {
        const content = (await getTeacherSubjectMappingsAdmin()).content;
        setMappings(content);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load teacher-subject assignments from the server.'));
      } finally {
        setLoading(false);
      }
    };
    loadMappings();
  }, []);

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
  ];

  return (
    <div className="space-y-4">
      <PageHeader icon={UserCog} title="Teacher Assignments" description="View teacher-subject-section assignments across the school." />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={mappings}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No assignments yet"
        emptyDescription="Teacher-subject assignments created by staff will show up here."
      />
    </div>
  );
}
