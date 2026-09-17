'use client';

import { useState } from 'react';
import { Download, Mail, Wallet } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  updateStaffSalaryStatus,
  STAFF_SALARY_STATUSES,
  type StaffSalary,
  type StaffSalaryStatus,
} from '@/lib/salaryTemplateService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import { StaffSalaryStatusBadge } from '@/components/ui/Badge';
import { downloadSalaryPdf, formatDate, formatMoney, formatSalaryMonth, STATUS_LABELS } from './salaryUtils';

/**
 * Full payslip breakdown, shared by the Principal and Teacher panels. The
 * status changer only renders for the Principal (`canManageStatus`) — a
 * teacher can read and download their own payslip but not move it along.
 */
export default function StaffSalaryDetailModal({
  salary,
  canManageStatus = false,
  onClose,
  onStatusChanged,
}: {
  salary: StaffSalary;
  canManageStatus?: boolean;
  onClose: () => void;
  onStatusChanged?: (updated: StaffSalary) => void;
}) {
  const [status, setStatus] = useState<StaffSalaryStatus>(salary.status);
  const [savingStatus, setSavingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadSalaryPdf(salary);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not download the payslip PDF.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleStatusSave = async () => {
    if (status === salary.status) return;
    setSavingStatus(true);
    setError('');
    try {
      const updated = await updateStaffSalaryStatus(salary.id, status);
      onStatusChanged?.(updated ?? { ...salary, status });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the payslip status.'));
      setStatus(salary.status);
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <Modal
      icon={Wallet}
      title={`Payslip — ${formatSalaryMonth(salary.salaryMonth)}`}
      subtitle={salary.userName || `Staff #${salary.userId}`}
      badge={<StaffSalaryStatusBadge status={salary.status} />}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" icon={Download} loading={downloading} onClick={handleDownload}>
            Download PDF
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 px-4 py-3.5 text-white">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-white/70 uppercase">Net payable</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{formatMoney(salary.netSalary)}</p>
          </div>
          <div className="text-right text-xs text-white/80">
            <p>Gross {formatMoney(salary.grossSalary)}</p>
            <p>Payslip #{salary.id}</p>
          </div>
        </div>

        {salary.userEmail && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Mail size={13} />
            {salary.userEmail}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title="Earnings">
            <Row label="Basic salary" value={formatMoney(salary.basicSalary)} />
            <Row label="Total allowances" value={formatMoney(salary.totalAllowances)} tone="positive" />
            <Row label="Gross salary" value={formatMoney(salary.grossSalary)} emphasis />
          </Panel>

          <Panel title="Deductions">
            <Row label="Total deductions" value={formatMoney(salary.totalDeductions)} tone="negative" />
            <Row label="Net salary" value={formatMoney(salary.netSalary)} emphasis />
          </Panel>

          <Panel title="Attendance">
            <Row label="Working days" value={String(salary.workingDays)} />
            <Row label="Paid days" value={String(salary.paidDays)} />
            <Row label="Unpaid days" value={String(salary.unpaidDays)} />
          </Panel>

          <Panel title="Payment">
            <Row label="Salary month" value={formatSalaryMonth(salary.salaryMonth)} />
            <Row label="Payment date" value={formatDate(salary.paymentDate)} />
            <Row label="Reference" value={salary.paymentReference || '—'} />
            <Row label="Template" value={`#${salary.globalTemplateId}`} />
          </Panel>
        </div>

        {salary.remarks && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Remarks</p>
            <p className="mt-1 text-sm text-slate-700">{salary.remarks}</p>
          </div>
        )}

        {canManageStatus && (
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 p-3.5">
            <SelectField
              label="Change status"
              value={status}
              wrapperClassName="w-48"
              onChange={(e) => setStatus(e.target.value as StaffSalaryStatus)}
            >
              {STAFF_SALARY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </SelectField>
            <Button
              type="button"
              variant="secondary"
              loading={savingStatus}
              disabled={status === salary.status}
              onClick={handleStatusSave}
            >
              Update status
            </Button>
          </div>
        )}

        {error && (
          <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-3">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{title}</p>
      <dl className="grid gap-1.5">{children}</dl>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  emphasis,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative';
  emphasis?: boolean;
}) {
  const toneClass = tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-600' : 'text-slate-800';
  return (
    <div className={`flex items-center justify-between text-sm ${emphasis ? 'border-t border-slate-200 pt-1.5' : ''}`}>
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular-nums ${emphasis ? 'font-bold text-brand-700' : `font-medium ${toneClass}`}`}>{value}</dd>
    </div>
  );
}
