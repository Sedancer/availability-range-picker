import type { AppSettings, WeekSchedule } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  colorMode: 'dark',
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

export const EMPTY_SCHEDULE: WeekSchedule = {
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
};

export const PREFILLED_SCHEDULE: WeekSchedule = {
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
};

export const SCHEDULE_STORAGE_KEY = 'timeslotter_schedule_v1';
