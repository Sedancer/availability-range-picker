import React from 'react';
import { X, Globe, Moon, Calendar, RotateCcw, Check } from 'lucide-react';
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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>Параметри та Налаштування</span>
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
            {/* Section 1: Timezones */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
                <Globe className="w-4 h-4" />
                <span>Часові зони</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Моя часова зона:
                  </label>
                  <select
                    value={settings.myTimezoneOffset}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        myTimezoneOffset: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
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
                    Часова зона клієнта:
                  </label>
                  <select
                    value={settings.clientTimezoneOffset}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        clientTimezoneOffset: parseFloat(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
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
                    <span>Показувати в тексті обидві зони (мій час / час клієнта)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 2: Sleep Hours */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
                  <Moon className="w-4 h-4" />
                  <span>Години сну (фільтр годин)</span>
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
                За замовчуванням приховує години відпочинку, щоб зменшити 24-годинну сітку до зручного розміру.
              </p>

              {settings.sleepEnabled && (
                <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Засинання:
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
                      Прокидання:
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
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
                <Calendar className="w-4 h-4" />
                <span>Перший день тижня</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Початок списку (за замовчуванням — Четвер):
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
                        <span>{day.nameUk}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 4: Data persistence note & Reset */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                💾 Усі зміни та виділені години автоматично зберігаються у вашому браузері (LocalStorage) і відновлюються після оновлення сторінки.
              </div>

              <button
                type="button"
                onClick={onResetSettings}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 py-2.5 rounded-lg border border-slate-800 hover:border-rose-500/20 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Скинути налаштування до стандартних</span>
              </button>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Зберегти та закрити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
