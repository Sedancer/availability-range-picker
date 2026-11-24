import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  DEFAULT_SETTINGS,
  EMPTY_SCHEDULE,
  PREFILLED_SCHEDULE,
  SCHEDULE_STORAGE_KEY,
} from '../constants';
import type { AppSettings, WeekSchedule } from '../types';
import { decodeURLState, pushStateToURL } from '../utils/urlState';

function normalizeSchedule(value: unknown): WeekSchedule | null {
  if (!value || typeof value !== 'object') return null;

  const source = value as Partial<Record<keyof WeekSchedule, unknown>>;
  const normalized = { ...EMPTY_SCHEDULE };

  for (const day of Object.keys(normalized) as (keyof WeekSchedule)[]) {
    const hours = source[day];
    if (!Array.isArray(hours)) continue;

    normalized[day] = Array.from(new Set(
      hours.filter((hour): hour is number =>
        typeof hour === 'number'
        && Number.isFinite(hour)
        && hour >= 0
        && hour < 24
      )
    )).sort((a, b) => a - b);
  }

  return normalized;
}

export function useTimeSlotterState() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    'timeslotter_settings_v1',
    DEFAULT_SETTINGS,
    (stored) => {
      const urlState = decodeURLState(window.location.search);
      return urlState.settings && Object.keys(urlState.settings).length > 0
        ? { ...stored, ...urlState.settings }
        : stored;
    }
  );

  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const urlState = decodeURLState(window.location.search);
    if (urlState.schedule && Object.keys(urlState.schedule).length > 0) {
      return normalizeSchedule({ ...EMPTY_SCHEDULE, ...urlState.schedule }) ?? EMPTY_SCHEDULE;
    }

    if (settings.persistSchedule) {
      try {
        const item = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (item) {
          const restored = normalizeSchedule(JSON.parse(item));
          if (restored) return restored;
        }
      } catch {
        // Ignore invalid saved state.
      }
    }

    return PREFILLED_SCHEDULE;
  });

  useEffect(() => {
    if (settings.persistSchedule) {
      try {
        window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
      } catch {
        // Ignore storage restrictions.
      }
    } else {
      window.localStorage.removeItem(SCHEDULE_STORAGE_KEY);
    }
  }, [schedule, settings.persistSchedule]);

  const urlSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
    urlSyncTimer.current = setTimeout(() => {
      pushStateToURL(schedule, settings);
    }, 300);

    return () => {
      if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
    };
  }, [schedule, settings]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return {
    schedule,
    settings,
    isSettingsOpen,
    setSchedule,
    setSettings,
    setIsSettingsOpen,
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
    clearSchedule: () => setSchedule({ ...EMPTY_SCHEDULE }),
  };
}
