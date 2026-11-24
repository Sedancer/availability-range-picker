import React from 'react';
import { X } from 'lucide-react';
import type { AppSettings } from '../types';
import { TimezoneSection } from './settings/TimezoneSection';
import { SleepSection } from './settings/SleepSection';
import { FirstDaySection } from './settings/FirstDaySection';
import { StorageSection } from './settings/StorageSection';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetSettings: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const dialogRef = useDialogFocus(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          tabIndex={-1}
          className="w-screen max-w-sm bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col"
        >
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 id="settings-title" className="text-sm font-semibold text-slate-200">
              Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <TimezoneSection settings={settings} onUpdateSettings={onUpdateSettings} />
            <SleepSection settings={settings} onUpdateSettings={onUpdateSettings} />
            <FirstDaySection settings={settings} onUpdateSettings={onUpdateSettings} />
            <StorageSection
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onResetSettings={onResetSettings}
            />
          </div>
          <div className="p-3 border-t border-slate-800 bg-slate-950">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-md text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
