import React from 'react';
import { X, Ban } from 'lucide-react';
import type { AppSettings, DayOfWeek, WeekSchedule } from '../types';
import { getOrderedDays, isSleepHour } from '../utils/availability';
import { useTimeGridSelection } from '../hooks/useTimeGridSelection';

interface TimeGridProps {
  schedule: WeekSchedule;
  settings: AppSettings;
  onChangeSchedule: (value: WeekSchedule | ((prev: WeekSchedule) => WeekSchedule)) => void;
}

export const TimeGrid: React.FC<TimeGridProps> = ({
  schedule,
  settings,
  onChangeSchedule,
}) => {
  // Compute displayed hours
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  const visibleHours = settings.sleepEnabled
    ? allHours.filter((h) => !isSleepHour(h, settings.sleepStartHour, settings.sleepEndHour))
    : allHours;

  const orderedDays = getOrderedDays(settings.startDay);
  const {
    handlePointerStart,
    handleMouseEnter,
    handleTouchMove,
    handleTouchEnd,
  } = useTimeGridSelection({ schedule, visibleHours, onChangeSchedule });

  const handleClearDay = (dayId: DayOfWeek) => {
    onChangeSchedule((prev: WeekSchedule) => ({
      ...prev,
      [dayId]: [],
    }));
  };

  return (
    <div
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {!settings.sleepEnabled && (
        <p role="note" className="mb-2 rounded-md border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-400">
          Full-day view may extend below the screen. Scroll the page before or after selecting; a vertical page scroll can cancel a touch drag.
        </p>
      )}
      {/* 7 Columns */}
      <div role="group" aria-label="Weekly availability" className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
        {orderedDays.map((day) => {
          const isWeekendDisabled = settings.disableWeekends && day.isWeekend;
          const selectedHours = isWeekendDisabled ? [] : (schedule[day.id] || []);

          return (
            <div
              key={day.id}
              role="group"
              aria-label={`${day.name}${isWeekendDisabled ? ', disabled' : ''}`}
              aria-disabled={isWeekendDisabled}
              className="flex flex-col items-center min-w-0"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between w-full pb-1.5 mb-1.5 border-b border-slate-800">
                <span
                  className={`text-[11px] sm:text-xs font-medium tracking-[0.16em] truncate pl-0.5 ${
                    day.isWeekend ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  {day.shortName}
                </span>

                {!isWeekendDisabled ? (
                  <button
                    type="button"
                    onClick={() => handleClearDay(day.id)}
                    aria-label={`Clear ${day.name} selection`}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                ) : (
                  <Ban className="w-3 h-3 text-slate-400" />
                )}
              </div>

              {/* Hours Column: Range dragging guarantees all hours between start and current are filled */}
              <div className="flex flex-col gap-1 w-full">
                {visibleHours.map((hour) => {
                  const isSelected = selectedHours.includes(hour);

                  return (
                    <button
                      key={`${day.id}-hour-${hour}`}
                      data-hour={hour}
                      data-day={day.id}
                      type="button"
                      disabled={isWeekendDisabled}
                      aria-pressed={isSelected}
                      aria-label={`${day.name} ${String(hour).padStart(2, '0')}:00, ${isSelected ? 'available' : 'unavailable'}`}
                      onPointerDown={(e) => {
                        if (e.button === 0) {
                          handlePointerStart(day.id, hour, isWeekendDisabled);
                        }
                      }}
                      onClick={(event) => {
                        if (event.detail === 0) {
                          handlePointerStart(day.id, hour, isWeekendDisabled);
                        }
                      }}
                      onMouseEnter={() => handleMouseEnter(day.id, hour, isWeekendDisabled)}
                      className={`group relative w-full h-8 sm:h-9 rounded-lg font-mono text-xs sm:text-sm flex items-center justify-center transition-all ${
                        isWeekendDisabled
                          ? 'bg-slate-900/40 text-slate-400 border border-slate-800/60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-xs shadow-emerald-500/30 cursor-pointer'
                          : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800/60 backdrop-blur-xs cursor-pointer'
                      }`}
                    >
                      <span className="pointer-events-none">{hour}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
