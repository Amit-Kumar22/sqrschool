'use client';

import { FormEvent, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Upload } from 'lucide-react';
import { bulkImportStudents, STUDENT_IMPORT_HEADERS, type StudentImportResult } from '@/lib/studentService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

// Header row plus one example row, so principals can see the expected
// formats (dob as YYYY-MM-DD, className matching an existing class).
const downloadTemplate = () => {
  const example = [
    'Rahul Sharma',
    'Suresh Sharma',
    'Anita Sharma',
    'parent@example.com',
    '9876543210',
    'Class 1',
    '2015-06-15',
    '12 MG Road Delhi',
    '110001',
    'MALE',
  ];
  const csv = [STUDENT_IMPORT_HEADERS.join(','), example.join(',')].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'student-import-template.csv';
  link.click();
  URL.revokeObjectURL(url);
};

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
  const [result, setResult] = useState<StudentImportResult | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      setResult(await bulkImportStudents(file));
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to upload the file.'));
    } finally {
      setUploading(false);
    }
  };

  if (result) {
    const hasErrors = result.errors.length > 0 || (result.failed ?? 0) > 0;
    return (
      <Modal
        icon={hasErrors ? AlertTriangle : CheckCircle2}
        title={hasErrors ? 'Import finished with errors' : 'Import complete'}
        accent={hasErrors ? 'rose' : 'emerald'}
        size={hasErrors ? 'md' : 'sm'}
        onClose={onImported}
        footer={
          <Button type="button" onClick={onImported} className="w-full">
            Done
          </Button>
        }
      >
        <div className="grid gap-3 text-sm">
          {(result.imported !== null || result.failed !== null) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
                <div className="text-lg font-semibold text-emerald-700">{result.imported ?? '—'}</div>
                <div className="text-xs text-emerald-700">Imported</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center">
                <div className="text-lg font-semibold text-red-700">{result.failed ?? 0}</div>
                <div className="text-xs text-red-700">Invalid rows</div>
              </div>
            </div>
          )}

          {result.message && <p className="text-center text-slate-500">{result.message}</p>}
          {!result.message && !hasErrors && result.imported === null && (
            <p className="text-center text-slate-500">The file was uploaded successfully.</p>
          )}

          {result.errors.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="w-16 px-3 py-2 font-semibold">Row</th>
                    <th className="px-3 py-2 font-semibold">Problem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.errors.map((rowError, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-slate-700">{rowError.row ?? '—'}</td>
                      <td className="px-3 py-2 text-red-700">{rowError.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      icon={Upload}
      title="Import students"
      subtitle="Bulk-add students from a CSV or Excel file."
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
          <span className="mb-1.5 block font-medium text-slate-700">File (.csv, .xls, .xlsx)</span>
          <input
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError('');
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p className="mb-1 font-medium text-slate-700">The first row must be a header with these columns:</p>
          <p className="break-words font-mono">{STUDENT_IMPORT_HEADERS.join(', ')}</p>
          <button
            type="button"
            onClick={downloadTemplate}
            className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV template
          </button>
        </div>

        {error && (
          <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
      </form>
    </Modal>
  );
}
