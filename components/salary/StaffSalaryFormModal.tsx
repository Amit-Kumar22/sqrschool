'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  createStaffSalary,
  templateAllowances,
  templateDeductions,
  updateStaffSalary,
  STAFF_SALARY_STATUSES,
  type SalaryTemplate,
  type StaffSalary,
  type StaffSalaryPayload,
  type StaffSalaryStatus,
} from '@/lib/salaryTemplateService';
import type { TeacherStaffMember } from '@/lib/schoolService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/FormField';
import { dateToMonthInput, formatMoney, monthInputToDate, STATUS_LABELS, todayInput } from './salaryUtils';

function toFormState(item: StaffSalary | null, defaultTemplate: SalaryTemplate | null): StaffSalaryPayload {
  if (!item) {
    return {
      userId: 0,
      globalTemplateId: defaultTemplate?.id ?? 0,
      salaryMonth: `${todayInput().slice(0, 7)}-01`,
      basicSalary: defaultTemplate?.basicSalary ?? 0,
      workingDays: 0,
      paidDays: 0,
      unpaidDays: 0,
      status: 'DRAFT',
      paymentDate: '',
      paymentReference: '',
      remarks: '',
    };
  }
  return {
    userId: item.userId,
    globalTemplateId: item.globalTemplateId,
    salaryMonth: item.salaryMonth,
    basicSalary: item.basicSalary,
    workingDays: item.workingDays,
    paidDays: item.paidDays,
    unpaidDays: item.unpaidDays,
    status: item.status,
    paymentDate: item.paymentDate ?? '',
    paymentReference: item.paymentReference ?? '',
    remarks: item.remarks ?? '',
  };
}

/**
 * Create/edit form for one staff payslip. The staff dropdown is fed by the
 * teacher roster and the template dropdown by the salary templates, so a
 * payslip is always tied back to a real user and a real pay structure.
 */
export default function StaffSalaryFormModal({
  item,
  staff,
  templates,
  onClose,
  onSaved,
}: {
  item: StaffSalary | null;
  staff: TeacherStaffMember[];
  templates: SalaryTemplate[];
  onClose: () => void;
  onSaved: (item: StaffSalary) => void;
}) {
  const activeTemplate = useMemo(() => templates.find((t) => t.active) ?? null, [templates]);
  const [form, setForm] = useState<StaffSalaryPayload>(() => toFormState(item, activeTemplate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof StaffSalaryPayload>(key: K, value: StaffSalaryPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectedTemplate = templates.find((t) => t.id === form.globalTemplateId) ?? null;

  // Mirrors how the backend builds a payslip: the template supplies the
  // allowance/deduction components, the form supplies basic pay. Shown as an
  // estimate because the server is what actually persists these totals (and
  // may pro-rate by paid days).
  const preview = useMemo(() => {
    const allowances = selectedTemplate ? templateAllowances(selectedTemplate) : 0;
    const deductions = selectedTemplate ? templateDeductions(selectedTemplate) : 0;
    const gross = (form.basicSalary || 0) + allowances;
    return { allowances, deductions, gross, net: gross - deductions };
  }, [selectedTemplate, form.basicSalary]);

  /** Keeps unpaid days in step with working/paid days — the API stores all three separately. */
  const setAttendanceDays = (key: 'workingDays' | 'paidDays', value: number) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      next.unpaidDays = Math.max(0, (next.workingDays || 0) - (next.paidDays || 0));
      return next;
    });

  /** Picking a template pulls its basic pay across, unless the user already typed one in. */
  const handleTemplateChange = (templateId: number) =>
    setForm((f) => {
      const template = templates.find((t) => t.id === templateId);
      const inheritedBasic = templates.find((t) => t.id === f.globalTemplateId)?.basicSalary;
      const keepBasic = f.basicSalary && f.basicSalary !== inheritedBasic;
      return {
        ...f,
        globalTemplateId: templateId,
        basicSalary: keepBasic ? f.basicSalary : (template?.basicSalary ?? f.basicSalary),
      };
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.userId) {
      setError('Please select a staff member.');
      return;
    }
    if (!form.globalTemplateId) {
      setError('Please select a salary template.');
      return;
    }
    if (!form.salaryMonth) {
      setError('Please choose a salary month.');
      return;
    }
    if (!form.basicSalary || form.basicSalary <= 0) {
      setError('Basic salary must be greater than zero.');
      return;
    }
    if (form.paidDays > form.workingDays) {
      setError('Paid days cannot exceed working days.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateStaffSalary(item!.id, form) : await createStaffSalary(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} salary record.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Wallet}
      title={isEditing ? `Edit payslip #${item!.id}` : 'New staff salary'}
      subtitle={isEditing ? item!.userName : 'Generate a payslip for one staff member from a salary template.'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="staff-salary-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create payslip'}
          </Button>
        </>
      }
    >
      <form id="staff-salary-form" onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <SelectField
            label="Staff member"
            required
            value={form.userId || ''}
            // Reassigning a saved payslip to a different person would silently
            // rewrite whose record it is, so the staff member is fixed on edit.
            disabled={isEditing}
            onChange={(e) => setField('userId', Number(e.target.value))}
          >
            <option value="" disabled>
              {staff.length === 0 ? 'No staff found' : 'Select a staff member'}
            </option>
            {staff.map((member) => (
              <option key={member.teacherUser.id} value={member.teacherUser.id}>
                {member.teacherUser.fullName}
                {member.employeeCode ? ` (${member.employeeCode})` : ''}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Salary template"
            required
            value={form.globalTemplateId || ''}
            onChange={(e) => handleTemplateChange(Number(e.target.value))}
          >
            <option value="" disabled>
              {templates.length === 0 ? 'No templates found' : 'Select a template'}
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                #{template.id} — {formatMoney(template.basicSalary)} basic{template.active ? ' (active)' : ''}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <TextField
            label="Salary month"
            type="month"
            required
            value={dateToMonthInput(form.salaryMonth)}
            onChange={(e) => setField('salaryMonth', monthInputToDate(e.target.value))}
          />
          <TextField
            label="Basic salary"
            type="number"
            min={0.01}
            step={0.01}
            required
            hint={selectedTemplate ? `Template default ${formatMoney(selectedTemplate.basicSalary)}` : undefined}
            value={form.basicSalary || ''}
            onChange={(e) => setField('basicSalary', Number(e.target.value))}
          />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <TextField
            label="Working days"
            type="number"
            min={0}
            max={31}
            value={form.workingDays || ''}
            placeholder="0"
            onChange={(e) => setAttendanceDays('workingDays', Number(e.target.value))}
          />
          <TextField
            label="Paid days"
            type="number"
            min={0}
            max={31}
            value={form.paidDays || ''}
            placeholder="0"
            onChange={(e) => setAttendanceDays('paidDays', Number(e.target.value))}
          />
          <TextField
            label="Unpaid days"
            type="number"
            min={0}
            max={31}
            hint="Auto-filled from working − paid"
            value={form.unpaidDays || ''}
            placeholder="0"
            onChange={(e) => setField('unpaidDays', Number(e.target.value))}
          />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <SelectField
            label="Status"
            required
            value={form.status}
            onChange={(e) => setField('status', e.target.value as StaffSalaryStatus)}
          >
            {STAFF_SALARY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Payment date"
            type="date"
            value={form.paymentDate}
            onChange={(e) => setField('paymentDate', e.target.value)}
          />
          <TextField
            label="Payment reference"
            placeholder="e.g. NEFT-88213"
            value={form.paymentReference}
            onChange={(e) => setField('paymentReference', e.target.value)}
          />
        </div>

        <TextareaField
          label="Remarks"
          rows={2}
          placeholder="Optional note kept with this payslip"
          value={form.remarks}
          onChange={(e) => setField('remarks', e.target.value)}
        />

        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Estimated from template {selectedTemplate ? `#${selectedTemplate.id}` : '—'}
          </p>
          <PreviewRow label="Basic salary" value={formatMoney(form.basicSalary)} />
          <PreviewRow label="Total allowances" value={`+ ${formatMoney(preview.allowances)}`} tone="positive" />
          <PreviewRow label="Total deductions" value={`− ${formatMoney(preview.deductions)}`} tone="negative" />
          <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2.5">
            <div>
              <p className="text-xs text-slate-500">Gross {formatMoney(preview.gross)}</p>
              <p className="text-sm font-semibold text-slate-900">Net salary</p>
            </div>
            <p className="text-lg font-bold tracking-tight text-brand-700">{formatMoney(preview.net)}</p>
          </div>
          <p className="text-[11px] text-slate-400">Final figures are calculated by the server on save.</p>
        </div>

        {error && (
          <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}

function PreviewRow({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  const toneClass = tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-600' : 'text-slate-700';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
}
