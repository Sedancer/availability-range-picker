/**
 * URL State persistence for TimeSlotter.
 *
 * URL format example:
 *   ?s=mo:8,10-12;we:14-16&d=thu&tz=2:0&sl=22-8
 *
 * Parameters:
 *   s   – schedule: semicolon-separated day:hours pairs
 *           hours use commas between ranges, hyphens for consecutive groups
 *           e.g. mo:8,14-16,18-19
 *   d   – startDay: 2-letter code (mo/tu/we/th/fr/sa/su)
 *   tz  – myOffset:clientOffset  e.g. "2:0", "-5:3"
 *   sl  – sleep: "22-8" or "off"
 */

import type { AppSettings, DayOfWeek, WeekSchedule } from '../types';

// 2-letter day codes  ↔  DayOfWeek
const DAY_CODES: Record<string, DayOfWeek> = {
  mo: 'monday',
  tu: 'tuesday',
  we: 'wednesday',
  th: 'thursday',
  fr: 'friday',
  sa: 'saturday',
  su: 'sunday',
};
const DAY_TO_CODE: Record<DayOfWeek, string> = Object.fromEntries(
  Object.entries(DAY_CODES).map(([k, v]) => [v, k])
) as Record<DayOfWeek, string>;

const ALL_DAYS: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

// ─── Encode helpers ──────────────────────────────────────────────────────────

/** Encode a sorted number[] into compact ranges: [8,9,10,14,15] → "8-10,14-15" */
function encodeHours(hours: number[]): string {
  if (!hours || hours.length === 0) return '';
  const sorted = [...new Set(hours)].sort((a, b) => a - b);
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
  return ranges.join(',');
}

/** Decode "8-10,14-15" → [8,9,10,14,15] */
function decodeHours(str: string): number[] {
  if (!str) return [];
  const hours: number[] = [];
  for (const part of str.split(',')) {
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
  return hours;
}

// ─── Encode full state → URL search string ───────────────────────────────────

export function encodeStateToURL(
  schedule: WeekSchedule,
  settings: AppSettings
): string {
  const params = new URLSearchParams();

  // Schedule: only days that have selected hours
  const scheduleParts: string[] = [];
  for (const day of ALL_DAYS) {
    const hours = schedule[day];
    if (hours && hours.length > 0) {
      scheduleParts.push(`${DAY_TO_CODE[day]}:${encodeHours(hours)}`);
    }
  }
  if (scheduleParts.length > 0) {
    params.set('s', scheduleParts.join(';'));
  }

  // Start day
  params.set('d', DAY_TO_CODE[settings.startDay]);

  // Timezones (always store both — a shared link needs TZ context)
  const myTz = settings.myTimezoneOffset;
  const clTz = settings.clientTimezoneOffset;
  if (myTz !== 0 || clTz !== 0) {
    params.set('tz', `${myTz}:${clTz}`);
  }

  // Sleep
  if (!settings.sleepEnabled) {
    params.set('sl', 'off');
  } else if (settings.sleepStartHour !== 22 || settings.sleepEndHour !== 8) {
    params.set('sl', `${settings.sleepStartHour}-${settings.sleepEndHour}`);
  }

  const q = params.toString();
  return q ? `?${q}` : '';
}

// ─── Decode URL search string → partial state ────────────────────────────────

export interface ParsedURLState {
  schedule?: Partial<WeekSchedule>;
  settings?: Partial<AppSettings>;
}

export function decodeURLState(search: string): ParsedURLState {
  if (!search || search === '?') return {};
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const result: ParsedURLState = {};

  // Schedule
  const sParam = params.get('s');
  if (sParam) {
    const schedule: Partial<WeekSchedule> = {};
    for (const part of sParam.split(';')) {
      const colonIdx = part.indexOf(':');
      if (colonIdx < 0) continue;
      const code = part.slice(0, colonIdx);
      const hoursStr = part.slice(colonIdx + 1);
      const day = DAY_CODES[code];
      if (day) {
        schedule[day] = decodeHours(hoursStr);
      }
    }
    result.schedule = schedule;
  }

  // Start day
  const dParam = params.get('d');
  if (dParam && DAY_CODES[dParam]) {
    result.settings = { ...result.settings, startDay: DAY_CODES[dParam] };
  }

  // Timezones
  const tzParam = params.get('tz');
  if (tzParam) {
    const colonIdx = tzParam.lastIndexOf(':');
    if (colonIdx > 0) {
      const my = parseFloat(tzParam.slice(0, colonIdx));
      const cl = parseFloat(tzParam.slice(colonIdx + 1));
      if (!isNaN(my) && !isNaN(cl)) {
        result.settings = { ...result.settings, myTimezoneOffset: my, clientTimezoneOffset: cl };
      }
    }
  }

  // Sleep
  const slParam = params.get('sl');
  if (slParam === 'off') {
    result.settings = { ...result.settings, sleepEnabled: false };
  } else if (slParam) {
    const dash = slParam.indexOf('-');
    if (dash > 0) {
      const start = parseInt(slParam.slice(0, dash), 10);
      const end = parseInt(slParam.slice(dash + 1), 10);
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

/** Push state into URL without page reload */
export function pushStateToURL(schedule: WeekSchedule, settings: AppSettings): void {
  const q = encodeStateToURL(schedule, settings);
  const newURL = `${window.location.pathname}${q}`;
  if (window.location.search !== (q || '')) {
    window.history.replaceState(null, '', newURL);
  }
}
