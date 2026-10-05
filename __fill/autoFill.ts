import { timeToInput, type ApiTime, type DayOfWeek, type Period, type WeeklyTimetableEntry } from '@/lib/timetableService';
import type { TeacherBySubject } from '@/lib/schoolService';

export interface DraftEntry {
  key: string;
  period: Period;
  day: DayOfWeek;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
}

export interface AutoFillInput {
  periods: Period[];
  days: readonly DayOfWeek[];
  classEntries: WeeklyTimetableEntry[];
  allEntries: WeeklyTimetableEntry[];
  subjects: { id: number; subjectName: string }[];
  teachersBySubject: Map<number, TeacherBySubject[]>;
}

const toMinutes = (value: ApiTime) => {
  const [h, m] = timeToInput(value).split(':').map(Number);
  return h * 60 + m;
};

interface Busy {
  day: DayOfWeek;
  start: number;
  end: number;
}

export function planAutoFill({ periods, days, classEntries, allEntries, subjects, teachersBySubject }: AutoFillInput) {
  const teaching = [...periods].filter((p) => !p.breakPeriod).sort((a, b) => a.periodOrder - b.periodOrder);
  const taken = new Set(classEntries.map((e) => `${e.periodId}-${e.dayOfWeek}`));

  const busy = new Map<number, Busy[]>();
  const addBusy = (teacherId: number, slot: Busy) => busy.set(teacherId, [...(busy.get(teacherId) ?? []), slot]);
  for (const e of allEntries) addBusy(e.teacherId, { day: e.dayOfWeek, start: toMinutes(e.startTime), end: toMinutes(e.endTime) });
  const isFree = (teacherId: number, slot: Busy) =>
    !(busy.get(teacherId) ?? []).some((b) => b.day === slot.day && b.start < slot.end && slot.start < b.end);

  const weekly = new Map<number, number>();
  const daily = new Map<string, number>();
  const subjectTeacher = new Map<number, number>();
  const bump = (map: Map<string | number, number>, key: string | number) => map.set(key, (map.get(key) ?? 0) + 1);
  const bySlot = new Map<string, number>();
  for (const e of classEntries) {
    bump(weekly, e.subjectId);
    bump(daily, `${e.dayOfWeek}-${e.subjectId}`);
    bySlot.set(`${e.periodId}-${e.dayOfWeek}`, e.subjectId);
    if (!subjectTeacher.has(e.subjectId)) subjectTeacher.set(e.subjectId, e.teacherId);
  }

  const load = (teacherId: number) => busy.get(teacherId)?.length ?? 0;
  const schedulable = subjects.filter((s) => (teachersBySubject.get(s.id) ?? []).length > 0);
  const jitter = new Map(schedulable.map((s) => [s.id, Math.random()]));

  const drafts: DraftEntry[] = [];
  let unfilled = 0;

  for (const day of days) {
    teaching.forEach((period, index) => {
      const key = `${period.id}-${day}`;
      if (taken.has(key)) return;
      const slot: Busy = { day, start: toMinutes(period.startTime), end: toMinutes(period.endTime) };
      const prevSubject = index > 0 ? bySlot.get(`${teaching[index - 1].id}-${day}`) : undefined;
      const ranked = [...schedulable].sort(
        (a, b) =>
          (daily.get(`${day}-${a.id}`) ?? 0) - (daily.get(`${day}-${b.id}`) ?? 0) ||
          (weekly.get(a.id) ?? 0) - (weekly.get(b.id) ?? 0) ||
          Number(a.id === prevSubject) - Number(b.id === prevSubject) ||
          jitter.get(a.id)! - jitter.get(b.id)!,
      );
      for (const subject of ranked) {
        const preferred = subjectTeacher.get(subject.id);
        const teacher = [...teachersBySubject.get(subject.id)!]
          .sort((a, b) => Number(b.id === preferred) - Number(a.id === preferred) || load(a.id) - load(b.id))
          .find((t) => isFree(t.id, slot));
        if (!teacher) continue;
        drafts.push({ key, period, day, subjectId: subject.id, subjectName: subject.subjectName, teacherId: teacher.id, teacherName: teacher.fullName });
        addBusy(teacher.id, slot);
        bump(weekly, subject.id);
        bump(daily, `${day}-${subject.id}`);
        bySlot.set(key, subject.id);
        if (!subjectTeacher.has(subject.id)) subjectTeacher.set(subject.id, teacher.id);
        return;
      }
      unfilled += 1;
    });
  }
  return { drafts, unfilled };
}
