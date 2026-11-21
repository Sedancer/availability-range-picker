import type { DayConfig, DayOfWeek, AppSettings, WeekSchedule } from '../types';

// Natural calendar week starting from Monday for selection lists
export const ALL_DAYS: DayConfig[] = [
  { id: 'monday', name: 'Monday', shortName: 'Mon', isWeekend: false },
  { id: 'tuesday', name: 'Tuesday', shortName: 'Tue', isWeekend: false },
  { id: 'wednesday', name: 'Wednesday', shortName: 'Wed', isWeekend: false },
  { id: 'thursday', name: 'Thursday', shortName: 'Thu', isWeekend: false },
  { id: 'friday', name: 'Friday', shortName: 'Fri', isWeekend: false },
  { id: 'saturday', name: 'Saturday', shortName: 'Sat', isWeekend: true },
  { id: 'sunday', name: 'Sunday', shortName: 'Sun', isWeekend: true },
];

// Returns 7 days starting from whatever startDay is configured (defaults to Thursday)
export function getOrderedDays(startDay: DayOfWeek): DayConfig[] {
  const startIndex = ALL_DAYS.findIndex((d) => d.id === startDay);
  if (startIndex === -1) return ALL_DAYS;
  return [...ALL_DAYS.slice(startIndex), ...ALL_DAYS.slice(0, startIndex)];
}

export function isSleepHour(hour: number, sleepStart: number, sleepEnd: number): boolean {
  if (sleepStart === sleepEnd) return false;
  if (sleepStart > sleepEnd) {
    return hour >= sleepStart || hour < sleepEnd;
  } else {
    return hour >= sleepStart && hour < sleepEnd;
  }
}

export interface TimeSlot {
  startHour: number; // 0..23
  endHour: number;   // 1..24 (startHour < endHour always)
}

/**
 * Groups sorted array of selected hours into consecutive half-open slots [startHour, endHour).
 * E.g. [10, 11, 12] -> [{ startHour: 10, endHour: 13 }]
 *      [22, 23]     -> [{ startHour: 22, endHour: 24 }]
 */
export function groupConsecutiveHours(hours: number[]): TimeSlot[] {
  if (!hours || hours.length === 0) return [];
  const sorted = Array.from(new Set(hours)).sort((a, b) => a - b);
  const slots: TimeSlot[] = [];

  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      slots.push({ startHour: start, endHour: prev + 1 });
      start = current;
      prev = current;
    }
  }
  slots.push({ startHour: start, endHour: prev + 1 });
  return slots;
}

/**
 * Format: 8-9, 14-17, 22-24 (start is always strictly less than end)
 */
export function formatSlot(slot: TimeSlot, offsetDiff: number = 0): string {
  if (offsetDiff === 0) {
    return `${slot.startHour}-${slot.endHour}`;
  }
  // Safe fallback if called directly with offset
  let start = (slot.startHour + offsetDiff) % 24;
  if (start < 0) start += 24;
  let end = slot.endHour + offsetDiff;
  let normEnd = end % 24;
  if (normEnd < 0) normEnd += 24;
  if (normEnd === 0) normEnd = 24;
  if (normEnd <= start) {
    normEnd = 24;
  }
  return `${start}-${normEnd}`;
}

/**
 * Shifts selected hours to the client timezone across the 7-day cyclical week (168 hours).
 * This guarantees hours crossing midnight shift to the next or previous day,
 * so slots within any single day never wrap backwards (start is always < end).
 */
export function shiftScheduleToClientTimezone(
  schedule: WeekSchedule,
  orderedDays: DayConfig[],
  offsetDiff: number
): Record<DayOfWeek, number[]> {
  const result: Record<DayOfWeek, number[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  if (offsetDiff === 0) {
    for (const day of orderedDays) {
      result[day.id] = [...(schedule[day.id] || [])].sort((a, b) => a - b);
    }
    return result;
  }

  // 168 hours in a 7-day week
  for (let i = 0; i < orderedDays.length; i++) {
    const day = orderedDays[i];
    const hours = schedule[day.id] || [];

    for (const h of hours) {
      const totalHour = i * 24 + h + offsetDiff;
      const normalizedTotal = ((totalHour % 168) + 168) % 168;
      const targetDayIndex = Math.floor(normalizedTotal / 24);
      const targetHour = normalizedTotal % 24;

      const targetDay = orderedDays[targetDayIndex];
      if (targetDay) {
        result[targetDay.id].push(targetHour);
      }
    }
  }

  for (const day of ALL_DAYS) {
    result[day.id] = Array.from(new Set(result[day.id])).sort((a, b) => a - b);
  }

  return result;
}

/**
 * Generates availability string matching the exact client format:
 *   Fri: 10-13, 15-18; Sat: 10-13; Sun: 22-24; Mon: -; Tue: -; Wed: 8-10; Thu: 17-22;
 *
 * Rules:
 *   - Each day ends with semicolon `;`
 *   - Days separated by space
 *   - Trailing semicolon after the last day
 *   - Empty days are `-;` (ASCII hyphen, not em-dash)
 *   - Multiple ranges separated by comma and space `, `
 *   - Slots reaching midnight end at `24` (e.g. `22-24;`)
 *   - Start time is ALWAYS strictly less than end time (`start < end`)
 */
export function generateAvailabilityString(
  schedule: WeekSchedule,
  settings: AppSettings
): string {
  const orderedDays = getOrderedDays(settings.startDay);
  const offsetDiff = settings.clientTimezoneOffset - settings.myTimezoneOffset;

  // Convert user's schedule to client's timezone across the week
  const clientSchedule = shiftScheduleToClientTimezone(schedule, orderedDays, offsetDiff);

  const parts: string[] = [];

  for (const day of orderedDays) {
    if (settings.disableWeekends && day.isWeekend) {
      parts.push(`${day.shortName}: -;`);
      continue;
    }

    const hours = clientSchedule[day.id] || [];
    const slots = groupConsecutiveHours(hours);

    if (slots.length > 0) {
      const slotsText = slots.map((s) => formatSlot(s)).join(', ');
      parts.push(`${day.shortName}: ${slotsText};`);
    } else {
      parts.push(`${day.shortName}: -;`);
    }
  }

  return parts.join(' ');
}
