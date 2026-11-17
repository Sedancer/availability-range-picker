import React from 'react';
import { X, Globe, Moon, Calendar, RotateCcw, Ban, Save } from 'lucide-react';
import type { AppSettings, DayOfWeek } from '../types';
import { ALL_DAYS } from '../utils/availability';
import { TIMEZONE_OPTIONS } from '../utils/timezones';

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
  if (!isOpen) return null;

  const hoursList = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-sm bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* 1. Timezones (Primary) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Globe className="w-3.5 h-3.5" />
                <span>Timezones</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    My Timezone:
                  </label>
                  <select
                    value={settings.myTimezoneOffset}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        myTimezoneOffset: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={`my-${tz.offset}`} value={tz.offset}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Client Timezone:
                  </label>
                  <select
                    value={settings.clientTimezoneOffset}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        clientTimezoneOffset: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={`client-${tz.offset}`} value={tz.offset}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showBothTimezonesInOutput}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        showBothTimezonesInOutput: e.target.checked,
                      })
                    }
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Show both in output (me / client)</span>
                </label>
              </div>
            </div>

            {/* 2. Sleep Time Filter (Primary) */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <Moon className="w-3.5 h-3.5" />
                  <span>Sleep Filter</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sleepEnabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        sleepEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {settings.sleepEnabled && (
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">
                      Sleep:
                    </label>
                    <select
                      value={settings.sleepStartHour}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          sleepStartHour: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 cursor-pointer"
                    >
                      {hoursList.map((h) => (
                        <option key={`sleep-start-${h}`} value={h}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">
                      Wake up:
                    </label>
                    <select
                      value={settings.sleepEndHour}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          sleepEndHour: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 cursor-pointer"
                    >
                      {hoursList.map((h) => (
                        <option key={`sleep-end-${h}`} value={h}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 3. First Day of Week (Primary) */}
            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>First Day of Week</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {ALL_DAYS.map((day) => {
                  const isSelected = settings.startDay === day.id;
                  return (
                    <button
                      key={`start-day-${day.id}`}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          startDay: day.id as DayOfWeek,
                        })
                      }
                      className={`py-1.5 text-center text-[11px] font-mono rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {day.shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Other Settings & Storage (Bottom) */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Other & Storage
              </span>

              {/* Disable Weekends toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Disable Weekends</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.disableWeekends}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        disableWeekends: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>

              {/* Persist Schedule in LocalStorage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save selection in LocalStorage</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.persistSchedule}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        persistSchedule: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Reset to default */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onResetSettings}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-rose-400 py-1.5 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to default</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950">
            <button
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
