import { describe, it, expect } from 'vitest';
import { parseAvailabilityString } from './availabilityParser';
import { generateAvailabilityString } from './availability';
import type { AppSettings } from '../types';

describe('parseAvailabilityString', () => {
  it('parses standard availability string accurately', () => {
    const input = 'Fri: 10-13, 15-18; Sat: 10-13; Sun: 22-24; Mon: -; Tue: -; Wed: 8-10; Thu: 17-22;';
    const schedule = parseAvailabilityString(input);

    expect(schedule.friday).toEqual([10, 11, 12, 15, 16, 17]);
    expect(schedule.saturday).toEqual([10, 11, 12]);
    expect(schedule.sunday).toEqual([22, 23]);
    expect(schedule.monday).toEqual([]);
    expect(schedule.tuesday).toEqual([]);
    expect(schedule.wednesday).toEqual([8, 9]);
    expect(schedule.thursday).toEqual([17, 18, 19, 20, 21]);
  });

  it('perfectly round-trips with generateAvailabilityString at offset 0', () => {
    const original = 'Fri: 10-13, 15-18; Sat: 10-13; Sun: 22-24; Mon: -; Tue: -; Wed: 8-10; Thu: 17-22;';
    const schedule = parseAvailabilityString(original);

    const settings: AppSettings = {
      startDay: 'friday',
      myTimezoneOffset: 0,
      clientTimezoneOffset: 0,
      sleepEnabled: false,
      sleepStartHour: 22,
      sleepEndHour: 8,
      showBothTimezonesInOutput: false,
      persistSchedule: false,
      disableWeekends: false,
    };

    const generated = generateAvailabilityString(schedule, settings);
    expect(generated).toBe(original);
  });

  it('handles variations: full day names, whitespace, single hours', () => {
    const input = 'Monday: 9, 14-16; Tuesday: 10-12';
    const schedule = parseAvailabilityString(input);

    expect(schedule.monday).toEqual([9, 14, 15]);
    expect(schedule.tuesday).toEqual([10, 11]);
  });

  it('handles em-dash and empty values gracefully', () => {
    const input = 'Mon: —; Tue: none; Wed: off; Thu: 12-14';
    const schedule = parseAvailabilityString(input);

    expect(schedule.monday).toEqual([]);
    expect(schedule.tuesday).toEqual([]);
    expect(schedule.wednesday).toEqual([]);
    expect(schedule.thursday).toEqual([12, 13]);
  });

  it('ignores partially typed numeric values instead of parsing their numeric prefix', () => {
    const schedule = parseAvailabilityString('Mon: 8x, 10-12x, 14 - 16');
    expect(schedule.monday).toEqual([14, 15]);
  });

  it('accepts whitespace-separated hours and ranges', () => {
    const schedule = parseAvailabilityString('Tue: 8 10 - 12, 14');
    expect(schedule.tuesday).toEqual([8, 10, 11, 14]);
  });
});
