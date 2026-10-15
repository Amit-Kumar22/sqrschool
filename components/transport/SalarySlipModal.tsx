'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Printer } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getTransportSalarySlip, type TransportSalary } from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ErrorBanner, formatMonth } from './transportUi';

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Shows the backend-formatted salary slip, with print and plain-text download. */
export default function SalarySlipModal({ salary, onClose }: { salary: TransportSalary; onClose: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTransportSalarySlip(salary.id)
      .then(setLines)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load the salary slip.')))
      .finally(() => setLoading(false));
  }, [salary.id]);

  const fileBase = `salary-slip-${(salary.staffName || 'staff').replace(/\s+/g, '-').toLowerCase()}-${salary.salaryMonth.slice(0, 7)}`;

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=720,height=900');
    if (!win) return;
    win.document.write(
      `<!doctype html><html><head><title>${escapeHtml(fileBase)}</title><style>body{font-family:ui-monospace,Menlo,monospace;font-size:13px;padding:32px;color:#0f172a}pre{white-space:pre-wrap}</style></head><body><pre>${escapeHtml(lines.join('\n'))}</pre></body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileBase}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      icon={FileText}
      title="Salary slip"
      subtitle={`${salary.staffName} · ${formatMonth(salary.salaryMonth)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" icon={Download} onClick={handleDownload} disabled={!lines.length}>
            Download
          </Button>
          <Button icon={Printer} onClick={handlePrint} disabled={!lines.length}>
            Print
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={22} className="animate-spin text-brand-600" />
        </div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : lines.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">The slip is empty.</p>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600" />
          <pre className="scrollbar-thin overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-slate-800">{lines.join('\n')}</pre>
        </div>
      )}
    </Modal>
  );
}
