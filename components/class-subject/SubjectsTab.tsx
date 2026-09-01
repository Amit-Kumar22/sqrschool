'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Inbox, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteSubject, getSubjects, type Subject } from '@/lib/subjectService';
import Button, { IconButton } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import SubjectFormModal from '@/components/subject/SubjectFormModal';

/** Subject catalog — plain CRUD list. Every subject here is what the Assign Subjects and Summary tabs cross-reference by subjectId. */
export default function SubjectsTab() {
  const [items, setItems] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameFilter, setNameFilter] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subject | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadItems = async (subjectName: string) => {
    setLoading(true);
    setError('');
    try {
      const content = (await getSubjects({ subjectName: subjectName || undefined })).content;
      setItems(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load subjects from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(nameFilter);
  }, [nameFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: Subject) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subject? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteSubject(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that subject.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadItems(nameFilter);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <TextField
          label="Search"
          icon={Search}
          placeholder="Search by subject name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          wrapperClassName="max-w-xs"
        />

        <Button icon={Plus} onClick={openCreateModal}>
          Add subject
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="card-premium p-3">
              <div className="flex items-center gap-2">
                <div className="skeleton h-8 w-8 shrink-0 rounded-lg" />
                <div className="skeleton h-4 w-2/3 rounded-md" />
              </div>
              <div className="skeleton mt-3 h-3 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card-premium flex flex-col items-center gap-2 px-4 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <Inbox size={20} />
          </span>
          <p className="text-sm font-semibold text-slate-900">No subjects yet</p>
          <p className="text-xs text-slate-500">Add the first subject to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="card-premium group relative overflow-hidden p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-amber-lg"
            >
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-200 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium-sm transition-transform duration-300 group-hover:scale-110">
                    <BookOpen size={14} />
                  </span>
                  <p className="truncate text-sm font-semibold text-slate-900">{item.subjectName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton icon={Pencil} label="Edit" variant="primary" size="sm" onClick={() => openEditModal(item)} />
                  <IconButton
                    icon={Trash2}
                    label="Delete"
                    variant="danger"
                    size="sm"
                    loading={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                  />
                </div>
              </div>

              <div className="mt-2.5 border-t border-slate-100 pt-2">
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                  {item.subjectCode}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {formModalOpen && (
        <SubjectFormModal
          item={editingItem}
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
