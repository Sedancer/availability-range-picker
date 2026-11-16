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
    // e.g. 22:00 to 08:00 -> hours >= 22 or hours < 8
    return hour >= sleepStart || hour < sleepEnd;
  } else {
    // e.g. 01:00 to 07:00 -> hours >= 1 and hours < 7
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

function formatHour(h: number): string {
  let normalized = h % 24;
  if (normalized < 0) normalized += 24;
  return `${String(Math.floor(normalized)).padStart(2, '0')}:00`;
}

export function formatSlot(slot: TimeSlot, offsetDiff: number = 0): string {
  const clientStart = slot.startHour + offsetDiff;
  const clientEnd = slot.endHour + offsetDiff;
  return `${formatHour(clientStart)} - ${formatHour(clientEnd)}`;
}

export type OutputFormatType = 'multiline' | 'singleline' | 'simple';

export function generateAvailabilityString(
  schedule: WeekSchedule,
  settings: AppSettings,
  format: OutputFormatType = 'multiline'
): string {
  const orderedDays = getOrderedDays(settings.startDay);
  const offsetDiff = settings.clientTimezoneOffset - settings.myTimezoneOffset;
  const hasTzDiff = offsetDiff !== 0;

  const lines: string[] = [];

  for (const day of orderedDays) {
    // If weekends are disabled, always output dash '—'
    if (settings.disableWeekends && day.isWeekend) {
      if (format === 'singleline') {
        lines.push(`${day.shortName}: —`);
      } else {
        lines.push(`${day.name}: —`);
      }
      continue;
    }

    const hours = schedule[day.id] || [];
    const slots = groupConsecutiveHours(hours);

    let slotsText = '—';
    if (slots.length > 0) {
      if (hasTzDiff && settings.showBothTimezonesInOutput) {
        slotsText = slots
          .map((s) => `${formatSlot(s, 0)} (me) / ${formatSlot(s, offsetDiff)} (client)`)
          .join(', ');
      } else if (hasTzDiff) {
        slotsText = slots.map((s) => formatSlot(s, offsetDiff)).join(', ');
      } else {
        slotsText = slots.map((s) => formatSlot(s, 0)).join(', ');
      }
    }

    if (format === 'multiline') {
      lines.push(`${day.name}: ${slotsText}`);
    } else if (format === 'singleline') {
      lines.push(`${day.shortName}: ${slotsText}`);
    } else {
      lines.push(`${day.shortName}: ${slotsText}`);
    }
  }

  if (format === 'singleline') {
    return lines.join(' | ');
  }

  return lines.join('\n');
}
