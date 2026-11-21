import type { DayOfWeek, WeekSchedule } from '../types';

const DAY_PREFIX_MAP: Record<string, DayOfWeek> = {
  mon: 'monday',
  monday: 'monday',
  mo: 'monday',
  tue: 'tuesday',
  tues: 'tuesday',
  tuesday: 'tuesday',
  tu: 'tuesday',
  wed: 'wednesday',
  wednesday: 'wednesday',
  we: 'wednesday',
  thu: 'thursday',
  thur: 'thursday',
  thurs: 'thursday',
  thursday: 'thursday',
  th: 'thursday',
  fri: 'friday',
  friday: 'friday',
  fr: 'friday',
  sat: 'saturday',
  saturday: 'saturday',
  sa: 'saturday',
  sun: 'sunday',
  sunday: 'sunday',
  su: 'sunday',
};

/**
 * Parses an availability string into a WeekSchedule.
 * Supports formats such as:
 *   "Fri: 10-13, 15-18; Sat: 10-13; Sun: 22-24; Mon: -; Tue: -; Wed: 8-10; Thu: 17-22;"
 *   "Mon: 14-17, 18-20; Tue: 8-9; Wed: 10-16"
 *   "Monday: 9-17"
 * Handles ranges (10-13 -> hours 10, 11, 12) and single hours (8 -> hour 8).
 */
export function parseAvailabilityString(
  text: string,
  baseSchedule?: WeekSchedule
): WeekSchedule {
  const result: WeekSchedule = baseSchedule
    ? { ...baseSchedule }
    : {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      };

  if (!text || typeof text !== 'string') return result;

  // Split into day entries separated by semicolon or newline
  const entries = text
    .split(/[;\n]/)
    .map((e) => e.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx === -1) continue;

    const rawDay = entry.slice(0, colonIdx).trim().toLowerCase();
    const rawHours = entry.slice(colonIdx + 1).trim();

    const dayId = DAY_PREFIX_MAP[rawDay];
    if (!dayId) continue;

    // Check if day is explicitly empty: "-", "—", "none", "off", "empty"
    if (
      !rawHours ||
      rawHours === '-' ||
      rawHours === '—' ||
      rawHours.toLowerCase() === 'none' ||
      rawHours.toLowerCase() === 'off'
    ) {
      result[dayId] = [];
      continue;
    }

    const dayHours: number[] = [];
    // Split slots by comma or space
    const slots = rawHours
      .split(/[,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const slot of slots) {
      const dashIdx = slot.indexOf('-');
      if (dashIdx > 0) {
        const start = parseInt(slot.slice(0, dashIdx).trim(), 10);
        const end = parseInt(slot.slice(dashIdx + 1).trim(), 10);

        if (!isNaN(start) && !isNaN(end) && start < end) {
          // Half-open interval [start, end) e.g. 10-13 means hours 10, 11, 12
          const maxEnd = Math.min(end, 24);
          for (let h = Math.max(0, start); h < maxEnd; h++) {
            dayHours.push(h);
          }
        }
      } else {
        const single = parseInt(slot, 10);
        if (!isNaN(single) && single >= 0 && single < 24) {
          dayHours.push(single);
        }
      }
    }

    result[dayId] = Array.from(new Set(dayHours)).sort((a, b) => a - b);
  }

  return result;
}
