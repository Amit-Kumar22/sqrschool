'use client';

import { useEffect, useState } from 'react';
import { Layers, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteSection, getSections, type Section } from '@/lib/classSectionService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSchools, type School } from '@/lib/schoolService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import SectionFormModal from '@/components/class-section/SectionFormModal';

export default function StaffClassSectionPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState('');

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Section | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const loadSchools = async () => {
      setSchoolsLoading(true);
      setError('');
      try {
        const page = await getSchools();
        setSchools(page.content);
        if (page.content.length > 0) setSelectedSchoolCode(page.content[0].schoolCode);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load schools from the server.'));
      } finally {
        setSchoolsLoading(false);
      }
    };
    loadSchools();
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      if (!selectedSchoolCode) {
        setClasses([]);
        setSelectedClassId('');
        return;
      }
      setClassesLoading(true);
      setError('');
      try {
        const page = await getClasses({ schoolCode: selectedSchoolCode });
        setClasses(page.content);
        setSelectedClassId(page.content.length > 0 ? page.content[0].id : '');
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes from the server.'));
      } finally {
        setClassesLoading(false);
      }
    };
    loadClasses();
  }, [selectedSchoolCode]);

  const loadSections = async (classId: number | '') => {
    if (!classId) {
      setSections([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await getSections({ classId });
      setSections(result.sections);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load sections from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections(selectedClassId);
  }, [selectedClassId]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: Section) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this section? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteSection(id);
      setSections((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that section.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadSections(selectedClassId);
  };

  const columns: DataTableColumn<Section>[] = [
    {
      key: 'sectionName',
      header: 'Section',
      sortable: true,
      accessor: (item) => item.sectionName,
      render: (item) => <p className="font-semibold text-slate-900">{item.sectionName}</p>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-20',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
            title="Edit"
            className="rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            disabled={deletingId === item.id}
            title="Delete"
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {deletingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      ),
    },
  ];

  const noClassesForSchool = !schoolsLoading && !classesLoading && schools.length > 0 && classes.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Layers}
        title="Class Section"
        description="Manage sections within a class."
        actions={
          <button
            onClick={openCreateModal}
            disabled={classesLoading || classes.length === 0}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-premium-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={16} /> Add section
          </button>
        }
      />

      {!schoolsLoading && schools.length === 0 && !error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Add a school first — sections are managed per class.
        </div>
      )}
      {noClassesForSchool && !error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          This school has no classes yet — add a class first.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="block text-sm">
          <span className="sr-only">School</span>
          <select
            value={selectedSchoolCode}
            onChange={(e) => setSelectedSchoolCode(e.target.value)}
            disabled={schoolsLoading || schools.length === 0}
            className="h-9 min-w-48 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-50"
          >
            {schools.length === 0 && <option value="">No schools yet</option>}
            {schools.map((school) => (
              <option key={school.id} value={school.schoolCode}>
                {school.schoolName} ({school.schoolCode})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="sr-only">Class</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : '')}
            disabled={classesLoading || classes.length === 0}
            className="h-9 min-w-40 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-50"
          >
            {classes.length === 0 && <option value="">No classes yet</option>}
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.className}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={sections}
        rowKey={(item) => item.id}
        loading={loading || schoolsLoading || classesLoading}
        emptyTitle="No sections yet"
        emptyDescription={classes.length === 0 ? 'Add a class before adding sections.' : 'Add the first section to get started.'}
      />

      {formModalOpen && (
        <SectionFormModal
          item={editingItem}
          classes={classes}
          defaultClassId={selectedClassId}
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
