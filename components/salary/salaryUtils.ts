import { getStaffSalaryPdf, type StaffSalary, type StaffSalaryStatus } from '@/lib/salaryTemplateService';

/** ₹ with thousands separators and no decimals — payroll figures are whole rupees in every panel. */
export const formatMoney = (value: number | null | undefined): string =>
  `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** "yyyy-mm-dd" (or a full ISO datetime) -> "17 Sep 2026". */
export const formatDate = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** A payslip's salaryMonth -> "September 2026" — the month is what matters, not the day. */
export const formatSalaryMonth = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—';

/** "yyyy-mm" from a <input type="month"> -> the "yyyy-mm-dd" first-of-month the API stores. */
export const monthInputToDate = (value: string): string => (value ? `${value}-01` : '');

/** A payslip's salaryMonth -> "yyyy-mm" for a <input type="month"> value. */
export const dateToMonthInput = (value: string): string => (value ? value.slice(0, 7) : '');

/** Today as "yyyy-mm-dd", for defaulting date inputs without a timezone round-trip. */
export const todayInput = (): string => new Date().toISOString().slice(0, 10);

export const STATUS_LABELS: Record<StaffSalaryStatus, string> = {
  DRAFT: 'Draft',
  GENERATED: 'Generated',
  APPROVED: 'Approved',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

/**
 * Fetches a payslip's PDF and hands it to the browser as a download. The
 * object URL is revoked straight after the click so the blob isn't pinned in
 * memory for the rest of the session.
 */
export async function downloadSalaryPdf(salary: Pick<StaffSalary, 'id' | 'userName' | 'salaryMonth'>): Promise<void> {
  const blob = await getStaffSalaryPdf(salary.id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const name = (salary.userName || 'payslip').replace(/\s+/g, '-').toLowerCase();
  link.download = `payslip-${name}-${dateToMonthInput(salary.salaryMonth) || salary.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
