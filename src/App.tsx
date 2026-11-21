import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { TimeGrid } from './components/TimeGrid';
import { FluidBackground } from './components/FluidBackground';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { AppSettings, WeekSchedule } from './types';
import { formatOffset } from './utils/timezones';
import { decodeURLState, pushStateToURL } from './utils/urlState';

const DEFAULT_SETTINGS: AppSettings = {
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

const EMPTY_SCHEDULE: WeekSchedule = {
  thursday: [], friday: [], saturday: [], sunday: [],
  monday: [], tuesday: [], wednesday: [],
};

// Pre-filled example schedule (shown when no URL state and persistSchedule is off)
const PREFILLED_SCHEDULE: WeekSchedule = {
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
  monday: [14, 15, 16, 18, 19], // 14-17, 18-20
  tuesday: [8],                 // 8-9
  wednesday: [10, 11, 12, 13, 14, 15], // 10-16
};

const SCHEDULE_STORAGE_KEY = 'timeslotter_schedule_v1';

export const App: React.FC = () => {
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
    // 1. Try to restore from URL first
    const urlState = decodeURLState(window.location.search);
    if (urlState.schedule && Object.keys(urlState.schedule).length > 0) {
      return { ...EMPTY_SCHEDULE, ...urlState.schedule };
    }
    // 2. Then from localStorage if persistSchedule is enabled
    if (settings.persistSchedule) {
      try {
        const item = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (item) return JSON.parse(item);
      } catch {
        // ignore
      }
    }
    return PREFILLED_SCHEDULE;
  });

  // Sync schedule to localStorage when persistSchedule is on
  useEffect(() => {
    if (settings.persistSchedule) {
      try {
        window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
      } catch {
        // ignore
      }
    } else {
      window.localStorage.removeItem(SCHEDULE_STORAGE_KEY);
    }
  }, [schedule, settings.persistSchedule]);

  // Sync state → URL (debounced, replaceState so no history spam)
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

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const handleClearAllSchedule = () => {
    setSchedule({ ...EMPTY_SCHEDULE });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans relative overflow-x-hidden">
      {/* Interactive WebGL Fluid Smoke Background */}
      <FluidBackground />

      {/* Sticky Header with single input + copy button */}
      <Header
        schedule={schedule}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearAll={handleClearAllSchedule}
      />

      {/* Main Container: Pure, clean vertical columns */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-2 sm:p-4">
        <TimeGrid
          schedule={schedule}
          settings={settings}
          onChangeSchedule={setSchedule}
        />
      </main>

      {/* Settings Side Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onResetSettings={handleResetSettings}
      />

      {/* Clean Minimal Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 bg-slate-950/70 backdrop-blur-xs py-2.5 px-3 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 text-[11px] sm:text-xs">
          <span>Me: <strong className="text-slate-300">{formatOffset(settings.myTimezoneOffset)}</strong></span>
          <span className="text-slate-700">•</span>
          <span>Client: <strong className="text-slate-300">{formatOffset(settings.clientTimezoneOffset)}</strong></span>
          <span className="text-slate-700">•</span>
          <span>
            {settings.sleepEnabled
              ? `Sleep: ${String(settings.sleepStartHour).padStart(2, '0')}:00-${String(settings.sleepEndHour).padStart(2, '0')}:00`
              : '24 Hours'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
