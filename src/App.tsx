import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { TimeGrid } from './components/TimeGrid';
import { FluidBackground } from './components/FluidBackground';
import { AppFooter } from './components/AppFooter';
import { useTimeSlotterState } from './hooks/useTimeSlotterState';
import { generateAvailabilityString } from './utils/availability';
import { parseAvailabilityString } from './utils/availabilityParser';
import { sanitizeSchedule } from './utils/stateValidation';
import type { AppSettings, WeekSchedule } from './types';

function schedulesMatch(left: WeekSchedule, right: WeekSchedule): boolean {
  return Object.keys(left).every((day) => {
    const leftHours = left[day as keyof WeekSchedule];
    const rightHours = right[day as keyof WeekSchedule];
    return leftHours.length === rightHours.length
      && leftHours.every((hour, index) => hour === rightHours[index]);
  });
}

function getLocalScheduleText(schedule: WeekSchedule, settings: AppSettings): string {
  return generateAvailabilityString(schedule, {
    ...settings,
    clientTimezoneOffset: settings.myTimezoneOffset,
  });
}

export const App: React.FC = () => {
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

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const editorTextChangeRef = useRef(false);
  const colorMode = settings.colorMode ?? 'dark';

  useEffect(() => {
    if (!isEditorOpen) return;
    if (editorTextChangeRef.current) {
      editorTextChangeRef.current = false;
      return;
    }
    setEditText(getLocalScheduleText(schedule, settings));
  }, [isEditorOpen, schedule, settings]);

  const handleToggleEditor = () => {
    if (!isEditorOpen) {
      setEditText(getLocalScheduleText(schedule, settings));
    }
    setIsEditorOpen((open) => !open);
  };

  const handleEditTextChange = (nextText: string) => {
    setEditText(nextText);
    const parsed = sanitizeSchedule(
      nextText.trim() ? parseAvailabilityString(nextText) : {}
    );
    if (!schedulesMatch(parsed, schedule)) {
      editorTextChangeRef.current = true;
      setSchedule(parsed);
    }
  };

  useEffect(() => {
    document.documentElement.dataset.colorMode = colorMode;
  }, [colorMode]);

  return (
    <div data-color-mode={colorMode} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans relative overflow-x-hidden">
      <FluidBackground paused={isSettingsOpen} />
      <Header
        schedule={schedule}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearAll={clearSchedule}
        isEditorOpen={isEditorOpen}
        onToggleEditor={handleToggleEditor}
        editText={editText}
        onEditTextChange={handleEditTextChange}
      />
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-2 sm:p-4">
        <TimeGrid
          schedule={schedule}
          settings={settings}
          onChangeSchedule={setSchedule}
        />
      </main>

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onResetSettings={resetSettings}
      />
      <AppFooter
        settings={settings}
        colorMode={colorMode}
        onToggleTheme={() => setSettings({
          ...settings,
          colorMode: colorMode === 'dark' ? 'light' : 'dark',
        })}
      />
    </div>
  );
};

export default App;
