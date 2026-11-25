import { DEFAULT_SETTINGS } from '../constants';
import type { AppSettings, DayOfWeek, WeekSchedule } from '../types';
import { TIMEZONE_OPTIONS } from './timezones';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const timezoneOffsets = new Set(TIMEZONE_OPTIONS.map(({ offset }) => offset));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizeSettings(value: unknown): AppSettings {
  const source = isRecord(value) ? value : {};

  return {
    ...DEFAULT_SETTINGS,
    colorMode: source.colorMode === 'light' ? 'light' : 'dark',
    startDay: DAYS_OF_WEEK.includes(source.startDay as DayOfWeek)
      ? source.startDay as DayOfWeek
      : DEFAULT_SETTINGS.startDay,
    myTimezoneOffset: typeof source.myTimezoneOffset === 'number'
      && timezoneOffsets.has(source.myTimezoneOffset)
      ? source.myTimezoneOffset
      : DEFAULT_SETTINGS.myTimezoneOffset,
    clientTimezoneOffset: typeof source.clientTimezoneOffset === 'number'
      && timezoneOffsets.has(source.clientTimezoneOffset)
      ? source.clientTimezoneOffset
      : DEFAULT_SETTINGS.clientTimezoneOffset,
    sleepEnabled: typeof source.sleepEnabled === 'boolean'
      ? source.sleepEnabled
      : DEFAULT_SETTINGS.sleepEnabled,
    sleepStartHour: Number.isInteger(source.sleepStartHour)
      && (source.sleepStartHour as number) >= 0
      && (source.sleepStartHour as number) < 24
      ? source.sleepStartHour as number
      : DEFAULT_SETTINGS.sleepStartHour,
    sleepEndHour: Number.isInteger(source.sleepEndHour)
      && (source.sleepEndHour as number) >= 0
      && (source.sleepEndHour as number) < 24
      ? source.sleepEndHour as number
      : DEFAULT_SETTINGS.sleepEndHour,
    showBothTimezonesInOutput: typeof source.showBothTimezonesInOutput === 'boolean'
      ? source.showBothTimezonesInOutput
      : DEFAULT_SETTINGS.showBothTimezonesInOutput,
    persistSchedule: typeof source.persistSchedule === 'boolean'
      ? source.persistSchedule
      : DEFAULT_SETTINGS.persistSchedule,
    disableWeekends: typeof source.disableWeekends === 'boolean'
      ? source.disableWeekends
      : DEFAULT_SETTINGS.disableWeekends,
  };
}

export function sanitizeSchedule(value: unknown): WeekSchedule {
  const source = isRecord(value) ? value : {};
  const schedule = {} as WeekSchedule;

  for (const day of DAYS_OF_WEEK) {
    const hours = source[day];
    schedule[day] = Array.isArray(hours)
      ? Array.from(new Set(hours.filter((hour): hour is number =>
        typeof hour === 'number'
        && Number.isInteger(hour)
        && hour >= 0
        && hour < 24
      ))).sort((a, b) => a - b)
      : [];
  }

  return schedule;
}

export function hasScheduleData(value: unknown): boolean {
  return isRecord(value) && DAYS_OF_WEEK.some((day) => Array.isArray(value[day]));
}
