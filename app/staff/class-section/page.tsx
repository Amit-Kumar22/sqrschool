'use client';

import { useEffect, useState } from 'react';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteSection, getSections, type Section } from '@/lib/classSectionService';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { fetchAcrossAllSchools } from '@/lib/schoolService';
import { useSchoolCode } from '@/lib/useSchoolCode';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import SectionFormModal from '@/components/class-section/SectionFormModal';

export default function StaffClassSectionPage() {
  const { schoolCode: selectedSchoolCode, loading: schoolsLoading, error: schoolError } = useSchoolCode();

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
    if (schoolsLoading) return;
    const loadClasses = async () => {
      setClassesLoading(true);
      setError('');
      try {
        const content = selectedSchoolCode
          ? (await getClasses({ schoolCode: selectedSchoolCode })).content
          : await fetchAcrossAllSchools((code) => getClasses({ schoolCode: code }));
        setClasses(content);
        setSelectedClassId(content.length > 0 ? content[0].id : '');
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load classes from the server.'));
      } finally {
        setClassesLoading(false);
      }
    };
    loadClasses();
  }, [selectedSchoolCode, schoolsLoading]);

  const loadSections = async (classId: number | '') => {
    // Clear immediately (not just on success) so switching classes never
    // leaves the previous class's rows on screen while the new one loads
    // or fails — see the catch block below for why that used to happen.
    setSections([]);
    if (!classId) return;

    setLoading(true);
    setError('');
    try {
      const result = await getSections({ classId });
      setSections(result.sections);
    } catch (err) {
      const message = apiErrorMessage(err, 'Could not load sections from the server.');
      // The backend reports an empty class as an error response (e.g. "No
      // sections are available for class: Class 2") instead of an empty
      // list — treat that as the normal empty state (handled by DataTable's
      // emptyTitle/emptyDescription below) rather than a real failure, so it
      // doesn't show a red error banner for what isn't actually an error.
      if (!/no .*available/i.test(message)) {
        setError(message);
      }
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

  const noClassesForSchool = !schoolsLoading && !classesLoading && classes.length === 0;
  const selectedClassName = classes.find((cls) => cls.id === selectedClassId)?.className;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Layers}
        title="Class Section"
        description="Manage sections within a class."
        actions={
          <Button icon={Plus} onClick={openCreateModal} disabled={classesLoading || classes.length === 0}>
            Add section
          </Button>
        }
      />

      {noClassesForSchool && !error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          This school has no classes yet — add a class first.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
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

      {(error || schoolError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || schoolError}
        </div>
      )}

      <DataTable
        columns={columns}
        data={sections}
        rowKey={(item) => item.id}
        loading={loading || schoolsLoading || classesLoading}
        emptyTitle={selectedClassName ? `No sections for ${selectedClassName}` : 'No sections yet'}
        emptyDescription={
          classes.length === 0
            ? 'Add a class before adding sections.'
            : selectedClassName
              ? `${selectedClassName} doesn't have any sections yet — add the first one.`
              : 'Add the first section to get started.'
        }
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
