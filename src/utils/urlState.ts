/**
 * Clean & Human-Readable URL State Persistence for TimeSlotter.
 *
 * Example URL:
 *   ?mon=14-16_18-19&tue=8&wed=10-15&start=thu&tz=0_0&sleep=22-8
 *
 * Benefits:
 *   - Zero %-escaping (%3A, %2C, %3B are eliminated completely).
 *   - Each active day is its own clean parameter (mon, tue, wed, thu, fri, sat, sun).
 *   - Ranges separated by "_" instead of commas (e.g. "14-16_18-19").
 *   - Timezone separated by "_" instead of colons (e.g. "2_0", "-5_3").
 */

import type { AppSettings, DayOfWeek, WeekSchedule } from '../types';
import { TIMEZONE_OPTIONS } from './timezones';
import { DAYS_OF_WEEK, sanitizeSchedule, sanitizeSettings } from './stateValidation';

export const DAY_3LETTER_MAP: Record<string, DayOfWeek> = {
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
  sat: 'saturday',
  sun: 'sunday',
};

export const DAY_TO_3LETTER: Record<DayOfWeek, string> = {
  monday: 'mon',
  tuesday: 'tue',
  wednesday: 'wed',
  thursday: 'thu',
  friday: 'fri',
  saturday: 'sat',
  sunday: 'sun',
};

const VALID_TIMEZONE_OFFSETS = new Set(TIMEZONE_OPTIONS.map(({ offset }) => offset));

// ─── Encode Helpers ──────────────────────────────────────────────────────────

/**
 * Encode number[] into compact string: [14, 15, 16, 18, 19] -> "14-16_18-19"
 * Uses "_" as separator to prevent URL encoding.
 */
export function encodeHours(hours: number[]): string {
  if (!hours || hours.length === 0) return '';
  const sorted = Array.from(new Set(hours.filter((hour) =>
    Number.isInteger(hour) && hour >= 0 && hour < 24
  ))).sort((a, b) => a - b);
  if (sorted.length === 0) return '';
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join('_');
}

/**
 * Decode "14-16_18-19" -> [14, 15, 16, 18, 19], ignoring invalid tokens.
 */
export function decodeHours(str: string): number[] {
  if (!str) return [];
  const hours: number[] = [];
  const parts = str.split('_');

  for (const part of parts) {
    const range = /^(\d{1,2})-(\d{1,2})$/.exec(part);
    if (range) {
      const a = Number(range[1]);
      const b = Number(range[2]);
      if (a < 24 && b < 24 && b >= a) {
        for (let h = a; h <= b; h++) hours.push(h);
      }
    } else if (/^(?:0|[1-9]\d?)$/.test(part)) {
      const h = Number(part);
      if (h >= 0 && h < 24) hours.push(h);
    }
  }
  return Array.from(new Set(hours)).sort((a, b) => a - b);
}

// ─── Encode Full State -> Clean URL ──────────────────────────────────────────

export function encodeStateToURL(
  schedule: WeekSchedule,
  settings: AppSettings
): string {
  const params = new URLSearchParams();
  const safeSchedule = sanitizeSchedule(schedule);
  const safeSettings = sanitizeSettings(settings);

  // 1. Separate clean parameters for each active day: mon=14-16_18-19
  for (const day of DAYS_OF_WEEK) {
    const hours = safeSchedule[day];
    if (hours && hours.length > 0) {
      const encoded = encodeHours(hours);
      if (encoded) {
        params.set(DAY_TO_3LETTER[day], encoded);
      }
    }
  }

  // 2. Start day: start=thu
  params.set('start', DAY_TO_3LETTER[safeSettings.startDay]);

  // 3. Timezones: tz=0_0 or tz=2_0 or tz=-5_3 (using underscore to prevent %3A)
  const myTz = safeSettings.myTimezoneOffset;
  const clTz = safeSettings.clientTimezoneOffset;
  if (myTz !== 0 || clTz !== 0) {
    params.set('tz', `${myTz}_${clTz}`);
  }

  // 4. Sleep: sleep=22-8 or sleep=off
  if (!safeSettings.sleepEnabled) {
    params.set('sleep', 'off');
  } else if (safeSettings.sleepStartHour !== 22 || safeSettings.sleepEndHour !== 8) {
    params.set('sleep', `${safeSettings.sleepStartHour}-${safeSettings.sleepEndHour}`);
  }

  const q = params.toString();
  return q ? `?${q}` : '';
}

// ─── Decode URL -> State ─────────────────────────────────────────────────────

export interface ParsedURLState {
  schedule?: Partial<WeekSchedule>;
  settings?: Partial<AppSettings>;
}

export function decodeURLState(search: string): ParsedURLState {
  if (!search || search === '?') return {};
  const cleanSearch = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(cleanSearch);
  const result: ParsedURLState = {};

  const schedule: Partial<WeekSchedule> = {};

  // 1. Per-day parameters (mon, tue, wed, thu, fri, sat, sun)
  let foundModernDays = false;
  for (const [key, dayId] of Object.entries(DAY_3LETTER_MAP)) {
    if (params.has(key)) {
      const values = params.getAll(key);
      schedule[dayId] = values.length === 1 ? decodeHours(values[0]) : [];
      foundModernDays = true;
    }
  }

  if (foundModernDays) {
    result.schedule = schedule;
  }

  // 2. Start day
  const startValues = params.getAll('start');
  const startParam = startValues.length === 1 ? startValues[0] : null;
  if (startParam) {
    const normalizedStart = startParam.toLowerCase();
    const mapped = DAY_3LETTER_MAP[normalizedStart];
    if (mapped) {
      result.settings = { ...result.settings, startDay: mapped };
    }
  }

  // 3. Timezones
  const timezoneValues = params.getAll('tz');
  const tzParam = timezoneValues.length === 1 ? timezoneValues[0] : null;
  if (tzParam) {
    const separatorIdx = tzParam.lastIndexOf('_');
    if (separatorIdx > 0) {
      const valuePattern = /^-?\d+(?:\.\d+)?$/;
      const myValue = tzParam.slice(0, separatorIdx);
      const clientValue = tzParam.slice(separatorIdx + 1);
      const my = Number(myValue);
      const cl = Number(clientValue);
      if (
        valuePattern.test(myValue)
        && valuePattern.test(clientValue)
        && VALID_TIMEZONE_OFFSETS.has(my)
        && VALID_TIMEZONE_OFFSETS.has(cl)
      ) {
        result.settings = {
          ...result.settings,
          myTimezoneOffset: my,
          clientTimezoneOffset: cl,
        };
      }
    }
  }

  // 4. Sleep
  const sleepValues = params.getAll('sleep');
  const sleepParam = sleepValues.length === 1 ? sleepValues[0] : null;
  if (sleepParam === 'off') {
    result.settings = { ...result.settings, sleepEnabled: false };
  } else if (sleepParam) {
    const sleepHours = /^(\d{1,2})-(\d{1,2})$/.exec(sleepParam);
    if (sleepHours) {
      const start = Number(sleepHours[1]);
      const end = Number(sleepHours[2]);
      if (start < 24 && end < 24) {
        result.settings = {
          ...result.settings,
          sleepEnabled: true,
          sleepStartHour: start,
          sleepEndHour: end,
        };
      }
    }
  }

  return result;
}

/** Push clean state to URL without reloading */
export function pushStateToURL(schedule: WeekSchedule, settings: AppSettings): void {
  const q = encodeStateToURL(schedule, settings);
  const newURL = `${window.location.pathname}${q}`;
  if (window.location.search !== (q || '')) {
    window.history.replaceState(null, '', newURL);
  }
}
