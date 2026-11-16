import React, { useState } from 'react';
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
};

const DEFAULT_SCHEDULE: WeekSchedule = {
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
  monday: [14, 15, 16, 18, 19], // Demo example as mentioned in user prompt
  tuesday: [],
  wednesday: [],
};

export const App: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    'timeslotter_settings_v1',
    DEFAULT_SETTINGS
  );

  const [schedule, setSchedule] = useLocalStorage<WeekSchedule>(
    'timeslotter_schedule_v1',
    DEFAULT_SCHEDULE
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const handleClearAllSchedule = () => {
    if (window.confirm('Очистити всі вибрані години для всіх днів?')) {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sticky Header */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearAll={handleClearAllSchedule}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Availability Output Card */}
        <AvailabilityOutput schedule={schedule} settings={settings} />

        {/* Interactive Time Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Графік тижня (7 днів, починаючи з Четверга)
            </h2>
            <span className="text-xs text-slate-400">
              {settings.sleepEnabled ? 'Фільтр сну активний' : 'Усі 24 години'}
            </span>
          </div>

          <TimeGrid
            schedule={schedule}
            settings={settings}
            onChangeSchedule={setSchedule}
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
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        TimeSlotter • Збереження в LocalStorage • Готово для деплою на GitHub
      </footer>
    </div>
  );
};

export default App;
