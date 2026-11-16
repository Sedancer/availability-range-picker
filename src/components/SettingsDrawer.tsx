import React from 'react';
import { X, Globe, Moon, Calendar, RotateCcw, Check, Save, Ban } from 'lucide-react';
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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Preferences & Settings
              </span>
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Weekend Disabling Option */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-400">
                  <Ban className="w-4 h-4 text-rose-400" />
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
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                When enabled, Saturday and Sunday are dimmed out, non-interactive, and output as a dash (—).
              </p>
            </div>

            {/* Persistence Option */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                  <Save className="w-4 h-4 text-indigo-400" />
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
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {settings.persistSchedule
                  ? 'Enabled: selected hours persist across page reloads.'
                  : 'Disabled (default): resets to fresh slots on reload. Preferences are always saved.'}
              </p>
            </div>

            {/* Section 1: Timezones */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
                <Globe className="w-4 h-4" />
                <span>Timezones</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={`my-${tz.offset}`} value={tz.offset}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={`client-${tz.offset}`} value={tz.offset}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showBothTimezonesInOutput}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          showBothTimezonesInOutput: e.target.checked,
                        })
                      }
                      className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Show both timezones in output (my time / client time)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 2: Sleep Hours */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
                  <Moon className="w-4 h-4" />
                  <span>Sleep Hours Filter</span>
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
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <p className="text-xs text-slate-400">
                Hides sleeping hours to keep the grid compact and eliminate unnecessary 24-hour scrolling.
              </p>

              {settings.sleepEnabled && (
                <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Bedtime:
                    </label>
                    <select
                      value={settings.sleepStartHour}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          sleepStartHour: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 cursor-pointer"
                    >
                      {hoursList.map((h) => (
                        <option key={`sleep-start-${h}`} value={h}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 cursor-pointer"
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

            {/* Section 3: Start Day */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
                <Calendar className="w-4 h-4" />
                <span>First Day of Week</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Starting day (Thursday by default):
                </label>
                <div className="grid grid-cols-2 gap-2">
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
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{day.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 4: Reset Button */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <button
                type="button"
                onClick={onResetSettings}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 py-2.5 rounded-lg border border-slate-800 hover:border-rose-500/20 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Settings to Default</span>
              </button>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
