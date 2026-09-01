'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Upload } from 'lucide-react';
import { uploadStudentRawFile } from '@/lib/studentService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function StudentImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await uploadStudentRawFile(file);
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to upload the file.'));
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <Modal
        icon={CheckCircle2}
        title="Import complete"
        accent="emerald"
        size="sm"
        onClose={onImported}
        footer={
          <Button type="button" onClick={onImported} className="w-full">
            Done
          </Button>
        }
      >
        <p className="text-center text-sm text-slate-500">The file was uploaded successfully.</p>
      </Modal>
    );
  }

  return (
    <Modal
      icon={Upload}
      title="Import students"
      subtitle="Bulk-add students from a spreadsheet."
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="student-import-form" loading={uploading} disabled={!file}>
            Upload
          </Button>
        </>
      }
    >
      <form id="student-import-form" onSubmit={handleSubmit} className="grid gap-3">
        <label className="group block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">File</span>
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-amber-700 hover:file:bg-amber-100"
          />
        </label>

        {error && (
          <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
      </form>
    </Modal>
  );
}
