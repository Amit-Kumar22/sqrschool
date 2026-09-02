'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, CircleDollarSign, Clock3, Download, FilePlus2, History, Loader2, Receipt as ReceiptIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { apiErrorMessage } from '@/lib/api';
import {
  generateStudentFee,
  getAllFeePayments,
  getFeeStructures,
  getStudentFee,
  getStudentFees,
  recordFeePayment,
  type FeePayment,
  type FeeStructure,
  type PaymentMode,
  type StudentFee,
} from '@/lib/feeService';
import { getStudentAdmissions, type StudentAdmission } from '@/lib/studentService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { FeeFrequencyBadge, FeeTypeBadge, StudentFeeStatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { SelectField, TextField } from '@/components/ui/FormField';

const PAYMENT_MODE_OPTIONS: PaymentMode[] = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'CHEQUE'];

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');
const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function CollectFeePageContent({ feeId }: { feeId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  // fee-structure lives under both /principal and /principal-2 — keep
  // Back/Cancel navigation on whichever role this page was opened from.
  const basePath = pathname?.startsWith('/principal-2') ? '/principal-2' : '/principal';
  const backHref = `${basePath}/fee-structure?tab=collect`;
  const goBack = () => router.push(backHref);

  const { theme } = useTheme();
  const companyName = theme.companyName || 'SQR School';

  const [fee, setFee] = useState<StudentFee | null>(null);
  const [allFees, setAllFees] = useState<StudentFee[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [student, setStudent] = useState<StudentAdmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeFeeId, setActiveFeeId] = useState<number>(feeId);
  const [amount, setAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<FeePayment | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!receiptRef.current || !receipt) return;
    setDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imageData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Receipt-${receipt.receiptNumber}.pdf`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not generate the receipt PDF.'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchAll = async () => {
    const target = await getStudentFee(feeId);
    const [feesPage, structuresPage, paymentsPage, studentsPage] = await Promise.all([
      getStudentFees({ studentId: target.studentId }),
      getFeeStructures({ classId: target.classId }),
      getAllFeePayments({ studentId: target.studentId }),
      getStudentAdmissions({ classId: target.classId }),
    ]);
    setFee(target);
    setAllFees(feesPage.content ?? []);
    setStructures(structuresPage.content ?? []);
    setPayments(paymentsPage.content ?? []);
    setStudent((studentsPage.content ?? []).find((s) => s.id === target.studentId) ?? null);
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchAll()
      .catch((err) => setError(apiErrorMessage(err, 'Could not load this fee.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeId]);

  const refresh = () => fetchAll().catch((err) => setError(apiErrorMessage(err, 'Could not refresh this fee.')));

  const structuresMap = useMemo(() => new Map(structures.map((s) => [s.id, s])), [structures]);
  const titleFor = (f?: StudentFee) => (f ? (structuresMap.get(f.feeStructureId)?.title ?? formatEnumLabel(f.feeType)) : 'Fee Payment');

  const activeFee = allFees.find((f) => f.id === activeFeeId);

  useEffect(() => {
    if (activeFee) {
      setAmount(activeFee.dueAmount || activeFee.amount);
      setRemark('');
      setFormError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFeeId, allFees]);

  const handleGenerate = async (structure: FeeStructure) => {
    if (!fee) return;
    setGeneratingId(structure.id);
    setError('');
    try {
      await generateStudentFee({ feeStructureId: structure.id, studentId: fee.studentId, feeDate: today() });
      await refresh();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not generate this invoice.'));
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeFee) return;
    if (!amount || amount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }
    if (amount > activeFee.dueAmount) {
      setFormError(`Amount cannot exceed the balance of ${formatCurrency(activeFee.dueAmount)}.`);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const result = await recordFeePayment(activeFee.id, { amount, paymentMode, transactionId: '', remark });
      setReceipt(result);
      await refresh();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Failed to record this payment.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (!fee) {
    return (
      <div className="space-y-4">
        <BackLink onClick={goBack} />
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error || 'Fee record not found.'}</div>
      </div>
    );
  }

  const studentName = student?.studentUser?.fullName || fee.studentName || '—';
  const className = student?.schoolClass?.className || fee.className || '—';
  const studentCode = student?.studentCode || '—';
  const rollNumber = student?.rollNumber || '—';
  const totalPaid = allFees.reduce((sum, f) => sum + f.paidAmount, 0);
  const balance = allFees.reduce((sum, f) => sum + f.dueAmount, 0);
  const pendingFees = allFees.filter((f) => f.status !== 'PAID');
  const initials = (studentName || '?')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const receiptFee = receipt ? allFees.find((f) => f.id === receipt.studentFeeId) : undefined;

  const dueColumns: DataTableColumn<StudentFee>[] = [
    { key: 'title', header: 'Title', accessor: (f) => titleFor(f), render: (f) => <span className="font-medium text-slate-800">{titleFor(f)}</span> },
    { key: 'amount', header: 'Total', align: 'right', accessor: (f) => f.amount, render: (f) => <span className="text-slate-700">{formatCurrency(f.amount)}</span> },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      accessor: (f) => f.paidAmount,
      render: (f) => <span className="text-emerald-700">{formatCurrency(f.paidAmount)}</span>,
    },
    {
      key: 'dueAmount',
      header: 'Balance',
      align: 'right',
      accessor: (f) => f.dueAmount,
      render: (f) => <span className="font-semibold text-slate-900">{formatCurrency(f.dueAmount)}</span>,
    },
    { key: 'dueDate', header: 'Due Date', accessor: (f) => f.dueDate, render: (f) => <span className="text-slate-600">{formatDate(f.dueDate)}</span> },
    { key: 'status', header: 'Status', render: (f) => <StudentFeeStatusBadge status={f.status} /> },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (f) => (
        <Button
          icon={CircleDollarSign}
          size="sm"
          onClick={() => {
            setActiveFeeId(f.id);
            document.getElementById('collect-fee-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          Collect
        </Button>
      ),
    },
  ];

  const invoiceColumns: DataTableColumn<FeeStructure>[] = [
    {
      key: 'title',
      header: 'Fee Head',
      accessor: (s) => s.title,
      render: (s) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-slate-800">{s.title}</span>
          <FeeTypeBadge feeType={s.feeType} />
        </div>
      ),
    },
    { key: 'amount', header: 'Gross', align: 'right', accessor: (s) => s.amount, render: (s) => <span className="text-slate-700">{formatCurrency(s.amount)}</span> },
    { key: 'concession', header: 'Concession', align: 'right', render: () => <span className="text-slate-400">–</span> },
    {
      key: 'net',
      header: 'Net Amount',
      align: 'right',
      accessor: (s) => s.amount,
      render: (s) => <span className="font-semibold text-slate-900">{formatCurrency(s.amount)}</span>,
    },
    { key: 'frequency', header: 'Frequency', render: (s) => <FeeFrequencyBadge frequency={s.frequency} /> },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (s) => (
        <Button icon={FilePlus2} size="sm" variant="secondary" loading={generatingId === s.id} onClick={() => handleGenerate(s)}>
          Invoice
        </Button>
      ),
    },
  ];

  const paymentColumns: DataTableColumn<FeePayment>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt No',
      accessor: (p) => p.receiptNumber,
      render: (p) => <span className="font-mono text-xs text-slate-600">{p.receiptNumber}</span>,
    },
    { key: 'title', header: 'Title', render: (p) => <span className="text-slate-700">{titleFor(allFees.find((f) => f.id === p.studentFeeId))}</span> },
    {
      key: 'totalAmount',
      header: 'Amount',
      align: 'right',
      accessor: (p) => p.totalAmount,
      render: (p) => <span className="font-semibold text-emerald-700">{formatCurrency(p.totalAmount)}</span>,
    },
    { key: 'paymentMode', header: 'Mode', accessor: (p) => p.paymentMode, render: (p) => <span className="text-slate-600">{formatEnumLabel(p.paymentMode)}</span> },
    { key: 'paidAt', header: 'Date', accessor: (p) => p.paidAt, render: (p) => <span className="text-slate-600">{formatDate(p.paidAt)}</span> },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (p) => (
        <button
          type="button"
          onClick={() => setReceipt(p)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 transition-colors hover:text-amber-800 hover:underline"
        >
          <ReceiptIcon size={12} /> Receipt
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SetPageTitle title="Collect Fee" />
      <BackLink onClick={goBack} />

      <div className="card-premium relative overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-700 to-orange-800 text-base font-semibold text-white shadow-glow-amber">
              {initials || '?'}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">{studentName}</h1>
              <p className="text-xs text-slate-500">
                {className} · ID: {studentCode} · Roll: {rollNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[11px] tracking-wide text-slate-400 uppercase">Total Paid</p>
              <p className="text-sm font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] tracking-wide text-slate-400 uppercase">Balance</p>
              <p className="text-sm font-bold text-red-600">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <SectionCard title="Pending / Partial Dues" icon={Clock3} accent="from-rose-500 via-red-400 to-rose-500" iconBg="bg-rose-50 text-rose-600">
        <DataTable
          columns={dueColumns}
          data={pendingFees}
          rowKey={(f) => f.id}
          emptyTitle="No pending dues"
          emptyDescription="This student has no pending or partial fees."
        />
      </SectionCard>

      <SectionCard
        title="Create New Invoice from Fee Structure"
        icon={FilePlus2}
        accent="from-sky-500 via-blue-400 to-sky-500"
        iconBg="bg-sky-50 text-sky-600"
      >
        <DataTable
          columns={invoiceColumns}
          data={structures}
          rowKey={(s) => s.id}
          emptyTitle="No fee structures"
          emptyDescription="This class has no fee structures set up yet."
        />
      </SectionCard>

      <SectionCard title="Payment History" icon={History} accent="from-emerald-500 via-teal-400 to-emerald-500" iconBg="bg-emerald-50 text-emerald-600">
        <DataTable
          columns={paymentColumns}
          data={payments}
          rowKey={(p) => p.id}
          emptyTitle="No payments"
          emptyDescription="No payments recorded for this student yet."
        />
      </SectionCard>

      {activeFee && (
        <SectionCard
          id="collect-fee-section"
          title={`Collect — ${titleFor(activeFee)}`}
          icon={CircleDollarSign}
          accent="from-amber-400 via-orange-400 to-amber-400"
          iconBg="bg-amber-50 text-amber-600"
        >
          {activeFee.status === 'PAID' ? (
            <p className="py-2 text-sm text-emerald-700">This fee is fully paid.</p>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-3.5 sm:grid-cols-2">
              <TextField
                label="Amount Paying (₹)"
                type="number"
                min={0.01}
                max={activeFee.dueAmount}
                step={0.01}
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <SelectField label="Payment Mode" required value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
                {PAYMENT_MODE_OPTIONS.map((mode) => (
                  <option key={mode} value={mode}>
                    {formatEnumLabel(mode)}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Remarks (optional)"
                hint="Cheque no., reference…"
                wrapperClassName="sm:col-span-2"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              {formError && (
                <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:col-span-2">
                  {formError}
                </div>
              )}

              <div className="flex items-center gap-2 sm:col-span-2">
                <Button type="submit" icon={CircleDollarSign} loading={saving}>
                  Confirm & Record
                </Button>
                <Button type="button" variant="secondary" onClick={goBack}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </SectionCard>
      )}

      {receipt && (
        <Modal
          icon={ReceiptIcon}
          title="Payment Receipt"
          accent="emerald"
          size="sm"
          onClose={() => setReceipt(null)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setReceipt(null)}>
                Close
              </Button>
              <Button type="button" icon={Download} loading={downloadingPdf} onClick={handleDownloadPdf}>
                Download PDF
              </Button>
            </>
          }
        >
          <div ref={receiptRef} className="space-y-4 bg-white">
            <div className="text-center">
              <p className="text-base font-bold text-slate-900">{companyName}</p>
              <p className="text-xs text-slate-500">Fee Payment Receipt</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <ReceiptRow label="Receipt No" value={receipt.receiptNumber} mono />
              <ReceiptRow label="Date" value={formatDate(receipt.paidAt)} />
              <ReceiptRow label="Student" value={studentName} />
              <ReceiptRow label="Student ID" value={studentCode} />
              <ReceiptRow label="Class" value={className} />
              <ReceiptRow label="Roll No" value={rollNumber} />
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="flex items-center justify-between bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-sm">
                <span className="text-slate-700">{titleFor(receiptFee)}</span>
                <span className="text-slate-700">{formatCurrency(receiptFee?.amount ?? receipt.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 bg-emerald-50 px-3 py-2 text-sm font-semibold">
                <span className="text-emerald-800">Amount Paid</span>
                <span className="text-emerald-800">{formatCurrency(receipt.totalAmount)}</span>
              </div>
              {!!receiptFee?.dueAmount && (
                <div className="flex items-center justify-between border-t border-slate-100 bg-red-50 px-3 py-2 text-sm font-semibold">
                  <span className="text-red-700">Balance Due</span>
                  <span className="text-red-700">{formatCurrency(receiptFee.dueAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Mode: <span className="font-medium text-slate-700">{formatEnumLabel(receipt.paymentMode)}</span>
              </span>
              <span>
                Ref: <span className="font-medium text-slate-700">{receipt.remark || receipt.transactionId || '—'}</span>
              </span>
            </div>

            <p className="text-center text-[11px] text-slate-400">Computer-generated receipt · No signature required</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-amber-700"
    >
      <ArrowLeft size={15} /> Back to Collect Fee
    </button>
  );
}

function SectionCard({
  id,
  title,
  icon: Icon,
  accent,
  iconBg,
  children,
}: {
  id?: string;
  title: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="card-premium animate-fade-in-up relative overflow-hidden p-4">
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon size={14} />
        </span>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="block text-xs text-slate-400">{label}</span>
      <span className={`block font-medium text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
