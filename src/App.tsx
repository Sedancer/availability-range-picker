import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { TimeGrid } from './components/TimeGrid';
import { AvailabilityOutput } from './components/AvailabilityOutput';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { AppSettings, WeekSchedule } from './types';

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

// Pre-filled Monday, Tuesday, Wednesday as requested
const PREFILLED_SCHEDULE: WeekSchedule = {
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
  monday: [14, 15, 16, 18, 19], // 14:00 - 17:00, 18:00 - 20:00
  tuesday: [14, 15, 16, 17],     // 14:00 - 18:00
  wednesday: [10, 11, 12, 13, 14, 15], // 10:00 - 16:00
};

const SCHEDULE_STORAGE_KEY = 'timeslotter_schedule_v1';

export const App: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    'timeslotter_settings_v1',
    DEFAULT_SETTINGS
  );

  // Initialize schedule with prefilled Mon-Wed
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

  // Sync schedule with localStorage when persistSchedule is enabled
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
    if (window.confirm('Clear all selected hours across all days?')) {
      setSchedule({
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
      });
    }
  };

  const handlePrefillMonWed = () => {
    setSchedule((prev) => ({
      ...prev,
      monday: [14, 15, 16, 18, 19],
      tuesday: [14, 15, 16, 17],
      wednesday: [10, 11, 12, 13, 14, 15],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting/gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-indigo-600/10 via-violet-600/10 to-rose-600/5 blur-3xl pointer-events-none rounded-full" />

      {/* Sticky Header */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearAll={handleClearAllSchedule}
      />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Availability Output Card */}
        <AvailabilityOutput schedule={schedule} settings={settings} />

        {/* Interactive Time Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Weekly Schedule (7 Days, starting Thursday)
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {settings.disableWeekends && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  Weekends Disabled
                </span>
              )}
              <span>{settings.sleepEnabled ? 'Sleep filter active' : 'Full 24 Hours'}</span>
            </div>
          </div>

          <TimeGrid
            schedule={schedule}
            settings={settings}
            onChangeSchedule={setSchedule}
            onPrefillMonWed={handlePrefillMonWed}
          />
        </section>
      </main>

      {/* Settings Side Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onResetSettings={handleResetSettings}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 py-4 text-center text-xs text-slate-500">
        TimeSlotter • 1-Click Availability Generator • Ready for GitHub Pages deployment
      </footer>
    </div>
  );
};

export default App;
