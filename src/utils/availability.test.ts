import { describe, it, expect } from 'vitest';
import {
  groupConsecutiveHours,
  formatSlot,
  generateAvailabilityString,
  getOrderedDays,
  isSleepHour,
} from './availability';
import type { AppSettings, WeekSchedule } from '../types';

describe('Availability Logic & Timezones', () => {
  it('groups consecutive hours correctly', () => {
    expect(groupConsecutiveHours([])).toEqual([]);
    expect(groupConsecutiveHours([8])).toEqual([{ startHour: 8, endHour: 9 }]);
    expect(groupConsecutiveHours([14, 15, 16])).toEqual([{ startHour: 14, endHour: 17 }]);
    expect(groupConsecutiveHours([14, 15, 16, 18, 19])).toEqual([
      { startHour: 14, endHour: 17 },
      { startHour: 18, endHour: 20 },
    ]);
  });

  it('formats slots without time difference (offset = 0)', () => {
    const slot = { startHour: 14, endHour: 17 };
    expect(formatSlot(slot, 0)).toBe('14-17');
  });

  it('formats slots with client timezone offset (+2 hours)', () => {
    const slot = { startHour: 14, endHour: 17 };
    expect(formatSlot(slot, 2)).toBe('16-19');
  });

  it('formats slots with client timezone offset (-5 hours)', () => {
    const slot = { startHour: 14, endHour: 17 };
    expect(formatSlot(slot, -5)).toBe('9-12');
  });

  it('handles midnight wrap-around safely', () => {
    const eveningSlot = { startHour: 22, endHour: 24 }; // 22:00 to 24:00 (midnight)
    // +3 hours client offset -> 22+3=25 (01:00), 24+3=27 (03:00)
    expect(formatSlot(eveningSlot, 3)).toBe('1-3');
  });

  it('correctly filters sleep hours', () => {
    // Sleep from 22:00 to 08:00
    expect(isSleepHour(23, 22, 8)).toBe(true);
    expect(isSleepHour(3, 22, 8)).toBe(true);
    expect(isSleepHour(7, 22, 8)).toBe(true);
    expect(isSleepHour(8, 22, 8)).toBe(false);
    expect(isSleepHour(14, 22, 8)).toBe(false);
    expect(isSleepHour(21, 22, 8)).toBe(false);
  });

  it('orders 7 days starting from specified startDay', () => {
    const daysThu = getOrderedDays('thursday');
    expect(daysThu.map((d) => d.shortName)).toEqual(['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed']);

    const daysMon = getOrderedDays('monday');
    expect(daysMon.map((d) => d.shortName)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('generates availability string matching expected semicolon & hyphen format', () => {
    const settings: AppSettings = {
      startDay: 'thursday',
      myTimezoneOffset: 0,
      clientTimezoneOffset: 0,
      sleepEnabled: true,
      sleepStartHour: 22,
      sleepEndHour: 8,
      showBothTimezonesInOutput: false,
      persistSchedule: false,
      disableWeekends: false,
    };

    const schedule: WeekSchedule = {
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
      monday: [14, 15, 16, 18, 19],
      tuesday: [8],
      wednesday: [10, 11, 12, 13, 14, 15],
    };

    const result = generateAvailabilityString(schedule, settings);
    expect(result).toBe('Thu: —; Fri: —; Sat: —; Sun: —; Mon: 14-17, 18-20; Tue: 8-9; Wed: 10-16');
  });

  it('replaces weekends with dash when disableWeekends is true', () => {
    const settings: AppSettings = {
      startDay: 'thursday',
      myTimezoneOffset: 0,
      clientTimezoneOffset: 0,
      sleepEnabled: true,
      sleepStartHour: 22,
      sleepEndHour: 8,
      showBothTimezonesInOutput: false,
      persistSchedule: false,
      disableWeekends: true,
    };

    const schedule: WeekSchedule = {
      thursday: [],
      friday: [],
      saturday: [10, 11], // should be ignored
      sunday: [12, 13],   // should be ignored
      monday: [14, 15, 16],
      tuesday: [],
      wednesday: [],
    };

    const result = generateAvailabilityString(schedule, settings);
    expect(result).toContain('Sat: —');
    expect(result).toContain('Sun: —');
    expect(result).toContain('Mon: 14-17');
  });
});
