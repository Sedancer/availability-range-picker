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
 *   - Fully backward-compatible with legacy URLs (?s=mo:...;...).
 */

import type { AppSettings, DayOfWeek, WeekSchedule } from '../types';

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

// Legacy 2-letter codes for backward compatibility
const LEGACY_DAY_CODES: Record<string, DayOfWeek> = {
  mo: 'monday',
  tu: 'tuesday',
  we: 'wednesday',
  th: 'thursday',
  fr: 'friday',
  sa: 'saturday',
  su: 'sunday',
};

const ALL_DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

// ─── Encode Helpers ──────────────────────────────────────────────────────────

/**
 * Encode number[] into compact string: [14, 15, 16, 18, 19] -> "14-16_18-19"
 * Uses "_" as separator to prevent URL encoding.
 */
export function encodeHours(hours: number[]): string {
  if (!hours || hours.length === 0) return '';
  const sorted = Array.from(new Set(hours)).sort((a, b) => a - b);
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
 * Decode "14-16_18-19" or legacy "14-16,18-19" -> [14, 15, 16, 18, 19]
 */
export function decodeHours(str: string): number[] {
  if (!str) return [];
  const hours: number[] = [];
  // Supports both modern "_" and legacy "," separators
  const parts = str.split(/[_,]/);

  for (const part of parts) {
    const dash = part.indexOf('-');
    if (dash > 0) {
      const a = parseInt(part.slice(0, dash), 10);
      const b = parseInt(part.slice(dash + 1), 10);
      if (!isNaN(a) && !isNaN(b)) {
        for (let h = a; h <= b; h++) hours.push(h);
      }
    } else {
      const h = parseInt(part, 10);
      if (!isNaN(h)) hours.push(h);
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

  // 1. Separate clean parameters for each active day: mon=14-16_18-19
  for (const day of ALL_DAYS) {
    const hours = schedule[day];
    if (hours && hours.length > 0) {
      const encoded = encodeHours(hours);
      if (encoded) {
        params.set(DAY_TO_3LETTER[day], encoded);
      }
    }
  }

  // 2. Start day: start=thu
  params.set('start', DAY_TO_3LETTER[settings.startDay]);

  // 3. Timezones: tz=0_0 or tz=2_0 or tz=-5_3 (using underscore to prevent %3A)
  const myTz = settings.myTimezoneOffset;
  const clTz = settings.clientTimezoneOffset;
  if (myTz !== 0 || clTz !== 0) {
    params.set('tz', `${myTz}_${clTz}`);
  }

  // 4. Sleep: sleep=22-8 or sleep=off
  if (!settings.sleepEnabled) {
    params.set('sleep', 'off');
  } else if (settings.sleepStartHour !== 22 || settings.sleepEndHour !== 8) {
    params.set('sleep', `${settings.sleepStartHour}-${settings.sleepEndHour}`);
  }

  const q = params.toString();
  return q ? `?${q}` : '';
}

// ─── Decode URL -> State (supports both modern & legacy formats) ─────────────

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

  // 1. Check for modern per-day parameters (mon, tue, wed, thu, fri, sat, sun)
  let foundModernDays = false;
  for (const [key, dayId] of Object.entries(DAY_3LETTER_MAP)) {
    const val = params.get(key);
    if (val) {
      schedule[dayId] = decodeHours(val);
      foundModernDays = true;
    }
  }

  // 2. Fallback: check legacy single param ?s=mo:14-16;tu:8
  if (!foundModernDays) {
    const sParam = params.get('s');
    if (sParam) {
      for (const part of sParam.split(';')) {
        const colonIdx = part.indexOf(':');
        if (colonIdx < 0) continue;
        const code = part.slice(0, colonIdx);
        const hoursStr = part.slice(colonIdx + 1);
        const day = LEGACY_DAY_CODES[code] || DAY_3LETTER_MAP[code];
        if (day) {
          schedule[day] = decodeHours(hoursStr);
        }
      }
    }
  }

  if (Object.keys(schedule).length > 0) {
    result.schedule = schedule;
  }

  // 3. Start day: modern ?start=thu or legacy ?d=thu / ?d=th
  const startParam = params.get('start') || params.get('d');
  if (startParam) {
    const mapped = DAY_3LETTER_MAP[startParam] || LEGACY_DAY_CODES[startParam];
    if (mapped) {
      result.settings = { ...result.settings, startDay: mapped };
    }
  }

  // 4. Timezones: modern ?tz=2_0 or legacy ?tz=2:0
  const tzParam = params.get('tz');
  if (tzParam) {
    const separatorIdx = tzParam.includes('_') ? tzParam.lastIndexOf('_') : tzParam.lastIndexOf(':');
    if (separatorIdx > 0) {
      const my = parseFloat(tzParam.slice(0, separatorIdx));
      const cl = parseFloat(tzParam.slice(separatorIdx + 1));
      if (!isNaN(my) && !isNaN(cl)) {
        result.settings = {
          ...result.settings,
          myTimezoneOffset: my,
          clientTimezoneOffset: cl,
        };
      }
    }
  }

  // 5. Sleep: modern ?sleep=22-8 / ?sleep=off or legacy ?sl=...
  const sleepParam = params.get('sleep') || params.get('sl');
  if (sleepParam === 'off') {
    result.settings = { ...result.settings, sleepEnabled: false };
  } else if (sleepParam) {
    const dash = sleepParam.indexOf('-');
    if (dash > 0) {
      const start = parseInt(sleepParam.slice(0, dash), 10);
      const end = parseInt(sleepParam.slice(dash + 1), 10);
      if (!isNaN(start) && !isNaN(end)) {
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
