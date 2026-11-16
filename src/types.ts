export type DayOfWeek = 'thursday' | 'friday' | 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday';

export interface DayConfig {
  id: DayOfWeek;
  name: string;
  shortName: string;
  isWeekend: boolean;
}

export interface AppSettings {
  startDay: DayOfWeek;
  myTimezoneOffset: number; // e.g., 0 for UTC+0, 2 for UTC+2, -5 for UTC-5
  clientTimezoneOffset: number;
  sleepEnabled: boolean;
  sleepStartHour: number; // e.g. 22 (22:00)
  sleepEndHour: number;   // e.g. 8 (08:00)
  showBothTimezonesInOutput: boolean;
  persistSchedule: boolean;
  disableWeekends: boolean; // when true, Saturday & Sunday are dimmed, non-interactive and marked as '—'
}

// Map from DayOfWeek to array of selected hour indices (0..23)
export type WeekSchedule = Record<DayOfWeek, number[]>;
