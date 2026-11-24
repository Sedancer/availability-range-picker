import React from 'react';
import { Globe } from 'lucide-react';
import type { AppSettings } from '../../types';
import { TIMEZONE_OPTIONS } from '../../utils/timezones';

interface TimezoneSectionProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const TimezoneSection: React.FC<TimezoneSectionProps> = ({
  settings,
  onUpdateSettings,
}) => (
  <div className="space-y-2.5">
    <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
      <Globe className="w-3.5 h-3.5" />
      <span>Timezones</span>
    </div>

    <div className="space-y-2">
      <div>
        <label htmlFor="my-timezone" className="block text-[11px] text-slate-400 mb-1">My Timezone:</label>
        <select
          id="my-timezone"
          value={settings.myTimezoneOffset}
          onChange={(event) => onUpdateSettings({
            ...settings,
            myTimezoneOffset: parseFloat(event.target.value),
          })}
          className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
        >
          {TIMEZONE_OPTIONS.map((timezone) => (
            <option key={`my-${timezone.offset}`} value={timezone.offset}>
              {timezone.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="client-timezone" className="block text-[11px] text-slate-400 mb-1">Client Timezone:</label>
        <select
          id="client-timezone"
          value={settings.clientTimezoneOffset}
          onChange={(event) => onUpdateSettings({
            ...settings,
            clientTimezoneOffset: parseFloat(event.target.value),
          })}
          className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
        >
          {TIMEZONE_OPTIONS.map((timezone) => (
            <option key={`client-${timezone.offset}`} value={timezone.offset}>
              {timezone.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
);
