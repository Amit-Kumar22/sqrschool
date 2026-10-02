'use client';

import { FormEvent, useState } from 'react';
import { FileUp, Paperclip, X } from 'lucide-react';
import {
  createDocument,
  DOCUMENT_TYPES,
  documentTypeLabel,
  updateDocument,
  type DocumentPayload,
  type UserDocument,
} from '@/lib/documentService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/FormField';

const MAX_FILE_MB = 10;
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx';

function toFormState(item: UserDocument | null): DocumentPayload {
  if (!item) return { documentType: 'AADHAAR_CARD', documentName: '', documentNumber: '', remarks: '', file: null };
  return {
    documentType: item.documentType,
    documentName: item.documentName,
    documentNumber: item.documentNumber ?? '',
    remarks: item.remarks ?? '',
    file: null,
  };
}

/**
 * Create/edit form for one document. Create always files the document under
 * the signed-in user (backend rule), so only the Student/Parent panels open
 * this in create mode; the admin panel only edits.
 */
export default function DocumentFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: UserDocument | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<DocumentPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof DocumentPayload>(key: K, value: DocumentPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFile = (file: File | null) => {
    if (file && file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is too large — the limit is ${MAX_FILE_MB} MB.`);
      return;
    }
    setError('');
    setField('file', file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.documentType || !form.documentName.trim()) {
      setError('Document type and name are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        documentName: form.documentName.trim(),
        documentNumber: form.documentNumber?.trim(),
        remarks: form.remarks?.trim(),
      };
      if (isEditing) await updateDocument(item!.id, payload);
      else await createDocument(payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'upload'} document.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={FileUp}
      title={isEditing ? `Edit "${item!.documentName}"` : 'Upload document'}
      subtitle={isEditing ? 'Update this document’s details or replace its file.' : 'Add a new document to your records.'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="document-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Upload'}
          </Button>
        </>
      }
    >
      <form id="document-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField
          label="Document type"
          required
          value={form.documentType}
          onChange={(e) => setField('documentType', e.target.value as DocumentPayload['documentType'])}
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {documentTypeLabel(type)}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Document name"
          required
          placeholder="e.g. Aadhaar card (front & back)"
          value={form.documentName}
          onChange={(e) => setField('documentName', e.target.value)}
        />
        <TextField
          label="Document number"
          placeholder="Optional"
          value={form.documentNumber ?? ''}
          onChange={(e) => setField('documentNumber', e.target.value)}
        />

        <div className="text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">File</span>
          {form.file ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2 text-slate-700">
                <Paperclip size={14} className="shrink-0 text-brand-600" />
                <span className="truncate">{form.file.name}</span>
                <span className="shrink-0 text-xs text-slate-400">{(form.file.size / 1024).toFixed(0)} KB</span>
              </span>
              <IconButton icon={X} label="Remove file" size="sm" onClick={() => handleFile(null)} />
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-5 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40">
              <FileUp size={18} className="text-brand-600" />
              <span className="text-sm font-medium text-slate-700">
                {isEditing && item!.fileUrl ? 'Choose a file to replace the current one' : 'Choose a file'}
              </span>
              <span className="text-xs text-slate-400">PDF, image or Word · up to {MAX_FILE_MB} MB</span>
              <input
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

        <TextareaField
          label="Remarks"
          rows={2}
          value={form.remarks ?? ''}
          onChange={(e) => setField('remarks', e.target.value)}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
