import type { DayConfig, DayOfWeek, AppSettings, WeekSchedule } from '../types';

export const ALL_DAYS: DayConfig[] = [
  { id: 'thursday', name: 'Thursday', shortName: 'Thu', isWeekend: false },
  { id: 'friday', name: 'Friday', shortName: 'Fri', isWeekend: false },
  { id: 'saturday', name: 'Saturday', shortName: 'Sat', isWeekend: true },
  { id: 'sunday', name: 'Sunday', shortName: 'Sun', isWeekend: true },
  { id: 'monday', name: 'Monday', shortName: 'Mon', isWeekend: false },
  { id: 'tuesday', name: 'Tuesday', shortName: 'Tue', isWeekend: false },
  { id: 'wednesday', name: 'Wednesday', shortName: 'Wed', isWeekend: false },
];

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
  startHour: number;
  endHour: number;
}

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

function normalizeHour(h: number): number {
  let normalized = h % 24;
  if (normalized < 0) normalized += 24;
  return Math.floor(normalized);
}

// Format: 14:17 without adding minutes, as requested
export function formatSlot(slot: TimeSlot, offsetDiff: number = 0): string {
  const clientStart = normalizeHour(slot.startHour + offsetDiff);
  const clientEnd = normalizeHour(slot.endHour + offsetDiff);
  return `${clientStart}:${clientEnd}`;
}

// Always 3 letters (Thu, Fri, Sat...) and always single line separated by pipe
export function generateAvailabilityString(
  schedule: WeekSchedule,
  settings: AppSettings
): string {
  const orderedDays = getOrderedDays(settings.startDay);
  const offsetDiff = settings.clientTimezoneOffset - settings.myTimezoneOffset;
  const hasTzDiff = offsetDiff !== 0;

  const parts: string[] = [];

  for (const day of orderedDays) {
    if (settings.disableWeekends && day.isWeekend) {
      parts.push(`${day.shortName}: —`);
      continue;
    }

    const hours = schedule[day.id] || [];
    const slots = groupConsecutiveHours(hours);

    let slotsText = '—';
    if (slots.length > 0) {
      if (hasTzDiff && settings.showBothTimezonesInOutput) {
        slotsText = slots
          .map((s) => `${formatSlot(s, 0)}(me)/${formatSlot(s, offsetDiff)}(cl)`)
          .join(', ');
      } else if (hasTzDiff) {
        slotsText = slots.map((s) => formatSlot(s, offsetDiff)).join(', ');
      } else {
        slotsText = slots.map((s) => formatSlot(s, 0)).join(', ');
      }
    }

    parts.push(`${day.shortName}: ${slotsText}`);
  }

  return parts.join(' | ');
}
