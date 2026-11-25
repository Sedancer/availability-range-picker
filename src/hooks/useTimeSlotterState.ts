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
import { hasScheduleData, sanitizeSchedule, sanitizeSettings } from '../utils/stateValidation';

export function useTimeSlotterState() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    'timeslotter_settings_v1',
    DEFAULT_SETTINGS,
    (stored) => {
      const urlState = decodeURLState(window.location.search);
      return urlState.settings && Object.keys(urlState.settings).length > 0
        ? { ...stored, ...urlState.settings }
        : stored;
    },
    sanitizeSettings
  );

  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const urlState = decodeURLState(window.location.search);
    if (urlState.schedule && Object.keys(urlState.schedule).length > 0) {
      return sanitizeSchedule({ ...EMPTY_SCHEDULE, ...urlState.schedule });
    }

    if (settings.persistSchedule) {
      try {
        const item = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (item) {
          const parsed = JSON.parse(item) as unknown;
          if (hasScheduleData(parsed)) return sanitizeSchedule(parsed);
        }
      } catch {
        // Invalid saved schedules are discarded.
      }
    }

    return PREFILLED_SCHEDULE;
  });

  useEffect(() => {
    if (settings.persistSchedule) {
      try {
        window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(sanitizeSchedule(schedule)));
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
