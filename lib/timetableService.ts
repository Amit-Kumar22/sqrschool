import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Period service ──────────────────────────────────────────────────────────
// Dedicated service for the period-controller endpoints. Every endpoint here
// returns/accepts the raw entity — no {result} envelope.

// The backend deserializes startTime/endTime as java.time.LocalTime, which
// only accepts a plain "HH:mm[:ss]" string on write (confirmed against the
// live API — sending the {hour, minute, second, nano} object shape from the
// swagger schema throws "Cannot deserialize value of type `java.time.LocalTime`
// from Object value"). What a LocalTime serializes back to on read depends on
// the server's Jackson config, so ApiTime stays a union and every read goes
// through parseTime below instead of assuming one shape.
export type ApiTime = string | number[] | { hour: number; minute: number; second?: number; nano?: number };

function parseTime(value: ApiTime): { hour: number; minute: number } {
  if (typeof value === 'string') {
    const [hour, minute] = value.split(':').map(Number);
    return { hour: hour || 0, minute: minute || 0 };
  }
  if (Array.isArray(value)) {
    return { hour: value[0] ?? 0, minute: value[1] ?? 0 };
  }
  return { hour: value?.hour ?? 0, minute: value?.minute ?? 0 };
}

/** Any ApiTime shape -> "HH:mm" for <input type="time">. */
export const timeToInput = (value: ApiTime): string => {
  const { hour, minute } = parseTime(value);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

/** Any ApiTime shape -> "8:00 AM" for display in the timetable grid. */
export const formatTime = (value: ApiTime): string => {
  const { hour, minute } = parseTime(value);
  const hour12 = hour % 12 || 12;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
};

export interface Period {
  id: number;
  name: string;
  classId: number;
  className: string;
  periodOrder: number;
  startTime: ApiTime;
  endTime: ApiTime;
  breakPeriod: boolean;
  createdAt: string;
}

export interface PeriodPayload {
  name: string;
  classId: number;
  periodOrder: number;
  /** Plain "HH:mm" — the only shape the backend's LocalTime deserializer accepts. */
  startTime: string;
  endTime: string;
  breakPeriod: boolean;
}

export interface PeriodListParams {
  classId: number;
}

/** Every period defined for one class. Returns the raw array — no envelope; callers sort by periodOrder. */
export const getPeriods = async ({ classId }: PeriodListParams): Promise<Period[]> => {
  const response = await api.get<Period[]>(API_ENDPOINTS.PERIOD.LIST, { params: { classId } });
  return response.data;
};

export const getPeriod = async (id: number): Promise<Period> => {
  const response = await api.get<Period>(API_ENDPOINTS.PERIOD.GET(id));
  return response.data;
};

export const createPeriod = async (data: PeriodPayload): Promise<Period> => {
  const response = await api.post<Period>(API_ENDPOINTS.PERIOD.CREATE, data);
  return response.data;
};

export const updatePeriod = async (id: number, data: PeriodPayload): Promise<Period> => {
  const response = await api.put<Period>(API_ENDPOINTS.PERIOD.UPDATE(id), data);
  return response.data;
};

export const deletePeriod = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.PERIOD.DELETE(id));
};

// ─── Weekly timetable service ────────────────────────────────────────────────
// Dedicated service for the weekly-timetable-controller endpoints. A weekly
// timetable entry assigns a subject + teacher to one period on one day of
// the week (the period itself pins the class). Every endpoint here
// returns/accepts the raw entity — no {result} envelope.

export const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface WeeklyTimetableEntry {
  id: number;
  classId: number;
  className: string;
  periodId: number;
  periodName: string;
  periodOrder: number;
  startTime: ApiTime;
  endTime: ApiTime;
  breakPeriod: boolean;
  dayOfWeek: DayOfWeek;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  remarks: string;
  createdAt: string;
}

export interface WeeklyTimetablePayload {
  periodId: number;
  dayOfWeek: DayOfWeek;
  subjectId: number;
  teacherId: number;
  remarks: string;
}

export interface WeeklyTimetableListParams {
  classId?: number;
  dayOfWeek?: DayOfWeek;
}

// Fetched without a dayOfWeek filter so the whole week's grid can be built
// client-side from one call, same idea as getFeeStructures/getClasses.
/** Timetable entries for a class, optionally narrowed to one day. Returns the raw array — no envelope. */
export const getWeeklyTimetable = async ({ classId, dayOfWeek }: WeeklyTimetableListParams = {}): Promise<WeeklyTimetableEntry[]> => {
  const response = await api.get<WeeklyTimetableEntry[]>(API_ENDPOINTS.WEEKLY_TIMETABLE.LIST, {
    params: { classId, dayOfWeek },
  });
  return response.data;
};

export const createWeeklyTimetableEntry = async (data: WeeklyTimetablePayload): Promise<WeeklyTimetableEntry> => {
  const response = await api.post<WeeklyTimetableEntry>(API_ENDPOINTS.WEEKLY_TIMETABLE.CREATE, data);
  return response.data;
};

export const updateWeeklyTimetableEntry = async (id: number, data: WeeklyTimetablePayload): Promise<WeeklyTimetableEntry> => {
  const response = await api.put<WeeklyTimetableEntry>(API_ENDPOINTS.WEEKLY_TIMETABLE.UPDATE(id), data);
  return response.data;
};

export const deleteWeeklyTimetableEntry = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.WEEKLY_TIMETABLE.DELETE(id));
};
