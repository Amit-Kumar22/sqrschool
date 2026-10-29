'use client';

import type { jsPDF } from 'jspdf';
import type { StudentAdmission } from './studentService';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 13;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_TOP = 14;
const CONTENT_BOTTOM = 279;

const COLORS = {
  forest: [14, 59, 54] as const,
  forestDeep: [9, 47, 44] as const,
  brand: [22, 140, 80] as const,
  pale: [234, 246, 239] as const,
  panel: [246, 248, 247] as const,
  gold: [176, 137, 64] as const,
  ink: [17, 24, 39] as const,
  muted: [100, 116, 139] as const,
  faint: [148, 163, 184] as const,
  border: [203, 213, 225] as const,
  white: [255, 255, 255] as const,
};

type Value = string | number | null | undefined;

const display = (value: Value): string => {
  if (value === null || value === undefined) return '—';
  const text = String(value).trim();
  return text === '' ? '—' : text;
};

const formatDate = (value: Value): string => {
  if (value === null || value === undefined || value === '') return '—';
  const text = String(value);
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const formatGender = (value: Value): string => {
  const text = display(value);
  if (text === '—') return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const formatAadhaar = (value: Value): string => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length !== 12) return display(value);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatIncome = (value: Value): string => {
  const text = display(value);
  if (text === '—') return text;
  if (!/^\d[\d,\s]*$/.test(text)) return text;
  const numeric = Number(text.replace(/[,\s]/g, ''));
  return Number.isFinite(numeric) ? `₹${numeric.toLocaleString('en-IN')}` : text;
};

const initialsOf = (name: string): string => {
  const parts = name
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const imageToJpeg = async (source: string | null | undefined): Promise<string | null> => {
  if (!source) return null;
  try {
    let dataUrl = source;
    if (!source.startsWith('data:')) {
      const response = await fetch(source);
      if (!response.ok) return null;
      const blob = await response.blob();
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.crossOrigin = 'anonymous';
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Image could not be loaded'));
      element.src = dataUrl;
    });

    const targetWidth = 420;
    const ratio = image.naturalHeight / Math.max(image.naturalWidth, 1);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = Math.round(targetWidth * ratio);
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    return null;
  }
};

class AdmissionFormDocument {
  private doc: jsPDF;
  private y = CONTENT_TOP;
  private studentName = '';
  private schoolName: string;
  private pageCount = 1;

  constructor(doc: jsPDF, schoolName: string) {
    this.doc = doc;
    this.schoolName = schoolName;
  }

  generate(student: StudentAdmission, photo: string | null) {
    this.studentName = display(student.studentUser?.fullName);
    this.drawLetterhead(student);
    this.drawTitleBand();
    this.drawMeta(student);
    this.drawStudentSection(student, photo);
    this.drawParentSection(student);
    this.drawAddressSection(student);
    this.drawDeclaration();
    this.drawOfficeUse();
    this.drawPageFramesAndFooters();
  }

  private setColor(color: readonly [number, number, number], target: 'fill' | 'draw' | 'text') {
    if (target === 'fill') this.doc.setFillColor(color[0], color[1], color[2]);
    else if (target === 'draw') this.doc.setDrawColor(color[0], color[1], color[2]);
    else this.doc.setTextColor(color[0], color[1], color[2]);
  }

  private ensureSpace(height: number) {
    if (this.y + height <= CONTENT_BOTTOM) return;
    this.doc.addPage();
    this.pageCount += 1;
    this.y = CONTENT_TOP;
    this.drawContinuationHeader();
  }

  private truncate(value: string, maxWidth: number): string {
    const doc = this.doc;
    if (doc.getTextWidth(value) <= maxWidth) return value;
    let text = value;
    while (text.length > 0 && doc.getTextWidth(`${text}…`) > maxWidth) text = text.slice(0, -1);
    return `${text.trim()}…`;
  }

  private drawLetterhead(student: StudentAdmission) {
    const doc = this.doc;
    const top = CONTENT_TOP;

    const crestX = MARGIN + 8.5;
    const crestY = top + 9;
    this.setColor(COLORS.forest, 'fill');
    doc.circle(crestX, crestY, 8.5, 'F');
    this.setColor(COLORS.gold, 'draw');
    doc.setLineWidth(0.5);
    doc.circle(crestX, crestY, 6.9, 'S');
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    this.setColor(COLORS.white, 'text');
    doc.text(initialsOf(this.schoolName), crestX, crestY + 3.2, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(17);
    this.setColor(COLORS.forestDeep, 'text');
    doc.text(this.truncate(this.schoolName, 104), MARGIN + 21, top + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.1);
    this.setColor(COLORS.gold, 'text');
    doc.text('AFFILIATED TO CBSE  ·  SENIOR SECONDARY SCHOOL', MARGIN + 21, top + 14.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    this.setColor(COLORS.muted, 'text');
    doc.text('An English medium, co-educational institution', MARGIN + 21, top + 18.7);

    const boxWidth = 43;
    const boxX = PAGE_WIDTH - MARGIN - boxWidth;
    const boxY = top + 3;
    this.setColor(COLORS.white, 'fill');
    doc.rect(boxX, boxY, boxWidth, 14.5, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.25);
    doc.rect(boxX, boxY, boxWidth, 14.5, 'S');
    this.setColor(COLORS.pale, 'fill');
    doc.rect(boxX, boxY, boxWidth, 5.2, 'F');
    this.setColor(COLORS.forest, 'text');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('ACADEMIC SESSION', boxX + boxWidth / 2, boxY + 3.6, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(this.truncate(display(student.academicYear), boxWidth - 4), boxX + boxWidth / 2, boxY + 11.5, {
      align: 'center',
    });

    this.setColor(COLORS.gold, 'draw');
    doc.setLineWidth(0.6);
    doc.line(MARGIN, top + 23.5, PAGE_WIDTH - MARGIN, top + 23.5);
    this.setColor(COLORS.forest, 'draw');
    doc.setLineWidth(0.15);
    doc.line(MARGIN, top + 24.6, PAGE_WIDTH - MARGIN, top + 24.6);

    this.y = top + 28;
  }

  private drawTitleBand() {
    const doc = this.doc;
    const top = this.y;
    this.setColor(COLORS.forest, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, 10, 'F');
    this.setColor(COLORS.gold, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, 0.7, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    this.setColor(COLORS.white, 'text');
    doc.text('APPLICATION FOR ADMISSION', PAGE_WIDTH / 2, top + 6.6, { align: 'center' });

    this.y = top + 13;
  }

  private drawMeta(student: StudentAdmission) {
    const doc = this.doc;
    const top = this.y;
    const height = 10;
    const width = CONTENT_WIDTH / 4;

    this.setColor(COLORS.panel, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'S');

    const cells: { label: string; value: string; accent?: boolean }[] = [
      { label: 'ADMISSION NO.', value: display(student.admissionNumber) },
      { label: 'DATE OF ADMISSION', value: formatDate(student.admissionDate) },
      { label: 'CLASS APPLIED FOR', value: display(student.schoolClass?.className) },
      { label: 'STATUS', value: student.active ? 'Active' : 'Inactive', accent: student.active },
    ];

    cells.forEach((cell, index) => {
      const x = MARGIN + width * index;
      if (index > 0) {
        this.setColor(COLORS.border, 'draw');
        doc.line(x, top, x, top + height);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      this.setColor(COLORS.muted, 'text');
      doc.text(cell.label, x + 3, top + 4);
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      this.setColor(cell.accent ? COLORS.brand : COLORS.ink, 'text');
      doc.text(this.truncate(cell.value, width - 6), x + 3, top + 8.3);
    });

    this.y = top + height + 3.5;
  }

  private drawSectionBar(title: string, index: number) {
    this.ensureSpace(8);
    const doc = this.doc;
    const top = this.y;

    this.setColor(COLORS.pale, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, 7.5, 'F');
    this.setColor(COLORS.brand, 'fill');
    doc.rect(MARGIN, top, 1.8, 7.5, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.2);
    doc.line(MARGIN, top + 7.5, PAGE_WIDTH - MARGIN, top + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    this.setColor(COLORS.forest, 'text');
    doc.text(title.toUpperCase(), MARGIN + 4.5, top + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.4);
    this.setColor(COLORS.brand, 'text');
    doc.text(`SECTION ${String(index).padStart(2, '0')}`, PAGE_WIDTH - MARGIN - 3, top + 5, { align: 'right' });

    this.y = top + 9;
  }

  private drawInfoCell(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: Value,
    options?: { bold?: boolean; size?: number },
  ) {
    const doc = this.doc;
    this.setColor(COLORS.white, 'fill');
    doc.rect(x, y, width, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.22);
    doc.rect(x, y, width, height, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    this.setColor(COLORS.muted, 'text');
    doc.text(label.toUpperCase(), x + 2.2, y + 3.7);

    doc.setFont(options?.bold ? 'times' : 'helvetica', options?.bold ? 'bold' : 'normal');
    doc.setFontSize(options?.size ?? 8.4);
    this.setColor(COLORS.ink, 'text');
    doc.text(this.truncate(display(value), width - 4.4), x + 2.2, y + height - 3.2);
  }

  private drawPlainCell(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    options?: {
      fill?: readonly [number, number, number];
      bold?: boolean;
      size?: number;
      color?: readonly [number, number, number];
      align?: 'left' | 'center' | 'right';
      padding?: number;
      font?: 'helvetica' | 'times';
    },
  ) {
    const doc = this.doc;
    this.setColor(options?.fill ?? COLORS.white, 'fill');
    doc.rect(x, y, width, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.22);
    doc.rect(x, y, width, height, 'S');

    const padding = options?.padding ?? 2.2;
    doc.setFont(options?.font ?? 'helvetica', options?.bold ? 'bold' : 'normal');
    doc.setFontSize(options?.size ?? 8.2);
    this.setColor(options?.color ?? COLORS.ink, 'text');
    const align = options?.align ?? 'left';
    const textX =
      align === 'left' ? x + padding : align === 'right' ? x + width - padding : x + width / 2;
    doc.text(this.truncate(text, width - padding * 2), textX, y + height / 2 + 1.1, { align });
  }

  private drawStudentSection(student: StudentAdmission, photo: string | null) {
    this.drawSectionBar("Student's Particulars", 1);

    const photoWidth = 29;
    const gap = 4;
    const tableWidth = CONTENT_WIDTH - photoWidth - gap;
    const startY = this.y;
    const third = tableWidth / 3;

    this.drawInfoCell(MARGIN, startY, tableWidth, 13, 'Name of the Applicant', student.studentUser?.fullName, {
      bold: true,
      size: 9.6,
    });

    this.drawInfoCell(MARGIN, startY + 13, third, 11.5, 'Date of Birth', formatDate(student.dob));
    this.drawInfoCell(MARGIN + third, startY + 13, third, 11.5, 'Gender', formatGender(student.gender));
    this.drawInfoCell(MARGIN + third * 2, startY + 13, third, 11.5, 'Blood Group', student.bloodGroup);

    this.drawInfoCell(MARGIN, startY + 24.5, third, 11.5, 'Nationality', student.nationality);
    this.drawInfoCell(MARGIN + third, startY + 24.5, third, 11.5, 'Caste / Category', student.caste);
    this.drawInfoCell(MARGIN + third * 2, startY + 24.5, third, 11.5, 'Aadhaar No.', formatAadhaar(student.adharNumber));

    this.drawPhoto(MARGIN + tableWidth + gap, startY, photoWidth, 36, photo);

    this.y = startY + 36 + 3;
  }

  private drawPhoto(x: number, y: number, width: number, height: number, photo: string | null) {
    const doc = this.doc;
    this.setColor(COLORS.white, 'fill');
    doc.rect(x, y, width, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.3);
    doc.rect(x, y, width, height, 'S');

    if (photo) {
      doc.addImage(photo, 'JPEG', x + 0.8, y + 0.8, width - 1.6, height - 1.6);
      return;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.6);
    this.setColor(COLORS.faint, 'text');
    doc.text('AFFIX RECENT', x + width / 2, y + height / 2 - 3.5, { align: 'center' });
    doc.text('PASSPORT SIZE', x + width / 2, y + height / 2, { align: 'center' });
    doc.text('PHOTOGRAPH', x + width / 2, y + height / 2 + 3.5, { align: 'center' });
  }

  private drawParentSection(student: StudentAdmission) {
    this.ensureSpace(9 + 50 + 3);
    this.drawSectionBar('Parent / Guardian Details', 2);

    const labelWidth = 36;
    const half = (CONTENT_WIDTH - labelWidth) / 2;
    const startY = this.y;
    const headerHeight = 7.5;
    const rowHeight = 8.5;

    this.drawPlainCell(MARGIN, startY, labelWidth, headerHeight, 'PARTICULARS', {
      fill: COLORS.pale,
      bold: true,
      size: 6,
      color: COLORS.forest,
    });
    this.drawPlainCell(MARGIN + labelWidth, startY, half, headerHeight, 'FATHER / GUARDIAN', {
      fill: COLORS.pale,
      bold: true,
      size: 6,
      color: COLORS.forest,
      align: 'center',
    });
    this.drawPlainCell(MARGIN + labelWidth + half, startY, half, headerHeight, 'MOTHER', {
      fill: COLORS.pale,
      bold: true,
      size: 6,
      color: COLORS.forest,
      align: 'center',
    });

    const parentPhone = student.parentUser?.phone || student.studentUser?.phone;
    const parentEmail = student.parentUser?.email;
    const rows: [string, Value, Value][] = [
      ['Name', student.fatherName, student.motherName],
      ['Occupation', student.fatherOccupation, student.motherOccupation],
      ['Mobile No.', parentPhone, student.motherPhone],
      ['Email ID', parentEmail, student.motherEmail],
    ];

    rows.forEach(([label, father, mother], index) => {
      const rowY = startY + headerHeight + rowHeight * index;
      this.drawPlainCell(MARGIN, rowY, labelWidth, rowHeight, label.toUpperCase(), {
        fill: COLORS.panel,
        bold: true,
        size: 5.6,
        color: COLORS.muted,
      });
      this.drawPlainCell(MARGIN + labelWidth, rowY, half, rowHeight, display(father));
      this.drawPlainCell(MARGIN + labelWidth + half, rowY, half, rowHeight, display(mother));
    });

    const incomeY = startY + headerHeight + rowHeight * rows.length;
    this.drawPlainCell(MARGIN, incomeY, labelWidth, rowHeight, 'ANNUAL INCOME', {
      fill: COLORS.panel,
      bold: true,
      size: 5.6,
      color: COLORS.muted,
    });
    this.drawPlainCell(MARGIN + labelWidth, incomeY, CONTENT_WIDTH - labelWidth, rowHeight, formatIncome(student.parentAnnualIncome));

    this.y = incomeY + rowHeight + 3;
  }

  private drawAddressSection(student: StudentAdmission) {
    this.ensureSpace(9 + 22.5 + 3);
    this.drawSectionBar('Residential Address', 3);

    const doc = this.doc;
    const labelWidth = 36;
    const startY = this.y;
    const addressHeight = 14;
    const pinHeight = 8.5;

    this.drawPlainCell(MARGIN, startY, labelWidth, addressHeight, 'RESIDENTIAL ADDRESS', {
      fill: COLORS.panel,
      bold: true,
      size: 5.6,
      color: COLORS.muted,
    });

    this.setColor(COLORS.white, 'fill');
    doc.rect(MARGIN + labelWidth, startY, CONTENT_WIDTH - labelWidth, addressHeight, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.22);
    doc.rect(MARGIN + labelWidth, startY, CONTENT_WIDTH - labelWidth, addressHeight, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.4);
    this.setColor(COLORS.ink, 'text');
    const addressLines = (doc.splitTextToSize(display(student.address), CONTENT_WIDTH - labelWidth - 4.4) as string[]).slice(0, 2);
    doc.text(addressLines, MARGIN + labelWidth + 2.2, startY + 5.6);

    this.drawPlainCell(MARGIN, startY + addressHeight, labelWidth, pinHeight, 'PIN CODE', {
      fill: COLORS.panel,
      bold: true,
      size: 5.6,
      color: COLORS.muted,
    });
    this.drawPlainCell(
      MARGIN + labelWidth,
      startY + addressHeight,
      CONTENT_WIDTH - labelWidth,
      pinHeight,
      display(student.pincode),
    );

    this.y = startY + addressHeight + pinHeight + 3;
  }

  private drawDeclaration() {
    this.ensureSpace(32);
    this.drawSectionBar('Declaration', 4);

    const doc = this.doc;
    const top = this.y;
    const declaration =
      'I/We hereby declare that the particulars furnished above are true and correct to the best of my/our knowledge and belief. I/We agree to abide by the rules, regulations and code of conduct of the school, and undertake to pay all fees and dues as prescribed from time to time.';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.7);
    const lines = doc.splitTextToSize(declaration, CONTENT_WIDTH) as string[];
    this.setColor(COLORS.muted, 'text');
    doc.text(lines, MARGIN, top + 3.4);

    const lineY = top + 17;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    this.setColor(COLORS.muted, 'text');
    doc.text('Place:', MARGIN, lineY);
    this.setColor(COLORS.faint, 'draw');
    doc.setLineWidth(0.25);
    doc.line(MARGIN + 8, lineY, MARGIN + 45, lineY);
    doc.text('Date:', MARGIN + 52, lineY);
    doc.line(MARGIN + 60, lineY, MARGIN + 92, lineY);

    doc.line(MARGIN + CONTENT_WIDTH - 58, lineY, MARGIN + CONTENT_WIDTH, lineY);
    doc.setFontSize(6.2);
    this.setColor(COLORS.muted, 'text');
    doc.text('Signature of Parent / Guardian', MARGIN + CONTENT_WIDTH, lineY + 4, { align: 'right' });

    this.y = lineY + 6;
  }

  private drawCheckbox(x: number, y: number, label: string) {
    const doc = this.doc;
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.25);
    doc.rect(x, y, 2.5, 2.5, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    this.setColor(COLORS.ink, 'text');
    doc.text(label, x + 4.2, y + 2);
  }

  private drawOfficeUse() {
    this.ensureSpace(27);
    this.drawSectionBar('For Office Use Only', 5);

    const doc = this.doc;
    const top = this.y;
    const height = 18;
    const dividerX = MARGIN + 112;

    this.setColor(COLORS.white, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'S');
    doc.line(dividerX, top, dividerX, top + height);

    const checks = ['Documents verified', 'Admission fee received', 'Class & section allotted', 'Student record created'];
    checks.forEach((label, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      this.drawCheckbox(MARGIN + 4 + column * 52, top + 4 + row * 6, label);
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    this.setColor(COLORS.muted, 'text');
    doc.text('Admission No. issued:', dividerX + 4, top + 6);
    this.setColor(COLORS.faint, 'draw');
    doc.line(dividerX + 32, top + 6, PAGE_WIDTH - MARGIN - 4, top + 6);
    this.setColor(COLORS.muted, 'text');
    doc.text('Date:', dividerX + 4, top + 11);
    this.setColor(COLORS.faint, 'draw');
    doc.line(dividerX + 15, top + 11, dividerX + 42, top + 11);

    doc.line(dividerX + 24, top + 15.5, PAGE_WIDTH - MARGIN - 8, top + 15.5);
    doc.setFontSize(6);
    this.setColor(COLORS.muted, 'text');
    doc.text('Principal', (dividerX + 24 + PAGE_WIDTH - MARGIN - 8) / 2, top + 17.8, { align: 'center' });

    this.y = top + height + 3;
  }

  private drawContinuationHeader() {
    const doc = this.doc;
    this.setColor(COLORS.gold, 'draw');
    doc.setLineWidth(0.4);
    doc.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    this.setColor(COLORS.forest, 'text');
    doc.text(this.truncate(this.schoolName, 100), MARGIN, this.y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    this.setColor(COLORS.muted, 'text');
    doc.text('APPLICATION FOR ADMISSION', PAGE_WIDTH - MARGIN, this.y + 6, { align: 'right' });
    this.y += 12;
  }

  private drawPageFramesAndFooters() {
    const doc = this.doc;
    const total = this.pageCount;

    for (let page = 1; page <= total; page += 1) {
      doc.setPage(page);

      this.setColor(COLORS.forest, 'draw');
      doc.setLineWidth(0.5);
      doc.rect(6.5, 6.5, PAGE_WIDTH - 13, PAGE_HEIGHT - 13, 'S');

      this.setColor(COLORS.border, 'draw');
      doc.setLineWidth(0.2);
      doc.line(MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      this.setColor(COLORS.faint, 'text');
      doc.text(
        `${this.truncate(this.schoolName, 80)}  ·  Application for Admission`,
        MARGIN,
        PAGE_HEIGHT - 8,
      );
      doc.text(
        `Generated on ${formatDate(new Date().toISOString())}  ·  Page ${page} of ${total}`,
        PAGE_WIDTH - MARGIN,
        PAGE_HEIGHT - 8,
        { align: 'right' },
      );
    }
  }
}

export async function downloadAdmissionFormPdf(student: StudentAdmission, schoolName?: string) {
  const { jsPDF: JsPdf } = await import('jspdf');
  const photo = await imageToJpeg(student.studentImage);

  const doc = new JsPdf({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: `Application for Admission - ${display(student.studentUser?.fullName)}`,
    subject: 'Student Admission Form',
    creator: schoolName || 'SQR School',
  });

  new AdmissionFormDocument(doc, schoolName || 'SQR School').generate(student, photo);

  const safeName = display(student.studentUser?.fullName)
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  doc.save(`Admission-Form-${display(student.admissionNumber)}${safeName ? `-${safeName}` : ''}.pdf`);
}
