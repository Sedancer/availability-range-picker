import { describe, it, expect } from 'vitest';
import { encodeStateToURL, decodeURLState } from './urlState';
import type { AppSettings, WeekSchedule } from '../types';

const defaultSettings: AppSettings = {
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

const emptySchedule: WeekSchedule = {
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
};

describe('urlState', () => {
  it('encodes and decodes simple schedule with ranges and individual hours', () => {
    const schedule: WeekSchedule = {
      ...emptySchedule,
      monday: [8, 14, 15, 16, 18, 19],
      tuesday: [9],
      wednesday: [10, 11, 12],
    };

    const url = encodeStateToURL(schedule, defaultSettings);
    expect(url).toContain('s=');
    expect(url).toContain('d=th');

    const decoded = decodeURLState(url);
    expect(decoded.schedule?.monday).toEqual([8, 14, 15, 16, 18, 19]);
    expect(decoded.schedule?.tuesday).toEqual([9]);
    expect(decoded.schedule?.wednesday).toEqual([10, 11, 12]);
    expect(decoded.settings?.startDay).toBe('thursday');
  });

  it('handles negative and non-zero timezones', () => {
    const settings: AppSettings = {
      ...defaultSettings,
      myTimezoneOffset: -5,
      clientTimezoneOffset: 3,
    };

    const url = encodeStateToURL(emptySchedule, settings);
    expect(url).toContain('tz=-5%3A3'); // URLSearchParams encodes ':' as %3A

    const decoded = decodeURLState(url);
    expect(decoded.settings?.myTimezoneOffset).toBe(-5);
    expect(decoded.settings?.clientTimezoneOffset).toBe(3);
  });

  it('handles sleep settings encoding and decoding', () => {
    const settingsCustomSleep: AppSettings = {
      ...defaultSettings,
      sleepEnabled: true,
      sleepStartHour: 23,
      sleepEndHour: 7,
    };
    const url1 = encodeStateToURL(emptySchedule, settingsCustomSleep);
    expect(url1).toContain('sl=23-7');
    const decoded1 = decodeURLState(url1);
    expect(decoded1.settings?.sleepEnabled).toBe(true);
    expect(decoded1.settings?.sleepStartHour).toBe(23);
    expect(decoded1.settings?.sleepEndHour).toBe(7);

    const settingsSleepOff: AppSettings = {
      ...defaultSettings,
      sleepEnabled: false,
    };
    const url2 = encodeStateToURL(emptySchedule, settingsSleepOff);
    expect(url2).toContain('sl=off');
    const decoded2 = decodeURLState(url2);
    expect(decoded2.settings?.sleepEnabled).toBe(false);
  });

  it('handles empty or malformed search string gracefully', () => {
    expect(decodeURLState('')).toEqual({});
    expect(decodeURLState('?')).toEqual({});
    expect(decodeURLState('?garbage=123')).toEqual({});
    expect(decodeURLState('?s=invalid:format;xx:99')).toEqual({
      schedule: {},
    });
  });

  it('preserves start day', () => {
    const settings: AppSettings = {
      ...defaultSettings,
      startDay: 'monday',
    };
    const url = encodeStateToURL(emptySchedule, settings);
    expect(url).toContain('d=mo');
    const decoded = decodeURLState(url);
    expect(decoded.settings?.startDay).toBe('monday');
  });
});
