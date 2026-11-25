import { describe, expect, it } from 'vitest';
import { sanitizeSchedule, sanitizeSettings } from './stateValidation';

describe('state validation', () => {
  it('restores invalid settings fields to safe defaults and ignores unknown fields', () => {
    const settings = sanitizeSettings({
      colorMode: 'neon',
      startDay: 'funday',
      myTimezoneOffset: 99,
      sleepStartHour: 24,
      persistSchedule: 'yes',
      unexpected: 'value',
    });

    expect(settings.colorMode).toBe('dark');
    expect(settings.startDay).toBe('thursday');
    expect(settings.myTimezoneOffset).toBe(0);
    expect(settings.sleepStartHour).toBe(22);
    expect(settings.persistSchedule).toBe(false);
    expect('unexpected' in settings).toBe(false);
  });

  it('keeps only unique integer hours within the supported range', () => {
    const schedule = sanitizeSchedule({
      monday: [1, 1, 3.5, -1, 24, 23, '8'],
      extraDay: [8],
    });

    expect(schedule.monday).toEqual([1, 23]);
    expect(schedule.tuesday).toEqual([]);
    expect(Object.keys(schedule)).toHaveLength(7);
  });
});
