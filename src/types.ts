export type DayOfWeek = 'thursday' | 'friday' | 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday';

export interface DayConfig {
  id: DayOfWeek;
  nameUk: string;
  shortUk: string;
  nameEn: string;
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
  persistSchedule: boolean; // default false: do not persist week schedule across browser restarts unless turned on
}

// Map from DayOfWeek to array of selected hour indices (0..23)
export type WeekSchedule = Record<DayOfWeek, number[]>;
