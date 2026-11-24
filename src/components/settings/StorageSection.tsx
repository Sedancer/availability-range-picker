import React from 'react';
import { RotateCcw, Ban, Save, Sun } from 'lucide-react';
import type { AppSettings } from '../../types';

interface StorageSectionProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetSettings: () => void;
}

export const StorageSection: React.FC<StorageSectionProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => (
  <div className="space-y-3 pt-3 border-t border-slate-800/80">
    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
      Appearance & Storage
    </span>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-slate-300">
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <label htmlFor="color-mode">Color mode</label>
      </div>
      <select
        id="color-mode"
        value={settings.colorMode ?? 'dark'}
        onChange={(event) => onUpdateSettings({
          ...settings,
          colorMode: event.target.value === 'light' ? 'light' : 'dark',
        })}
        className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-slate-300">
        <Ban className="w-3.5 h-3.5 text-rose-400" />
        <span>Disable Weekends</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          aria-label="Disable weekends"
          checked={settings.disableWeekends}
          onChange={(event) => onUpdateSettings({
            ...settings,
            disableWeekends: event.target.checked,
          })}
          className="sr-only peer"
        />
        <div         className="w-8 h-[18px] bg-slate-800 peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-rose-500"></div>
      </label>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-slate-300">
        <Save className="w-3.5 h-3.5 text-slate-400" />
        <span>Save selection in LocalStorage</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          aria-label="Save selection in browser storage"
          checked={settings.persistSchedule}
          onChange={(event) => onUpdateSettings({
            ...settings,
            persistSchedule: event.target.checked,
          })}
          className="sr-only peer"
        />
        <div         className="w-8 h-[18px] bg-slate-800 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
      </label>
    </div>

    <div className="pt-1">
      <button
        type="button"
        onClick={onResetSettings}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-rose-400 py-1.5 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Reset to default</span>
      </button>
    </div>
  </div>
);
