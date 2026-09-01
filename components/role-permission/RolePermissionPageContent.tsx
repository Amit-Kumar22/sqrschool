'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Save, ShieldCheck, Tags } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getAllTeacherStaff, type TeacherStaffMember } from '@/lib/schoolService';
import {
  getAccessAttributes,
  getStaffPermissions,
  saveStaffPermissions,
  updateStaffPermissions,
  type AccessAttribute,
  type PermissionInput,
  type StaffPermissionRecord,
} from '@/lib/rolePermissionService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import AttributeManagerModal from './AttributeManagerModal';

type PermissionFlags = {
  canRead: boolean;
  canAdd: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

const BLANK_FLAGS: PermissionFlags = { canRead: false, canAdd: false, canUpdate: false, canDelete: false };

type ActionKey = keyof PermissionFlags;
interface ActionDef {
  key: ActionKey;
  label: string;
}

// Curated action sets for the school's known permission modules — these
// mirror the sidebar's own module names (navConfig.ts), which the real
// access-attribute catalog is expected to share. An attribute name that
// doesn't match any known keyword still renders, via the generic
// View/Create/Edit/Delete fallback below, so a new backend attribute never
// gets silently dropped.
const CURATED_ACTIONS: { match: string; actions: ActionDef[] }[] = [
  {
    match: 'student',
    actions: [
      { key: 'canRead', label: 'View All Students' },
      { key: 'canAdd', label: 'Create Student' },
      { key: 'canUpdate', label: 'Edit Student' },
      { key: 'canDelete', label: 'Delete Student' },
    ],
  },
  {
    match: 'attendance',
    actions: [
      { key: 'canRead', label: 'View Attendance' },
      { key: 'canUpdate', label: 'Mark Attendance' },
    ],
  },
  {
    match: 'exam',
    actions: [
      { key: 'canRead', label: 'View Exams' },
      { key: 'canAdd', label: 'Create Exam' },
      { key: 'canUpdate', label: 'Enter Marks' },
    ],
  },
  {
    match: 'homework',
    actions: [
      { key: 'canRead', label: 'View Homework' },
      { key: 'canAdd', label: 'Assign Homework' },
    ],
  },
  {
    match: 'notice',
    actions: [
      { key: 'canRead', label: 'View Notices' },
      { key: 'canAdd', label: 'Create Notice' },
    ],
  },
  {
    match: 'fee',
    actions: [
      { key: 'canRead', label: 'View Fees' },
      { key: 'canAdd', label: 'Create Fee Structure' },
      { key: 'canUpdate', label: 'Collect Payment' },
    ],
  },
  {
    match: 'class',
    actions: [
      { key: 'canRead', label: 'View Classes' },
      { key: 'canAdd', label: 'Create Class' },
      { key: 'canUpdate', label: 'Edit Class' },
    ],
  },
  {
    match: 'time table',
    actions: [
      { key: 'canRead', label: 'View Timetable' },
      { key: 'canUpdate', label: 'Edit Timetable' },
    ],
  },
  {
    match: 'timetable',
    actions: [
      { key: 'canRead', label: 'View Timetable' },
      { key: 'canUpdate', label: 'Edit Timetable' },
    ],
  },
];

const defaultActions = (name: string): ActionDef[] => [
  { key: 'canRead', label: `View ${name}` },
  { key: 'canAdd', label: `Create ${name}` },
  { key: 'canUpdate', label: `Edit ${name}` },
  { key: 'canDelete', label: `Delete ${name}` },
];

const actionsForAttribute = (name: string): ActionDef[] => {
  const lower = name.toLowerCase();
  const curated = CURATED_ACTIONS.find((c) => lower.includes(c.match));
  return curated ? curated.actions : defaultActions(name);
};

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Roles & Permissions — assign per-attribute canRead/canAdd/canUpdate/canDelete grants to a teacher. */
export default function RolePermissionPageContent() {
  const [teachers, setTeachers] = useState<TeacherStaffMember[]>([]);
  const [attributes, setAttributes] = useState<AccessAttribute[]>([]);
  const [records, setRecords] = useState<StaffPermissionRecord[]>([]);
  const [refLoading, setRefLoading] = useState(true);
  const [error, setError] = useState('');

  // Keyed by teacherUser.id (the user account id staff-permissions expects
  // as userId) — not teacher.id, which is the teacher-profile record id.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [localPerms, setLocalPerms] = useState<Record<number, PermissionFlags>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [manageOpen, setManageOpen] = useState(false);

  const loadAll = async () => {
    setRefLoading(true);
    setError('');
    try {
      const [teachersPage, attrs, permsPage] = await Promise.all([
        getAllTeacherStaff(),
        getAccessAttributes(),
        getStaffPermissions(),
      ]);
      const teacherList = teachersPage.content ?? [];
      setTeachers(teacherList);
      setAttributes(attrs ?? []);
      setRecords(permsPage.content ?? []);
      setSelectedId((prev) => prev ?? teacherList[0]?.teacherUser?.id ?? null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load roles and permissions data.'));
    } finally {
      setRefLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTeacher = teachers.find((t) => t.teacherUser?.id === selectedId) ?? null;
  const existingRecord = records.find((r) => r.staff?.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    const map: Record<number, PermissionFlags> = {};
    attributes.forEach((attr) => {
      const existing = existingRecord?.permissions.find((p) => p.attribute?.id === attr.id);
      map[attr.id] = existing
        ? { canRead: existing.canRead, canAdd: existing.canAdd, canUpdate: existing.canUpdate, canDelete: existing.canDelete }
        : { ...BLANK_FLAGS };
    });
    setLocalPerms(map);
    setSaveError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, attributes, existingRecord]);

  const rows = useMemo(
    () => attributes.map((attr) => ({ attribute: attr, actions: actionsForAttribute(attr.attributeName) })),
    [attributes],
  );

  const activeCount = rows.reduce((count, row) => {
    const flags = localPerms[row.attribute.id];
    if (!flags) return count;
    return count + row.actions.filter((a) => flags[a.key]).length;
  }, 0);

  const toggleAction = (attributeId: number, key: ActionKey) => {
    setLocalPerms((prev) => ({
      ...prev,
      [attributeId]: { ...(prev[attributeId] ?? BLANK_FLAGS), [key]: !(prev[attributeId]?.[key] ?? false) },
    }));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setSaveError('');
    try {
      const permissions: PermissionInput[] = attributes.map((attr) => ({
        attributeId: attr.id,
        ...(localPerms[attr.id] ?? BLANK_FLAGS),
      }));
      const payload = { userId: selectedId, permissions };
      if (existingRecord) {
        await updateStaffPermissions(payload);
      } else {
        await saveStaffPermissions(payload);
      }
      // Re-sync from the canonical list rather than trusting the add/update
      // response shape — merging that response directly was fragile: any
      // mismatch left `records` out of sync, so the next save could wrongly
      // call add again instead of update, and toggles could appear to reset
      // on reselect/refresh even when the server had it right.
      const permsPage = await getStaffPermissions();
      setRecords(permsPage.content ?? []);
    } catch (err) {
      setSaveError(apiErrorMessage(err, 'Could not save permissions.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <SetPageTitle title="Roles & Permissions" />

      <PageHeader
        icon={ShieldCheck}
        title="Roles & Permissions"
        description="Assign permissions to teachers"
        actions={
          <Button icon={Tags} variant="secondary" size="sm" onClick={() => setManageOpen(true)}>
            Manage categories
          </Button>
        }
      />

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
        <div className="card-premium overflow-hidden">
          <p className="border-b border-slate-100 px-3.5 py-2.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Teachers</p>
          <div className="scrollbar-thin max-h-[70vh] overflow-y-auto">
            {refLoading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 rounded-lg" />
                ))}
              </div>
            ) : teachers.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-sm text-slate-400">No teachers yet.</p>
            ) : (
              teachers.map((teacher) => {
                const uid = teacher.teacherUser?.id;
                const active = !!uid && uid === selectedId;
                return (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => uid && setSelectedId(uid)}
                    className={`flex w-full items-center gap-2.5 border-l-2 px-3.5 py-2.5 text-left transition-colors ${
                      active ? 'border-l-amber-500 bg-amber-50/60' : 'border-l-transparent hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-semibold text-white">
                      {initialsOf(teacher.teacherUser?.fullName || '?') || '?'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{teacher.teacherUser?.fullName || '—'}</span>
                      <span className="block truncate text-xs text-slate-400">{teacher.employeeCode}</span>
                    </span>
                    <ChevronRight size={14} className={active ? 'text-amber-500' : 'text-slate-300'} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="card-premium p-4">
          {!selectedTeacher ? (
            <p className="py-10 text-center text-sm text-slate-400">Select a teacher to manage permissions.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedTeacher.teacherUser?.fullName}</p>
                  <p className="text-xs text-slate-500">{selectedTeacher.teacherUser?.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500">{activeCount} active</span>
                  <Button icon={Save} size="sm" loading={saving} onClick={handleSave} disabled={refLoading || attributes.length === 0}>
                    Save
                  </Button>
                </div>
              </div>

              {saveError && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</div>
              )}

              <div className="mt-3 space-y-4">
                {refLoading ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="skeleton h-11 rounded-lg" />
                    ))}
                  </div>
                ) : attributes.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <p className="text-sm text-slate-400">No permission categories configured yet.</p>
                    <Button icon={Tags} size="sm" variant="secondary" onClick={() => setManageOpen(true)}>
                      Add a category
                    </Button>
                  </div>
                ) : (
                  rows.map(({ attribute, actions }) => (
                    <div key={attribute.id}>
                      <p className="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">{attribute.attributeName}</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {actions.map((action) => {
                          const checked = localPerms[attribute.id]?.[action.key] ?? false;
                          return (
                            <div
                              key={action.key}
                              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                                checked ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <span className="text-sm font-medium text-slate-800">{action.label}</span>
                              <Toggle checked={checked} onChange={() => toggleAction(attribute.id, action.key)} label={action.label} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {manageOpen && (
        <AttributeManagerModal attributes={attributes} onClose={() => setManageOpen(false)} onChanged={loadAll} />
      )}
    </div>
  );
}
