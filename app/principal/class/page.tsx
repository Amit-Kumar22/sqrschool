'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Inbox, Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteClass, getClasses, type SchoolClass } from '@/lib/classService';
import { getAllTeacherStaff, type TeacherStaffMember } from '@/lib/schoolService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import ClassFormModal from '@/components/class/ClassFormModal';
import AssignTeacherModal from '@/components/class/AssignTeacherModal';

export default function StaffClassPage() {
  const [items, setItems] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SchoolClass | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [teachers, setTeachers] = useState<TeacherStaffMember[]>([]);
  const [assigningItem, setAssigningItem] = useState<SchoolClass | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const content = (await getClasses()).content;
      setItems(content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load classes from the server.'));
    } finally {
      setLoading(false);
    }
  };

  // Which class each teacher is the class teacher for isn't returned by the
  // class list itself — it's only visible from the teacher side via
  // assignedClasses, so it's fetched separately and looked up per card below.
  const loadTeachers = async () => {
    try {
      const content = (await getAllTeacherStaff()).content;
      setTeachers(content);
    } catch {
      // Non-fatal — the page still works without the "Class teacher" badges.
    }
  };

  useEffect(() => {
    loadItems();
    loadTeachers();
  }, []);

  const classTeacherFor = (classId: number) => teachers.find((t) => t.assignedClasses.some((c) => c.id === classId));

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: SchoolClass) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this class? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteClass(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that class.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadItems();
  };

  return (
    <div className="space-y-4">
      <SetPageTitle title="Class" />

      <div className="flex justify-end">
        <Button icon={Plus} onClick={openCreateModal}>
          Add class
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="card-premium p-3">
              <div className="flex items-center gap-2">
                <div className="skeleton h-8 w-8 shrink-0 rounded-lg" />
                <div className="skeleton h-4 w-2/3 rounded-md" />
              </div>
              <div className="skeleton mt-2 h-3 w-full rounded-md" />
              <div className="skeleton mt-2.5 h-4 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card-premium flex flex-col items-center gap-2 px-4 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <Inbox size={20} />
          </span>
          <p className="text-sm font-semibold text-slate-900">No classes yet</p>
          <p className="text-xs text-slate-500">Add the first class to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => {
            const teacher = classTeacherFor(item.id);
            return (
              <div
                key={item.id}
                className="card-premium group relative overflow-hidden p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-amber-lg"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-200 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium-sm transition-transform duration-300 group-hover:scale-110">
                      <GraduationCap size={14} />
                    </span>
                    <p className="truncate text-sm font-semibold text-slate-900">{item.className}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <IconButton icon={UserCog} label="Assign teacher" size="sm" onClick={() => setAssigningItem(item)} />
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

                <p className="mt-2 line-clamp-2 text-xs text-slate-500">{item.description || 'No description'}</p>

                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <StatusBadge active={item.active} />
                  <span className={`truncate text-xs ${teacher ? 'text-slate-600' : 'text-slate-400'}`}>
                    {teacher ? teacher.teacherUser.fullName : 'No class teacher'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {assigningItem && (
        <AssignTeacherModal
          schoolClass={assigningItem}
          teachers={teachers}
          onClose={() => setAssigningItem(null)}
          onAssigned={() => {
            setAssigningItem(null);
            loadTeachers();
          }}
        />
      )}

      {formModalOpen && (
        <ClassFormModal
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
