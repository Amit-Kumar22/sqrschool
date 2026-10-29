'use client';

import type { jsPDF } from 'jspdf';
import type { StudentFee } from './feeService';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_TOP = 14;

const COLORS = {
  emerald: [14, 75, 55] as const,
  emeraldDeep: [9, 52, 38] as const,
  brand: [22, 140, 80] as const,
  gold: [180, 140, 50] as const,
  paleGreen: [236, 252, 243] as const,
  paleRed: [254, 242, 242] as const,
  panel: [248, 249, 251] as const,
  ink: [17, 24, 39] as const,
  muted: [100, 116, 139] as const,
  faint: [148, 163, 184] as const,
  border: [203, 213, 225] as const,
  white: [255, 255, 255] as const,
};

const formatCurrency = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;

const initialsOf = (name: string): string => {
  const parts = name.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' and ' + inWords(n % 100));
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 === 0 ? '' : ' ' + inWords(n % 1000));
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 === 0 ? '' : ' ' + inWords(n % 100000));
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 === 0 ? '' : ' ' + inWords(n % 10000000));
  }

  return `${inWords(Math.floor(num))} Rupees Only`;
}

export interface FeeReceiptPdfParams {
  fee: StudentFee;
  schoolName?: string;
}

class FeeReceiptDocument {
  private doc: jsPDF;
  private y = CONTENT_TOP;
  private schoolName: string;

  constructor(doc: jsPDF, schoolName: string) {
    this.doc = doc;
    this.schoolName = schoolName;
  }

  private setColor(color: readonly [number, number, number], target: 'fill' | 'draw' | 'text') {
    if (target === 'fill') this.doc.setFillColor(color[0], color[1], color[2]);
    else if (target === 'draw') this.doc.setDrawColor(color[0], color[1], color[2]);
    else this.doc.setTextColor(color[0], color[1], color[2]);
  }

  private truncate(value: string, maxWidth: number): string {
    if (this.doc.getTextWidth(value) <= maxWidth) return value;
    let text = value;
    while (text.length > 0 && this.doc.getTextWidth(`${text}…`) > maxWidth) text = text.slice(0, -1);
    return `${text.trim()}…`;
  }

  generate(fee: StudentFee) {
    this.drawLetterhead();
    this.drawTitleBand(fee);
    this.drawStudentMetadata(fee);
    this.drawFeeTable(fee);
    this.drawPaymentSummary(fee);
    this.drawNotes();
    this.drawSignaturesAndStamp();
    this.drawPageFrames();
  }

  private drawLetterhead() {
    const doc = this.doc;
    const top = CONTENT_TOP;

    // School Crest Badge
    const crestX = MARGIN + 10;
    const crestY = top + 10;
    this.setColor(COLORS.emerald, 'fill');
    doc.circle(crestX, crestY, 9.5, 'F');
    this.setColor(COLORS.gold, 'draw');
    doc.setLineWidth(0.6);
    doc.circle(crestX, crestY, 8, 'S');
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    this.setColor(COLORS.white, 'text');
    doc.text(initialsOf(this.schoolName), crestX, crestY + 3.5, { align: 'center' });

    // School Name & Affiliation
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    this.setColor(COLORS.emeraldDeep, 'text');
    doc.text(this.truncate(this.schoolName, 110), MARGIN + 24, top + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    this.setColor(COLORS.gold, 'text');
    doc.text('AFFILIATED TO CBSE · CO-EDUCATIONAL SENIOR SECONDARY INSTITUTION', MARGIN + 24, top + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    this.setColor(COLORS.muted, 'text');
    doc.text('Accounts & Fee Deposition Department · Official Payment Voucher', MARGIN + 24, top + 19.5);

    // Decorative Gold & Emerald Rules
    this.setColor(COLORS.gold, 'draw');
    doc.setLineWidth(0.6);
    doc.line(MARGIN, top + 24, PAGE_WIDTH - MARGIN, top + 24);
    this.setColor(COLORS.emerald, 'draw');
    doc.setLineWidth(0.2);
    doc.line(MARGIN, top + 25.2, PAGE_WIDTH - MARGIN, top + 25.2);

    this.y = top + 29;
  }

  private drawTitleBand(fee: StudentFee) {
    const doc = this.doc;
    const top = this.y;

    this.setColor(COLORS.emerald, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, 11, 'F');
    this.setColor(COLORS.gold, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, 0.9, 'F');
    doc.rect(MARGIN, top + 10.1, CONTENT_WIDTH, 0.9, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    this.setColor(COLORS.white, 'text');
    doc.text('STUDENT FEE RECEIPT / PAYMENT ACKNOWLEDGMENT', PAGE_WIDTH / 2, top + 7, { align: 'center' });

    this.y = top + 14.5;
  }

  private drawStudentMetadata(fee: StudentFee) {
    const doc = this.doc;
    const top = this.y;
    const height = 24;

    this.setColor(COLORS.panel, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'S');

    const colWidth = CONTENT_WIDTH / 3;
    const receiptNo = `REC-${fee.id.toString().padStart(6, '0')}`;
    const issueDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const dueDate = fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const infoGrid = [
      { label: 'RECEIPT NUMBER', value: receiptNo, col: 0, row: 0, bold: true },
      { label: 'ISSUE DATE', value: issueDate, col: 1, row: 0 },
      { label: 'PAYMENT STATUS', value: fee.status, col: 2, row: 0, status: fee.status },
      { label: 'STUDENT NAME', value: fee.studentName || '—', col: 0, row: 1, bold: true },
      { label: 'CLASS / GRADE', value: fee.className || '—', col: 1, row: 1 },
      { label: 'DUE DATE', value: dueDate, col: 2, row: 1 },
    ];

    infoGrid.forEach((item) => {
      const x = MARGIN + item.col * colWidth + 4;
      const yLabel = top + item.row * 11 + 4.5;
      const yValue = top + item.row * 11 + 9;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      this.setColor(COLORS.muted, 'text');
      doc.text(item.label, x, yLabel);

      doc.setFont('times', item.bold ? 'bold' : 'normal');
      doc.setFontSize(8.8);
      if (item.status) {
        if (item.status === 'PAID') this.setColor(COLORS.brand, 'text');
        else if (item.status === 'OVERDUE') this.setColor(COLORS.paleRed, 'text');
        else this.setColor(COLORS.gold, 'text');
      } else {
        this.setColor(COLORS.ink, 'text');
      }
      doc.text(this.truncate(item.value, colWidth - 8), x, yValue);
    });

    // Grid lines
    this.setColor(COLORS.border, 'draw');
    doc.line(MARGIN, top + 11.5, PAGE_WIDTH - MARGIN, top + 11.5);
    doc.line(MARGIN + colWidth, top, MARGIN + colWidth, top + height);
    doc.line(MARGIN + colWidth * 2, top, MARGIN + colWidth * 2, top + height);

    this.y = top + height + 6;
  }

  private drawFeeTable(fee: StudentFee) {
    const doc = this.doc;
    const top = this.y;

    const cols = [
      { header: '#', width: 12, align: 'center' as const },
      { header: 'FEE DESCRIPTION / CATEGORY', width: 70, align: 'left' as const },
      { header: 'TOTAL DUE', width: 34, align: 'right' as const },
      { header: 'PAID AMOUNT', width: 34, align: 'right' as const },
      { header: 'BALANCE DUE', width: 32, align: 'right' as const },
    ];

    // Header
    const headerHeight = 8;
    this.setColor(COLORS.emerald, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, headerHeight, 'F');

    let currentX = MARGIN;
    cols.forEach((col) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      this.setColor(COLORS.white, 'text');
      const textX = col.align === 'center' ? currentX + col.width / 2 : col.align === 'right' ? currentX + col.width - 3 : currentX + 3;
      doc.text(col.header, textX, top + 5.5, { align: col.align });
      currentX += col.width;
    });

    // Item Row
    const rowHeight = 11;
    const rowY = top + headerHeight;
    this.setColor(COLORS.white, 'fill');
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowHeight, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowHeight, 'S');

    const feeTitle = fee.feeType
      ? fee.feeType.toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Academic Fee';

    currentX = MARGIN;
    cols.forEach((col, idx) => {
      if (idx > 0) {
        this.setColor(COLORS.border, 'draw');
        doc.line(currentX, rowY, currentX, rowY + rowHeight);
      }
      doc.setFont('helvetica', idx === 1 ? 'bold' : 'normal');
      doc.setFontSize(7.8);
      this.setColor(COLORS.ink, 'text');

      let val = '';
      if (idx === 0) val = '1';
      else if (idx === 1) val = feeTitle;
      else if (idx === 2) val = formatCurrency(fee.amount);
      else if (idx === 3) val = formatCurrency(fee.paidAmount);
      else if (idx === 4) val = formatCurrency(fee.dueAmount);

      const textX = col.align === 'center' ? currentX + col.width / 2 : col.align === 'right' ? currentX + col.width - 3 : currentX + 3;
      doc.text(val, textX, rowY + 7, { align: col.align });
      currentX += col.width;
    });

    // Summary Total Row
    const sumY = rowY + rowHeight;
    const sumHeight = 10;
    this.setColor(COLORS.panel, 'fill');
    doc.rect(MARGIN, sumY, CONTENT_WIDTH, sumHeight, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.rect(MARGIN, sumY, CONTENT_WIDTH, sumHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    this.setColor(COLORS.emeraldDeep, 'text');
    doc.text('NET TOTAL', MARGIN + 16, sumY + 6.8);
    doc.text(formatCurrency(fee.amount), MARGIN + 82 + 34 - 3, sumY + 6.8, { align: 'right' });
    doc.text(formatCurrency(fee.paidAmount), MARGIN + 116 + 34 - 3, sumY + 6.8, { align: 'right' });

    this.setColor(fee.dueAmount > 0 ? [185, 28, 28] : COLORS.brand, 'text');
    doc.text(formatCurrency(fee.dueAmount), MARGIN + 150 + 32 - 3, sumY + 6.8, { align: 'right' });

    this.y = sumY + sumHeight + 6;
  }

  private drawPaymentSummary(fee: StudentFee) {
    const doc = this.doc;
    const top = this.y;
    const height = 22;

    this.setColor(COLORS.paleGreen, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'F');
    this.setColor(COLORS.brand, 'draw');
    doc.setLineWidth(0.4);
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'S');

    // Left Accent bar
    this.setColor(COLORS.brand, 'fill');
    doc.rect(MARGIN, top, 2.5, height, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    this.setColor(COLORS.emerald, 'text');
    doc.text('AMOUNT PAID IN WORDS:', MARGIN + 6, top + 6.5);

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    this.setColor(COLORS.ink, 'text');
    doc.text(this.truncate(numberToWords(fee.paidAmount), CONTENT_WIDTH - 12), MARGIN + 6, top + 13.5);

    // Right balance notice
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (fee.dueAmount > 0) {
      this.setColor([185, 28, 28], 'text');
      doc.text(`Outstanding Balance: ${formatCurrency(fee.dueAmount)}`, PAGE_WIDTH - MARGIN - 6, top + 13.5, { align: 'right' });
    } else {
      this.setColor(COLORS.brand, 'text');
      doc.text('Fully Settled · NIL Balance', PAGE_WIDTH - MARGIN - 6, top + 13.5, { align: 'right' });
    }

    this.y = top + height + 6;
  }

  private drawNotes() {
    const doc = this.doc;
    const top = this.y;
    const height = 24;

    this.setColor(COLORS.panel, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    this.setColor(COLORS.emerald, 'text');
    doc.text('IMPORTANT TERMS & RECEIPT CONDITIONS:', MARGIN + 4, top + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    this.setColor(COLORS.muted, 'text');
    const terms = [
      '1. This receipt is computer-generated and serves as official proof of fee deposition for SQR School.',
      '2. All fees once remitted are non-refundable and non-transferable under any circumstances.',
      '3. In case of payment via Cheque / Bank Transfer, the receipt is valid subject to actual realization in bank.',
      '4. Please retain this receipt securely for tax filing and academic verification purposes.',
    ];

    terms.forEach((line, idx) => {
      doc.text(line, MARGIN + 4, top + 10.5 + idx * 3.4);
    });

    this.y = top + height + 8;
  }

  private drawSignaturesAndStamp() {
    const doc = this.doc;
    const top = this.y;

    // Official Stamp Circle
    const stampX = MARGIN + 32;
    const stampY = top + 14;
    this.setColor(COLORS.emerald, 'draw');
    doc.setLineWidth(0.4);
    doc.circle(stampX, stampY, 11, 'S');
    doc.circle(stampX, stampY, 9.8, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    this.setColor(COLORS.emerald, 'text');
    doc.text('FEE OFFICE SEAL', stampX, stampY - 3, { align: 'center' });
    doc.text(initialsOf(this.schoolName), stampX, stampY + 1.5, { align: 'center' });
    doc.text('PAID & VERIFIED', stampX, stampY + 5.5, { align: 'center' });

    // Signature: Accounts Officer
    const sig1X = PAGE_WIDTH / 2 + 10;
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.3);
    doc.line(sig1X - 22, top + 22, sig1X + 22, top + 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    this.setColor(COLORS.ink, 'text');
    doc.text('Accountant / Cashier Signature', sig1X, top + 26, { align: 'center' });

    // Signature: Authorized Administrative In-Charge
    const sig2X = PAGE_WIDTH - MARGIN - 28;
    doc.line(sig2X - 22, top + 22, sig2X + 22, top + 22);
    doc.text('Authorized Signatory', sig2X, top + 26, { align: 'center' });

    this.y = top + 34;
  }

  private drawPageFrames() {
    const doc = this.doc;

    // Outer double border
    this.setColor(COLORS.emerald, 'draw');
    doc.setLineWidth(0.6);
    doc.rect(6.5, 6.5, PAGE_WIDTH - 13, PAGE_HEIGHT - 13, 'S');

    this.setColor(COLORS.gold, 'draw');
    doc.setLineWidth(0.2);
    doc.rect(7.5, 7.5, PAGE_WIDTH - 15, PAGE_HEIGHT - 15, 'S');

    // Bottom Footer Line
    this.setColor(COLORS.border, 'draw');
    doc.line(MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    this.setColor(COLORS.muted, 'text');
    doc.text(
      `${this.truncate(this.schoolName, 75)}  ·  Official Computer-Generated Student Fee Receipt`,
      MARGIN,
      PAGE_HEIGHT - 8,
    );
    doc.text(
      `Issue Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}  ·  Authenticity Verified`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 8,
      { align: 'right' },
    );
  }
}

export async function downloadFeeReceiptPdf(params: FeeReceiptPdfParams) {
  const { jsPDF: JsPdf } = await import('jspdf');
  const doc = new JsPdf({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  const studentName = params.fee.studentName || 'Student';
  doc.setProperties({
    title: `Fee Receipt - ${studentName}`,
    subject: 'Student Fee Deposition Receipt',
    creator: params.schoolName || 'SQR School',
  });

  new FeeReceiptDocument(doc, params.schoolName || 'SQR School').generate(params.fee);

  const safeName = studentName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  const receiptNo = `REC-${params.fee.id}`;
  doc.save(`Fee-Receipt-${receiptNo}-${safeName}.pdf`);
}

