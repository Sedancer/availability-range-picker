import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { TimeGrid } from './components/TimeGrid';
import { AvailabilityOutput } from './components/AvailabilityOutput';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { AppSettings, WeekSchedule } from './types';
import { formatOffset } from './utils/timezones';

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

// Pre-filled Monday, Tuesday, Wednesday
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
    DEFAULT_SETTINGS
  );

  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    if (settings.persistSchedule) {
      try {
        const item = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
        return item ? JSON.parse(item) : PREFILLED_SCHEDULE;
      } catch (err) {
        console.warn('Error reading schedule from localStorage:', err);
        return PREFILLED_SCHEDULE;
      }
    }
    return PREFILLED_SCHEDULE;
  });

  useEffect(() => {
    if (settings.persistSchedule) {
      try {
        window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
      } catch (err) {
        console.warn('Error saving schedule to localStorage:', err);
      }
    } else {
      window.localStorage.removeItem(SCHEDULE_STORAGE_KEY);
    }
  }, [schedule, settings.persistSchedule]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const handleClearAllSchedule = () => {
    setSchedule({
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Minimal Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearAll={handleClearAllSchedule}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Editable Single-Line Availability Input with 1 Copy Button */}
        <AvailabilityOutput schedule={schedule} settings={settings} />

        {/* Vertical Columns Grid (Days across, hours down) */}
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

      {/* Footer with selected preferences */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-3 px-4 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <span>Me: <strong className="text-slate-300">{formatOffset(settings.myTimezoneOffset)}</strong></span>
            <span>Client: <strong className="text-slate-300">{formatOffset(settings.clientTimezoneOffset)}</strong></span>
            <span>
              {settings.sleepEnabled
                ? `Sleep: ${String(settings.sleepStartHour).padStart(2, '0')}:00-${String(settings.sleepEndHour).padStart(2, '0')}:00`
                : '24 Hours'}
            </span>
          </div>
          <div>
            <span>TimeSlotter</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
