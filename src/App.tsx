import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { TimeGrid } from './components/TimeGrid';
import { FluidBackground } from './components/FluidBackground';
import { AppFooter } from './components/AppFooter';
import { LampThemeToggle } from './components/LampThemeToggle';
import { useTimeSlotterState } from './hooks/useTimeSlotterState';

export const App: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const {
    schedule,
    settings,
    isSettingsOpen,
    setSchedule,
    setSettings,
    setIsSettingsOpen,
    resetSettings,
    clearSchedule,
  } = useTimeSlotterState();

  const colorMode = settings.colorMode ?? 'dark';

  useEffect(() => {
    document.documentElement.dataset.colorMode = colorMode;
  }, [colorMode]);

  return (
    <div data-color-mode={colorMode} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans relative overflow-x-hidden">
      <FluidBackground paused={isEditorOpen} />
      <Header
        schedule={schedule}
        settings={settings}
        onChangeSchedule={setSchedule}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearAll={clearSchedule}
        onEditOpenChange={setIsEditorOpen}
      />
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-2 sm:p-4">
        <TimeGrid
          schedule={schedule}
          settings={settings}
          onChangeSchedule={setSchedule}
        />
      </main>

      <div className="relative z-10 flex justify-center py-1">
        <LampThemeToggle
          colorMode={colorMode}
          onToggle={() => setSettings({
            ...settings,
            colorMode: colorMode === 'dark' ? 'light' : 'dark',
          })}
        />
      </div>

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onResetSettings={resetSettings}
      />
      <AppFooter settings={settings} />
    </div>
  );
};

export default App;
