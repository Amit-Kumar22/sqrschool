'use client';

import { FormEvent, useState } from 'react';
import { Loader2, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import {
  createAccessAttribute,
  deleteAccessAttribute,
  updateAccessAttribute,
  type AccessAttribute,
} from '@/lib/rolePermissionService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';

/** Manages the access-attribute catalog — the permission categories (Students, Attendance, …) that Roles & Permissions toggles apply to. */
export default function AttributeManagerModal({
  attributes,
  onClose,
  onChanged,
}: {
  attributes: AccessAttribute[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError('');
    try {
      await createAccessAttribute({ attributeName: newName.trim(), active: true });
      setNewName('');
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add this category.'));
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (attr: AccessAttribute) => {
    setEditingId(attr.id);
    setEditValue(attr.attributeName);
  };

  const saveEdit = async (attr: AccessAttribute) => {
    if (!editValue.trim()) return;
    setBusyId(attr.id);
    setError('');
    try {
      await updateAccessAttribute(attr.id, { attributeName: editValue.trim(), active: attr.active });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not rename this category.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (attr: AccessAttribute) => {
    if (!confirm(`Delete "${attr.attributeName}"? This removes it from every teacher's permissions.`)) return;
    setBusyId(attr.id);
    setError('');
    try {
      await deleteAccessAttribute(attr.id);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this category.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal
      icon={Tags}
      title="Manage categories"
      subtitle="Add, rename or remove permission categories."
      size="sm"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <TextField
          label="New category"
          placeholder="e.g. Students"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          wrapperClassName="flex-1"
        />
        <Button type="submit" icon={Plus} size="sm" loading={adding} disabled={!newName.trim()}>
          Add
        </Button>
      </form>

      {error && (
        <div className="animate-fade-in-up mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      <div className="mt-4 space-y-1.5">
        {attributes.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No categories yet.</p>
        ) : (
          attributes.map((attr) => (
            <div key={attr.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              {editingId === attr.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(attr);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="h-8 flex-1 rounded-md border border-amber-300 px-2 text-sm focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
                />
              ) : (
                <span className="flex-1 truncate text-sm font-medium text-slate-800">{attr.attributeName}</span>
              )}

              {busyId === attr.id ? (
                <Loader2 size={14} className="mr-1 animate-spin text-slate-400" />
              ) : editingId === attr.id ? (
                <>
                  <Button type="button" size="sm" onClick={() => saveEdit(attr)}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <IconButton icon={Pencil} label="Rename" onClick={() => startEdit(attr)} />
                  <IconButton icon={Trash2} label="Delete" variant="danger" onClick={() => handleDelete(attr)} />
                </>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
