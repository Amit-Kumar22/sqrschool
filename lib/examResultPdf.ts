'use client';

import type { jsPDF } from 'jspdf';
import type { StudentAdmission } from './studentService';
import type { Exam, ExamResult, ExamSubjectSchedule } from './examService';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_TOP = 14;
const CONTENT_BOTTOM = 282;

const COLORS = {
  navy: [15, 34, 64] as const,
  navyDeep: [10, 24, 48] as const,
  brand: [22, 140, 80] as const,
  gold: [180, 140, 50] as const,
  paleGold: [253, 248, 235] as const,
  paleGreen: [236, 252, 243] as const,
  paleRed: [254, 242, 242] as const,
  panel: [248, 249, 251] as const,
  ink: [17, 24, 39] as const,
  muted: [100, 116, 139] as const,
  faint: [148, 163, 184] as const,
  border: [203, 213, 225] as const,
  white: [255, 255, 255] as const,
  passText: [21, 128, 61] as const,
  failText: [185, 28, 28] as const,
};

const display = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  const text = String(value).trim();
  return text === '' ? '—' : text;
};

const initialsOf = (name: string): string => {
  const parts = name.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export interface ExamResultPdfParams {
  result: ExamResult;
  student?: StudentAdmission | null;
  exam?: Exam | null;
  subject?: ExamSubjectSchedule | null;
  schoolName?: string;
}

class ExamResultCardDocument {
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

  generate(params: ExamResultPdfParams) {
    const { result, student, exam, subject } = params;
    this.drawLetterhead();
    this.drawTitleBand(exam?.title || result.examTitle || 'EXAMINATION');
    this.drawStudentInfo(result, student, exam);
    this.drawMarksTable(result, subject);
    this.drawOverallResultCard(result);
    this.drawGradingScale();
    this.drawRemarksSection(result);
    this.drawSignaturesAndStamp();
    this.drawPageFrames();
  }

  private drawLetterhead() {
    const doc = this.doc;
    const top = CONTENT_TOP;

    // School Crest Badge
    const crestX = MARGIN + 10;
    const crestY = top + 10;
    this.setColor(COLORS.navy, 'fill');
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
    this.setColor(COLORS.navyDeep, 'text');
    doc.text(this.truncate(this.schoolName, 110), MARGIN + 24, top + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    this.setColor(COLORS.gold, 'text');
    doc.text('AFFILIATED TO CBSE · CO-EDUCATIONAL SENIOR SECONDARY INSTITUTION', MARGIN + 24, top + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    this.setColor(COLORS.muted, 'text');
    doc.text('Recognized by Department of School Education · Excellence in Academics & Values', MARGIN + 24, top + 19.5);

    // Decorative Gold & Navy Rules
    this.setColor(COLORS.gold, 'draw');
    doc.setLineWidth(0.6);
    doc.line(MARGIN, top + 24, PAGE_WIDTH - MARGIN, top + 24);
    this.setColor(COLORS.navy, 'draw');
    doc.setLineWidth(0.2);
    doc.line(MARGIN, top + 25.2, PAGE_WIDTH - MARGIN, top + 25.2);

    this.y = top + 29;
  }

  private drawTitleBand(examTitle: string) {
    const doc = this.doc;
    const top = this.y;

    this.setColor(COLORS.navy, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, 11, 'F');
    this.setColor(COLORS.gold, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, 0.9, 'F');
    doc.rect(MARGIN, top + 10.1, CONTENT_WIDTH, 0.9, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    this.setColor(COLORS.white, 'text');
    doc.text('OFFICIAL REPORT CARD & MARKS STATEMENT', PAGE_WIDTH / 2, top + 7, { align: 'center' });

    this.y = top + 14.5;
  }

  private drawStudentInfo(result: ExamResult, student?: StudentAdmission | null, exam?: Exam | null) {
    const doc = this.doc;
    const top = this.y;
    const height = 24;

    this.setColor(COLORS.panel, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'S');

    const colWidth = CONTENT_WIDTH / 3;

    const studentName = result.studentName || student?.studentUser?.fullName || '—';
    const rollNo = student?.rollNumber || '—';
    const admissionNo = student?.admissionNumber || student?.studentCode || `STU-${result.studentId}`;
    const className = exam?.className || student?.schoolClass?.className || '—';
    const examName = exam?.title || result.examTitle || '—';
    const status = result.status || 'DRAFT';

    const infoGrid = [
      { label: 'STUDENT NAME', value: studentName, col: 0, row: 0, bold: true },
      { label: 'ROLL NUMBER', value: rollNo, col: 1, row: 0 },
      { label: 'ADMISSION NO.', value: admissionNo, col: 2, row: 0 },
      { label: 'CLASS / GRADE', value: className, col: 0, row: 1 },
      { label: 'EXAMINATION', value: examName, col: 1, row: 1 },
      { label: 'RECORD STATUS', value: status, col: 2, row: 1, accent: true },
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
      if (item.accent) {
        this.setColor(status === 'PUBLISHED' ? COLORS.brand : COLORS.gold, 'text');
      } else {
        this.setColor(COLORS.ink, 'text');
      }
      doc.text(this.truncate(item.value, colWidth - 8), x, yValue);
    });

    // Dividers
    this.setColor(COLORS.border, 'draw');
    doc.line(MARGIN, top + 11.5, PAGE_WIDTH - MARGIN, top + 11.5);
    doc.line(MARGIN + colWidth, top, MARGIN + colWidth, top + height);
    doc.line(MARGIN + colWidth * 2, top, MARGIN + colWidth * 2, top + height);

    this.y = top + height + 5;
  }

  private drawMarksTable(result: ExamResult, subject?: ExamSubjectSchedule | null) {
    const doc = this.doc;
    const top = this.y;

    const cols = [
      { header: '#', width: 12, align: 'center' as const },
      { header: 'SUBJECT NAME', width: 66, align: 'left' as const },
      { header: 'MAX MARKS', width: 25, align: 'center' as const },
      { header: 'PASSING MARKS', width: 26, align: 'center' as const },
      { header: 'OBTAINED', width: 25, align: 'center' as const },
      { header: 'GRADE', width: 14, align: 'center' as const },
      { header: 'RESULT', width: 14, align: 'center' as const },
    ];

    // Header
    const headerHeight = 8;
    this.setColor(COLORS.navy, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, headerHeight, 'F');

    let currentX = MARGIN;
    cols.forEach((col) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      this.setColor(COLORS.white, 'text');
      const textX = col.align === 'center' ? currentX + col.width / 2 : currentX + 3;
      doc.text(col.header, textX, top + 5.5, { align: col.align });
      currentX += col.width;
    });

    // Row 1 - Subject Marks
    const rowHeight = 10;
    const rowY = top + headerHeight;
    this.setColor(COLORS.white, 'fill');
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowHeight, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowHeight, 'S');

    const totalMarks = result.totalMarks || subject?.totalMarks || 100;
    const passMarks = result.passingMarks || subject?.passingMarks || 33;
    const obtained = result.absent ? 'ABSENT' : String(result.obtainedMarks ?? 0);
    const grade = result.absent ? '—' : result.grade || '—';
    const resultText = result.absent ? 'ABS' : result.passed ? 'PASS' : 'FAIL';

    currentX = MARGIN;
    cols.forEach((col, idx) => {
      if (idx > 0) {
        this.setColor(COLORS.border, 'draw');
        doc.line(currentX, rowY, currentX, rowY + rowHeight);
      }
      doc.setFont('helvetica', idx === 1 ? 'bold' : 'normal');
      doc.setFontSize(7.5);

      if (idx === 6) {
        this.setColor(result.passed && !result.absent ? COLORS.passText : COLORS.failText, 'text');
      } else if (idx === 4 && result.absent) {
        this.setColor(COLORS.failText, 'text');
      } else {
        this.setColor(COLORS.ink, 'text');
      }

      let val = '';
      if (idx === 0) val = '1';
      else if (idx === 1) val = result.subjectName || subject?.subjectName || 'Subject Assessment';
      else if (idx === 2) val = String(totalMarks);
      else if (idx === 3) val = String(passMarks);
      else if (idx === 4) val = obtained;
      else if (idx === 5) val = grade;
      else if (idx === 6) val = resultText;

      const textX = col.align === 'center' ? currentX + col.width / 2 : currentX + 3;
      doc.text(this.truncate(val, col.width - 4), textX, rowY + 6.5, { align: col.align });
      currentX += col.width;
    });

    // Total / Summary Row
    const sumY = rowY + rowHeight;
    const sumHeight = 9;
    this.setColor(COLORS.panel, 'fill');
    doc.rect(MARGIN, sumY, CONTENT_WIDTH, sumHeight, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.rect(MARGIN, sumY, CONTENT_WIDTH, sumHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    this.setColor(COLORS.navyDeep, 'text');
    doc.text('TOTAL AGGREGATE', MARGIN + 14, sumY + 6);
    doc.text(String(totalMarks), MARGIN + 78 + 25 / 2, sumY + 6, { align: 'center' });
    doc.text(String(passMarks), MARGIN + 103 + 26 / 2, sumY + 6, { align: 'center' });
    doc.text(obtained, MARGIN + 129 + 25 / 2, sumY + 6, { align: 'center' });
    doc.text(grade, MARGIN + 154 + 14 / 2, sumY + 6, { align: 'center' });
    this.setColor(result.passed && !result.absent ? COLORS.passText : COLORS.failText, 'text');
    doc.text(resultText, MARGIN + 168 + 14 / 2, sumY + 6, { align: 'center' });

    this.y = sumY + sumHeight + 6;
  }

  private drawOverallResultCard(result: ExamResult) {
    const doc = this.doc;
    const top = this.y;
    const height = 22;

    const isPass = result.passed && !result.absent;
    this.setColor(isPass ? COLORS.paleGreen : COLORS.paleRed, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'F');
    this.setColor(isPass ? COLORS.brand : COLORS.failText, 'draw');
    doc.setLineWidth(0.4);
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'S');

    // Left accent pill
    this.setColor(isPass ? COLORS.brand : COLORS.failText, 'fill');
    doc.rect(MARGIN, top, 2.5, height, 'F');

    // Status Heading
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    this.setColor(isPass ? COLORS.passText : COLORS.failText, 'text');
    doc.text(
      result.absent ? 'RESULT: ABSENT FROM EXAMINATION' : isPass ? 'FINAL RESULT: PASSED' : 'FINAL RESULT: NEEDS IMPROVEMENT / FAILED',
      MARGIN + 8,
      top + 9,
    );

    // Percentage & Grade Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    this.setColor(COLORS.ink, 'text');
    const pct = `${result.percentage ?? 0}%`;
    const grade = result.grade ? `GRADE: ${result.grade}` : '';
    doc.text(`AGGREGATE SCORE: ${pct}   ${grade ? `·   ${grade}` : ''}`, MARGIN + 8, top + 16);

    // Right Badge
    const badgeW = 42;
    const badgeH = 12;
    const badgeX = PAGE_WIDTH - MARGIN - badgeW - 5;
    const badgeY = top + 5;
    this.setColor(isPass ? COLORS.brand : COLORS.failText, 'fill');
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    this.setColor(COLORS.white, 'text');
    doc.text(isPass ? 'QUALIFIED' : 'NOT QUALIFIED', badgeX + badgeW / 2, badgeY + 8, { align: 'center' });

    this.y = top + height + 5;
  }

  private drawGradingScale() {
    const doc = this.doc;
    const top = this.y;
    const height = 18;

    this.setColor(COLORS.panel, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    this.setColor(COLORS.navy, 'text');
    doc.text('OFFICIAL CBSE GRADING SYSTEM REFERENCE:', MARGIN + 4, top + 5);

    const grades = [
      { g: 'A1', range: '91-100%' },
      { g: 'A2', range: '81-90%' },
      { g: 'B1', range: '71-80%' },
      { g: 'B2', range: '61-70%' },
      { g: 'C1', range: '51-60%' },
      { g: 'C2', range: '41-50%' },
      { g: 'D', range: '33-40% (Pass)' },
      { g: 'E', range: '<33% (Needs Imp.)' },
    ];

    const slotW = CONTENT_WIDTH / 8;
    grades.forEach((item, idx) => {
      const x = MARGIN + idx * slotW + slotW / 2;
      doc.setFont('times', 'bold');
      doc.setFontSize(7.5);
      this.setColor(COLORS.ink, 'text');
      doc.text(item.g, x, top + 10.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      this.setColor(COLORS.muted, 'text');
      doc.text(item.range, x, top + 15, { align: 'center' });
    });

    this.y = top + height + 4.5;
  }

  private drawRemarksSection(result: ExamResult) {
    const doc = this.doc;
    const top = this.y;
    const height = 18;

    this.setColor(COLORS.white, 'fill');
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'F');
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, top, CONTENT_WIDTH, height, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    this.setColor(COLORS.navy, 'text');
    doc.text("CLASS TEACHER'S APPRAISAL & REMARKS:", MARGIN + 4, top + 5.5);

    doc.setFont('times', 'italic');
    doc.setFontSize(8.2);
    this.setColor(COLORS.ink, 'text');
    const remarkText = result.remarks?.trim() || 'Demonstrates sincere learning efforts and active participation in class activities.';
    doc.text(this.truncate(`"${remarkText}"`, CONTENT_WIDTH - 8), MARGIN + 4, top + 12);

    this.y = top + height + 6;
  }

  private drawSignaturesAndStamp() {
    const doc = this.doc;
    const top = this.y;

    // Official Stamp Circle
    const stampX = MARGIN + 32;
    const stampY = top + 14;
    this.setColor(COLORS.navy, 'draw');
    doc.setLineWidth(0.4);
    doc.circle(stampX, stampY, 11, 'S');
    doc.circle(stampX, stampY, 9.8, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    this.setColor(COLORS.navy, 'text');
    doc.text('OFFICIAL SEAL', stampX, stampY - 3, { align: 'center' });
    doc.text(initialsOf(this.schoolName), stampX, stampY + 1.5, { align: 'center' });
    doc.text('VERIFIED', stampX, stampY + 5.5, { align: 'center' });

    // Signature 1: Class Teacher
    const sig1X = PAGE_WIDTH / 2 - 15;
    this.setColor(COLORS.border, 'draw');
    doc.setLineWidth(0.3);
    doc.line(sig1X - 22, top + 22, sig1X + 22, top + 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    this.setColor(COLORS.ink, 'text');
    doc.text('Class Teacher Signature', sig1X, top + 26, { align: 'center' });

    // Signature 2: Principal / Controller
    const sig2X = PAGE_WIDTH - MARGIN - 30;
    doc.line(sig2X - 22, top + 22, sig2X + 22, top + 22);
    doc.text('Principal / Head of Exam', sig2X, top + 26, { align: 'center' });

    this.y = top + 34;
  }

  private drawPageFrames() {
    const doc = this.doc;

    // Outer double border
    this.setColor(COLORS.navy, 'draw');
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
      `${this.truncate(this.schoolName, 75)}  ·  Official Computer-Generated Examination Marksheet`,
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

export async function downloadExamResultPdf(params: ExamResultPdfParams) {
  const { jsPDF: JsPdf } = await import('jspdf');
  const doc = new JsPdf({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  const studentName = params.result.studentName || params.student?.studentUser?.fullName || 'Student';
  doc.setProperties({
    title: `Exam Result Marksheet - ${studentName}`,
    subject: 'Student Progress Report Card',
    creator: params.schoolName || 'SQR School',
  });

  new ExamResultCardDocument(doc, params.schoolName || 'SQR School').generate(params);

  const safeName = studentName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  const safeExam = (params.exam?.title || params.result.examTitle || 'Exam').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  doc.save(`Result-Marksheet-${safeName}-${safeExam}.pdf`);
}

export interface BroadsheetPdfParams {
  results: ExamResult[];
  students: StudentAdmission[];
  exam?: Exam | null;
  subject?: ExamSubjectSchedule | null;
  schoolName?: string;
}

export async function downloadExamResultsBroadsheetPdf(params: BroadsheetPdfParams) {
  const { jsPDF: JsPdf } = await import('jspdf');
  const { results, students, exam, subject, schoolName = 'SQR School' } = params;

  // Landscape for broadsheet
  const doc = new JsPdf({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const width = 297;
  const height = 210;
  const m = 12;
  const cWidth = width - m * 2;

  doc.setProperties({
    title: `Exam Broadsheet - ${exam?.title || 'Results'}`,
    subject: 'Examination Results Broadsheet',
    creator: schoolName,
  });

  // Border
  doc.setDrawColor(15, 34, 64);
  doc.setLineWidth(0.5);
  doc.rect(6, 6, width - 12, height - 12, 'S');

  // Header banner
  doc.setFillColor(15, 34, 64);
  doc.rect(m, m, cWidth, 14, 'F');
  doc.setFillColor(180, 140, 50);
  doc.rect(m, m + 13.2, cWidth, 0.8, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(schoolName.toUpperCase(), m + 5, m + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(253, 248, 235);
  const examSubTitle = `EXAM RESULTS BROADSHEET  ·  ${exam?.title || 'EXAMINATION'}  ·  ${subject?.subjectName || 'ALL SUBJECTS'}`;
  doc.text(examSubTitle, m + 5, m + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}  ·  Total Students: ${students.length}`,
    width - m - 5,
    m + 9,
    { align: 'right' },
  );

  // Table
  const tableY = m + 18;
  const rowH = 7.5;
  const cols = [
    { header: '#', w: 10 },
    { header: 'ROLL NO', w: 22 },
    { header: 'STUDENT NAME', w: 65 },
    { header: 'ADM NO', w: 26 },
    { header: 'MAX', w: 18 },
    { header: 'PASS', w: 18 },
    { header: 'OBTAINED', w: 22 },
    { header: '%', w: 18 },
    { header: 'GRADE', w: 18 },
    { header: 'RESULT', w: 22 },
    { header: 'STATUS', w: 24 },
  ];

  // Table Header
  doc.setFillColor(240, 243, 248);
  doc.rect(m, tableY, cWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(m, tableY, cWidth, 7, 'S');

  let curX = m;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 34, 64);
  cols.forEach((c) => {
    doc.text(c.header, curX + c.w / 2, tableY + 4.8, { align: 'center' });
    curX += c.w;
  });

  // Table Rows (render up to max printable rows per page)
  let y = tableY + 7;
  students.forEach((student, idx) => {
    if (y + rowH > height - 16) return; // fits on page 1

    const res = results.find((r) => r.studentId === student.id);
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(m, y, cWidth, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(m, y, cWidth, rowH, 'S');

    const total = res?.totalMarks || subject?.totalMarks || 100;
    const pass = res?.passingMarks || subject?.passingMarks || 33;
    const obt = res ? (res.absent ? 'ABS' : String(res.obtainedMarks ?? 0)) : '—';
    const pct = res ? (res.absent ? '—' : `${res.percentage ?? 0}%`) : '—';
    const grade = res ? (res.absent ? '—' : res.grade || '—') : '—';
    const resultText = !res ? '—' : res.absent ? 'ABSENT' : res.passed ? 'PASS' : 'FAIL';

    curX = m;
    const vals = [
      String(idx + 1),
      student.rollNumber || '—',
      student.studentUser?.fullName || '—',
      student.studentCode || String(student.admissionNumber || '—'),
      String(total),
      String(pass),
      obt,
      pct,
      grade,
      resultText,
      res?.status || 'DRAFT',
    ];

    vals.forEach((v, vIdx) => {
      const c = cols[vIdx];
      doc.setFont('helvetica', vIdx === 2 ? 'bold' : 'normal');
      doc.setFontSize(6.5);

      if (vIdx === 9 && res) {
        doc.setTextColor(res.passed && !res.absent ? 21 : 185, res.passed && !res.absent ? 128 : 28, res.passed && !res.absent ? 61 : 28);
      } else {
        doc.setTextColor(17, 24, 39);
      }

      const align = vIdx === 2 ? 'left' : 'center';
      const textX = align === 'left' ? curX + 3 : curX + c.w / 2;
      doc.text(v.length > 28 ? `${v.slice(0, 26)}…` : v, textX, y + 4.8, { align });
      curX += c.w;
    });

    y += rowH;
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Broadsheet Generated by ${schoolName} Examination Office`, m, height - 9);
  doc.text('Confidential Official Record · Page 1', width - m, height - 9, { align: 'right' });

  const safeExam = (exam?.title || 'Exam').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  doc.save(`Exam-Broadsheet-${safeExam}.pdf`);
}

