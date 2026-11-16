import type { DayConfig, DayOfWeek, AppSettings, WeekSchedule } from '../types';

export const ALL_DAYS: DayConfig[] = [
  { id: 'thursday', nameUk: 'Четвер', shortUk: 'Чт', nameEn: 'Thursday', isWeekend: false },
  { id: 'friday', nameUk: "П'ятниця", shortUk: 'Пт', nameEn: 'Friday', isWeekend: false },
  { id: 'saturday', nameUk: 'Субота', shortUk: 'Сб', nameEn: 'Saturday', isWeekend: true },
  { id: 'sunday', nameUk: 'Неділя', shortUk: 'Нд', nameEn: 'Sunday', isWeekend: true },
  { id: 'monday', nameUk: 'Понеділок', shortUk: 'Пн', nameEn: 'Monday', isWeekend: false },
  { id: 'tuesday', nameUk: 'Вівторок', shortUk: 'Вт', nameEn: 'Tuesday', isWeekend: false },
  { id: 'wednesday', nameUk: 'Середа', shortUk: 'Ср', nameEn: 'Wednesday', isWeekend: false },
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
    const hours = schedule[day.id] || [];
    const slots = groupConsecutiveHours(hours);

    let slotsText = '—';
    if (slots.length > 0) {
      if (hasTzDiff && settings.showBothTimezonesInOutput) {
        slotsText = slots
          .map((s) => `${formatSlot(s, 0)} (мій) / ${formatSlot(s, offsetDiff)} (клієнт)`)
          .join(', ');
      } else if (hasTzDiff) {
        slotsText = slots.map((s) => formatSlot(s, offsetDiff)).join(', ');
      } else {
        slotsText = slots.map((s) => formatSlot(s, 0)).join(', ');
      }
    }

    if (format === 'multiline') {
      lines.push(`${day.nameUk}: ${slotsText}`);
    } else if (format === 'singleline') {
      lines.push(`${day.shortUk}: ${slotsText}`);
    } else {
      lines.push(`${day.shortUk}: ${slotsText}`);
    }
  }

  if (format === 'singleline') {
    return lines.join(' | ');
  }

  return lines.join('\n');
}
