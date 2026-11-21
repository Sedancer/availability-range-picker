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
  it('groups consecutive hours correctly and handles midnight (24)', () => {
    expect(groupConsecutiveHours([])).toEqual([]);
    expect(groupConsecutiveHours([8])).toEqual([{ startHour: 8, endHour: 9 }]);
    expect(groupConsecutiveHours([14, 15, 16])).toEqual([{ startHour: 14, endHour: 17 }]);
    expect(groupConsecutiveHours([14, 15, 16, 18, 19])).toEqual([
      { startHour: 14, endHour: 17 },
      { startHour: 18, endHour: 20 },
    ]);
    // 22:00 to 24:00 (midnight)
    expect(groupConsecutiveHours([22, 23])).toEqual([{ startHour: 22, endHour: 24 }]);
  });

  it('formats slots with startHour < endHour strictly', () => {
    expect(formatSlot({ startHour: 10, endHour: 13 })).toBe('10-13');
    expect(formatSlot({ startHour: 22, endHour: 24 })).toBe('22-24');
    expect(formatSlot({ startHour: 0, endHour: 3 })).toBe('0-3');
    expect(formatSlot({ startHour: 8, endHour: 9 })).toBe('8-9');
  });

  it('correctly filters sleep hours', () => {
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

    const daysFri = getOrderedDays('friday');
    expect(daysFri.map((d) => d.shortName)).toEqual(['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']);

    const daysMon = getOrderedDays('monday');
    expect(daysMon.map((d) => d.shortName)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('matches user exact target example output syntax', () => {
    const settings: AppSettings = {
      startDay: 'friday',
      myTimezoneOffset: 0,
      clientTimezoneOffset: 0,
      sleepEnabled: true,
      sleepStartHour: 22,
      sleepEndHour: 8,
      showBothTimezonesInOutput: false,
      persistSchedule: false,
      disableWeekends: false,
    };

    // Construct schedule matching:
    // Fri: 10-13, 15-18; Sat: 10-13; Sun: 22-24; Mon: -; Tue: -; Wed: 8-10; Thu: 17-22;
    const schedule: WeekSchedule = {
      friday: [10, 11, 12, 15, 16, 17],
      saturday: [10, 11, 12],
      sunday: [22, 23],
      monday: [],
      tuesday: [],
      wednesday: [8, 9],
      thursday: [17, 18, 19, 20, 21],
    };

    const result = generateAvailabilityString(schedule, settings);
    expect(result).toBe(
      'Fri: 10-13, 15-18; Sat: 10-13; Sun: 22-24; Mon: -; Tue: -; Wed: 8-10; Thu: 17-22;'
    );
  });

  it('shifts schedule across midnight safely without backward ranges (no Fri: 17-6)', () => {
    const settings: AppSettings = {
      startDay: 'friday',
      myTimezoneOffset: 0,
      clientTimezoneOffset: 6, // Client is +6 hours ahead
      sleepEnabled: true,
      sleepStartHour: 22,
      sleepEndHour: 8,
      showBothTimezonesInOutput: false,
      persistSchedule: false,
      disableWeekends: false,
    };

    // User selects Friday 11:00 to 24:00 (hours 11..23)
    // In old code this produced Fri: 17-6 (INVALID!)
    // Now:
    // Friday 11..17 + 6h = 17..23 (Friday 17-24)
    // Friday 18..23 + 6h = 0..5 (Saturday 0-6)
    const schedule: WeekSchedule = {
      friday: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      saturday: [],
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
    };

    const result = generateAvailabilityString(schedule, settings);
    expect(result).toContain('Fri: 17-24;');
    expect(result).toContain('Sat: 0-6;');
    expect(result).not.toContain('17-6');

    // Verify all ranges have start < end
    const ranges = result.match(/\d+-\d+/g) || [];
    expect(ranges.length).toBeGreaterThan(0);
    for (const r of ranges) {
      const [start, end] = r.split('-').map(Number);
      expect(start).toBeLessThan(end);
    }
  });

  it('handles negative timezone offset shifting into previous day', () => {
    const settings: AppSettings = {
      startDay: 'friday',
      myTimezoneOffset: 3,
      clientTimezoneOffset: 0, // Client is -3 hours behind
      sleepEnabled: true,
      sleepStartHour: 22,
      sleepEndHour: 8,
      showBothTimezonesInOutput: false,
      persistSchedule: false,
      disableWeekends: false,
    };

    // User selects Friday 00:00 - 03:00 (hours 0, 1, 2)
    // With -3h, this shifts to Thursday 21:00 - 24:00
    const schedule: WeekSchedule = {
      friday: [0, 1, 2],
      saturday: [],
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
    };

    const result = generateAvailabilityString(schedule, settings);
    expect(result).toContain('Fri: -;');
    expect(result).toContain('Thu: 21-24;');
  });

  it('replaces weekends with -; when disableWeekends is true', () => {
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
      saturday: [10, 11],
      sunday: [12, 13],
      monday: [14, 15, 16],
      tuesday: [],
      wednesday: [],
    };

    const result = generateAvailabilityString(schedule, settings);
    expect(result).toContain('Sat: -;');
    expect(result).toContain('Sun: -;');
    expect(result).toContain('Mon: 14-17;');
  });
});
