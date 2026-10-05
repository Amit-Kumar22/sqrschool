// One-off: fill every empty period of every class through the backend API.
// Dry-run by default; APPLY=1 writes. Reuses the app's own planner.
//   EMAIL=.. PASSWORD=.. [TOKEN=..] [APPLY=1] npx tsx --tsconfig tsconfig.json fill-timetable.ts
import { API_ENDPOINTS, BACKEND_API_BASE_URL } from '@/lib/config';
import { planAutoFill } from './autoFill';
import type { Period, WeeklyTimetableEntry, DayOfWeek } from '@/lib/timetableService';
import type { TeacherBySubject } from '@/lib/schoolService';

const BASE = process.env.BASE || BACKEND_API_BASE_URL;
const APPLY = process.env.APPLY === '1';
const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
let token = process.env.TOKEN || '';

async function call<T>(method: string, path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) : '';
  const res = await fetch(BASE + path + qs, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${data?.message ?? text.slice(0, 200)}`);
  return data as T;
}

// 8 x 45-min periods from 08:00 with a 15-min break after period 4.
function standardPeriods(classId: number) {
  const out: { name: string; classId: number; periodOrder: number; startTime: string; endTime: string; breakPeriod: boolean }[] = [];
  let t = 8 * 60;
  const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  let order = 1;
  for (let p = 1; p <= 8; p++) {
    out.push({ name: `Period ${p}`, classId, periodOrder: order++, startTime: hm(t), endTime: hm(t + 45), breakPeriod: false });
    t += 45;
    if (p === 4) {
      out.push({ name: 'Break', classId, periodOrder: order++, startTime: hm(t), endTime: hm(t + 15), breakPeriod: true });
      t += 15;
    }
  }
  return out;
}

async function main() {
  if (!token) {
    const login = await call<{ accessToken: string; data: { role: string; fullName: string } }>('POST', API_ENDPOINTS.AUTH.LOGIN, {
      email: process.env.EMAIL,
      password: process.env.PASSWORD,
    });
    token = login.accessToken;
    console.log(`Logged in as ${login.data.fullName} (${login.data.role})`);
  }
  console.log(APPLY ? '== APPLY MODE: writing to backend ==' : '== DRY RUN: nothing will be written ==');

  const classes = (await call<{ content: { id: number; className: string }[] }>('GET', API_ENDPOINTS.CLASS.LIST, undefined, { isActive: true, page: 0, size: 200 })).content ?? [];
  const allSubjects = (await call<{ content: { id: number; subjectName: string }[] }>('GET', API_ENDPOINTS.SUBJECT.LIST, undefined, { page: 0, size: 200 }).catch(() => ({ content: [] }))).content ?? [];

  // Busy calendar across all classes, grown as each class is planned.
  const busy: WeeklyTimetableEntry[] = [];
  const classEntriesById = new Map<number, WeeklyTimetableEntry[]>();
  for (const c of classes) {
    const list = await call<WeeklyTimetableEntry[]>('GET', API_ENDPOINTS.WEEKLY_TIMETABLE.LIST, undefined, { classId: c.id });
    classEntriesById.set(c.id, list ?? []);
    busy.push(...(list ?? []));
  }

  const teacherCache = new Map<number, TeacherBySubject[]>();
  const teachersFor = async (subjectId: number) => {
    if (!teacherCache.has(subjectId)) {
      teacherCache.set(subjectId, await call<TeacherBySubject[]>('GET', API_ENDPOINTS.TEACHER.BY_SUBJECT, undefined, { subjectId }).catch(() => []));
    }
    return teacherCache.get(subjectId)!;
  };

  let totalCreated = 0;
  let totalFailed = 0;
  let fakeId = -1;

  for (const c of classes) {
    let periods = (await call<Period[]>('GET', API_ENDPOINTS.PERIOD.LIST, undefined, { classId: c.id })) ?? [];
    let createdPeriods = 0;
    if (periods.length === 0) {
      const std = standardPeriods(c.id);
      if (APPLY) {
        for (const p of std) periods.push(await call<Period>('POST', API_ENDPOINTS.PERIOD.CREATE, p));
      } else {
        periods = std.map((p) => ({ ...p, id: fakeId--, className: c.className, createdAt: '' }));
      }
      createdPeriods = std.length;
    }

    const mapped = (await call<{ content: { subjectId: number; subjectName: string }[] }>('GET', API_ENDPOINTS.CLASS_SUBJECT.LIST, undefined, { classId: c.id, page: 0, size: 200 }).catch(() => ({ content: [] }))).content ?? [];
    const subjects = mapped.length ? mapped.map((m) => ({ id: m.subjectId, subjectName: m.subjectName })) : allSubjects;
    const teachersBySubject = new Map<number, TeacherBySubject[]>();
    for (const s of subjects) teachersBySubject.set(s.id, await teachersFor(s.id));

    const classEntries = classEntriesById.get(c.id) ?? [];
    const { drafts, unfilled } = planAutoFill({ periods, days: DAYS, classEntries, allEntries: busy, subjects, teachersBySubject });

    // Later classes must see these teachers as busy.
    for (const d of drafts) {
      busy.push({ ...({} as WeeklyTimetableEntry), dayOfWeek: d.day, teacherId: d.teacherId, startTime: d.period.startTime, endTime: d.period.endTime });
    }

    const teachingSlots = periods.filter((p) => !p.breakPeriod).length * DAYS.length;
    console.log(
      `\nClass ${c.className} (id ${c.id}): ${createdPeriods ? `${createdPeriods} standard periods ${APPLY ? 'created' : 'to create'}, ` : ''}` +
        `${classEntries.length} already saved, ${drafts.length} to fill, ${unfilled} unfillable, ${teachingSlots} teaching slots` +
        `${mapped.length ? '' : ' [no mapped subjects -> using all]'}`,
    );
    const teaching = periods.filter((p) => !p.breakPeriod).sort((a, b) => a.periodOrder - b.periodOrder);
    for (const day of DAYS) {
      const row = teaching.map((p) => {
        const saved = classEntries.find((e) => e.periodId === p.id && e.dayOfWeek === day);
        const d = drafts.find((x) => x.key === `${p.id}-${day}`);
        return (saved ? saved.subjectName + '*' : d ? d.subjectName : '--').slice(0, 10).padEnd(10);
      });
      console.log(`  ${day.slice(0, 3)} ${row.join(' ')}`);
    }

    if (APPLY) {
      for (const d of drafts) {
        try {
          await call('POST', API_ENDPOINTS.WEEKLY_TIMETABLE.CREATE, {
            periodId: d.period.id,
            dayOfWeek: d.day,
            subjectId: d.subjectId,
            teacherId: d.teacherId,
            remarks: '',
          });
          totalCreated++;
        } catch (e) {
          totalFailed++;
          console.log(`  FAILED ${d.day} ${d.period.name} ${d.subjectName}/${d.teacherName}: ${(e as Error).message}`);
        }
      }
    } else {
      totalCreated += drafts.length;
    }
  }

  console.log(`\n${APPLY ? 'Created' : 'Would create'} ${totalCreated} timetable entries${APPLY ? `, ${totalFailed} failed` : ''}.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
