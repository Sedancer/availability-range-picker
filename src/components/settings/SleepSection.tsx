import React from 'react';
import { Moon } from 'lucide-react';
import type { AppSettings } from '../../types';

interface SleepSectionProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SleepSection: React.FC<SleepSectionProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const hours = Array.from({ length: 24 }, (_, index) => index);

  return (
    <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
          <Moon className="w-3.5 h-3.5" />
          <span>Sleep Filter</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            aria-label="Enable sleep filter"
            checked={settings.sleepEnabled}
            onChange={(event) => onUpdateSettings({
              ...settings,
              sleepEnabled: event.target.checked,
            })}
            className="sr-only peer"
          />
          <div           className="w-8 h-[18px] bg-slate-800 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>

      {settings.sleepEnabled && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label htmlFor="sleep-start" className="block text-[11px] text-slate-400 mb-1">Sleep:</label>
            <select
              id="sleep-start"
              value={settings.sleepStartHour}
              onChange={(event) => onUpdateSettings({
                ...settings,
                sleepStartHour: parseInt(event.target.value, 10),
              })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              {hours.map((hour) => (
                <option key={`sleep-start-${hour}`} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sleep-end" className="block text-[11px] text-slate-400 mb-1">Wake up:</label>
            <select
              id="sleep-end"
              value={settings.sleepEndHour}
              onChange={(event) => onUpdateSettings({
                ...settings,
                sleepEndHour: parseInt(event.target.value, 10),
              })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              {hours.map((hour) => (
                <option key={`sleep-end-${hour}`} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
