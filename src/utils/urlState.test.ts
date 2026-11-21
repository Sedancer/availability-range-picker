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

describe('urlState clean human-readable format', () => {
  it('encodes days into separate clean parameters without %-escaping', () => {
    const schedule: WeekSchedule = {
      ...emptySchedule,
      monday: [14, 15, 16, 18, 19],
      tuesday: [8],
      wednesday: [10, 11, 12, 13, 14, 15],
    };

    const url = encodeStateToURL(schedule, defaultSettings);
    // Should NOT contain %3A, %2C, or %3B
    expect(url).not.toContain('%3A');
    expect(url).not.toContain('%2C');
    expect(url).not.toContain('%3B');

    // Should contain clean per-day parameters
    expect(url).toContain('mon=14-16_18-19');
    expect(url).toContain('tue=8');
    expect(url).toContain('wed=10-15');
    expect(url).toContain('start=thu');

    const decoded = decodeURLState(url);
    expect(decoded.schedule?.monday).toEqual([14, 15, 16, 18, 19]);
    expect(decoded.schedule?.tuesday).toEqual([8]);
    expect(decoded.schedule?.wednesday).toEqual([10, 11, 12, 13, 14, 15]);
    expect(decoded.settings?.startDay).toBe('thursday');
  });

  it('encodes timezone safely using underscore without %3A', () => {
    const settings: AppSettings = {
      ...defaultSettings,
      myTimezoneOffset: -5,
      clientTimezoneOffset: 3,
    };

    const url = encodeStateToURL(emptySchedule, settings);
    expect(url).toContain('tz=-5_3');
    expect(url).not.toContain('%3A');

    const decoded = decodeURLState(url);
    expect(decoded.settings?.myTimezoneOffset).toBe(-5);
    expect(decoded.settings?.clientTimezoneOffset).toBe(3);
  });

  it('encodes sleep settings cleanly', () => {
    const settingsCustomSleep: AppSettings = {
      ...defaultSettings,
      sleepEnabled: true,
      sleepStartHour: 23,
      sleepEndHour: 7,
    };
    const url1 = encodeStateToURL(emptySchedule, settingsCustomSleep);
    expect(url1).toContain('sleep=23-7');
    const decoded1 = decodeURLState(url1);
    expect(decoded1.settings?.sleepEnabled).toBe(true);
    expect(decoded1.settings?.sleepStartHour).toBe(23);
    expect(decoded1.settings?.sleepEndHour).toBe(7);

    const settingsSleepOff: AppSettings = {
      ...defaultSettings,
      sleepEnabled: false,
    };
    const url2 = encodeStateToURL(emptySchedule, settingsSleepOff);
    expect(url2).toContain('sleep=off');
    const decoded2 = decodeURLState(url2);
    expect(decoded2.settings?.sleepEnabled).toBe(false);
  });

  it('backward compatibility: decodes legacy URL with ?s=mo:...;...&d=mo&tz=2:0', () => {
    const legacyUrl = '?s=mo:14-16,18-19;tu:8;we:10-15&d=mo&tz=2:0&sl=23-7';
    const decoded = decodeURLState(legacyUrl);

    expect(decoded.schedule?.monday).toEqual([14, 15, 16, 18, 19]);
    expect(decoded.schedule?.tuesday).toEqual([8]);
    expect(decoded.schedule?.wednesday).toEqual([10, 11, 12, 13, 14, 15]);
    expect(decoded.settings?.startDay).toBe('monday');
    expect(decoded.settings?.myTimezoneOffset).toBe(2);
    expect(decoded.settings?.clientTimezoneOffset).toBe(0);
    expect(decoded.settings?.sleepStartHour).toBe(23);
    expect(decoded.settings?.sleepEndHour).toBe(7);
  });

  it('handles empty or malformed search string gracefully', () => {
    expect(decodeURLState('')).toEqual({});
    expect(decodeURLState('?')).toEqual({});
    expect(decodeURLState('?unknown=123')).toEqual({});
  });
});
