'use client';

import { FormEvent, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { documentTypeLabel, verifyDocument, type UserDocument } from '@/lib/documentService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextareaField } from '@/components/ui/FormField';

/** Admin-side confirmation for marking a document verified, with optional remarks. */
export default function VerifyDocumentModal({
  item,
  onClose,
  onVerified,
}: {
  item: UserDocument;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await verifyDocument(item.id, remarks.trim());
      onVerified();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to verify document.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={BadgeCheck}
      accent="emerald"
      title={`Verify "${item.documentName}"`}
      subtitle={`${documentTypeLabel(item.documentType)}${item.userFullName ? ` · ${item.userFullName}` : ''}`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="verify-document-form" icon={BadgeCheck} loading={saving}>
            Mark verified
          </Button>
        </>
      }
    >
      <form id="verify-document-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextareaField
          label="Remarks"
          hint="Optional — visible to the document owner."
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
