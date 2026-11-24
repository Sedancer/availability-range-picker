import React from 'react';
import { Calendar } from 'lucide-react';
import type { AppSettings } from '../../types';
import { ALL_DAYS } from '../../utils/availability';

interface FirstDaySectionProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const FirstDaySection: React.FC<FirstDaySectionProps> = ({
  settings,
  onUpdateSettings,
}) => (
  <div className="space-y-2 pt-3 border-t border-slate-800/80">
    <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
      <Calendar className="w-3.5 h-3.5" />
      <span>First Day</span>
    </div>

    <div role="group" aria-label="First day of the week" className="grid grid-cols-7 gap-1">
      {ALL_DAYS.map((day) => {
        const isSelected = settings.startDay === day.id;
        return (
          <button
            key={`start-day-${day.id}`}
            type="button"
            aria-pressed={isSelected}
            aria-label={`Start week on ${day.name}`}
            onClick={() => onUpdateSettings({ ...settings, startDay: day.id })}
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
);
