import React from 'react';
import { Settings, Clock, Moon, Sun, Trash2 } from 'lucide-react';
import type { AppSettings } from '../types';
import { formatOffset } from '../utils/timezones';

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onClearAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({ settings, onOpenSettings, onClearAll }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              TimeSlotter
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                1-Click Availability
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive slot selector with timezones, sleep filters & drag controls
            </p>
          </div>
        </div>

        {/* Info Badges & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Timezone Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-slate-300">
            <span className="text-slate-400">Me:</span>
            <span className="font-semibold text-emerald-400">{formatOffset(settings.myTimezoneOffset)}</span>
            <span className="text-slate-600">→</span>
            <span className="text-slate-400">Client:</span>
            <span className="font-semibold text-sky-400">{formatOffset(settings.clientTimezoneOffset)}</span>
          </div>

          {/* Sleep Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-slate-300">
            {settings.sleepEnabled ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Sleep: {String(settings.sleepStartHour).padStart(2, '0')}:00-{String(settings.sleepEndHour).padStart(2, '0')}:00</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>24 Hours</span>
              </>
            )}
          </div>

          {/* Clear button */}
          <button
            onClick={onClearAll}
            title="Clear all selected slots"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm px-3.5 py-2 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
