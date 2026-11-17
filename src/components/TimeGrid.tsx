import React, { useEffect, useCallback, useRef } from 'react';
import { X, Ban } from 'lucide-react';
import type { AppSettings, DayOfWeek, WeekSchedule } from '../types';
import { getOrderedDays, isSleepHour } from '../utils/availability';

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
  // Dragging state for single-click & hold paint/erase
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'add' | 'remove'>('add');
  const dragDayIdRef = useRef<DayOfWeek | null>(null);

  // Compute displayed hours
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  const visibleHours = settings.sleepEnabled
    ? allHours.filter((h) => !isSleepHour(h, settings.sleepStartHour, settings.sleepEndHour))
    : allHours;

  const orderedDays = getOrderedDays(settings.startDay);

  // Apply single-hour modification
  const setHourState = useCallback(
    (dayId: DayOfWeek, hour: number, shouldAdd: boolean) => {
      onChangeSchedule((prev: WeekSchedule) => {
        const currentHours = prev[dayId] || [];
        const hasHour = currentHours.includes(hour);

        if (shouldAdd && !hasHour) {
          return {
            ...prev,
            [dayId]: [...currentHours, hour].sort((a, b) => a - b),
          };
        } else if (!shouldAdd && hasHour) {
          return {
            ...prev,
            [dayId]: currentHours.filter((h: number) => h !== hour),
          };
        }
        return prev;
      });
    },
    [onChangeSchedule]
  );

  // Global mouse up / touch end listener
  useEffect(() => {
    const handleEnd = () => {
      isDraggingRef.current = false;
      dragDayIdRef.current = null;
    };
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Pointer Down (Mouse LMB or Touch):
  // Smart Toggle locked strictly to the clicked day
  const handlePointerStart = (dayId: DayOfWeek, hour: number, isDisabled: boolean) => {
    if (isDisabled) return;

    const currentHours = schedule[dayId] || [];
    const isCurrentlySelected = currentHours.includes(hour);
    const targetMode = isCurrentlySelected ? 'remove' : 'add';

    isDraggingRef.current = true;
    dragModeRef.current = targetMode;
    dragDayIdRef.current = dayId; // Lock dragging strictly to this single day

    setHourState(dayId, hour, targetMode === 'add');
  };

  // Mouse Enter while dragging:
  // Strictly constrained to the initial day column (cannot bleed sideways)
  const handleMouseEnter = (dayId: DayOfWeek, hour: number, isDisabled: boolean) => {
    if (isDisabled || !isDraggingRef.current) return;
    if (dragDayIdRef.current !== dayId) return; // Prevent painting adjacent days
    setHourState(dayId, hour, dragModeRef.current === 'add');
  };

  // Mobile Touch Drag Move: locked strictly to initial day
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !dragDayIdRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target) return;

    const hourAttr = target.getAttribute('data-hour');
    const dayAttr = target.getAttribute('data-day') as DayOfWeek | null;

    if (hourAttr && dayAttr === dragDayIdRef.current) {
      const hour = parseInt(hourAttr, 10);
      setHourState(dayAttr, hour, dragModeRef.current === 'add');
    }
  };

  const handleClearDay = (dayId: DayOfWeek) => {
    onChangeSchedule((prev: WeekSchedule) => ({
      ...prev,
      [dayId]: [],
    }));
  };

  return (
    <div
      onTouchMove={handleTouchMove}
      className="w-full select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 7 Columns: Refined day headers, strictly vertical hour columns */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
        {orderedDays.map((day) => {
          const isWeekendDisabled = settings.disableWeekends && day.isWeekend;
          const selectedHours = isWeekendDisabled ? [] : (schedule[day.id] || []);

          return (
            <div
              key={day.id}
              className={`flex flex-col items-center min-w-0 transition-opacity ${
                isWeekendDisabled ? 'opacity-25 pointer-events-none' : ''
              }`}
            >
              {/* Day Header: Capital first letter, lowercase rest, not bold, tall, spaced */}
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
                    title={`Clear ${day.shortName}`}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                ) : (
                  <Ban className="w-3 h-3 text-slate-600" />
                )}
              </div>

              {/* Hours Column: Maximized touch area */}
              <div className="flex flex-col gap-1 w-full">
                {visibleHours.map((hour) => {
                  const isSelected = selectedHours.includes(hour);

                  return (
                    <button
                      key={`${day.id}-hour-${hour}`}
                      data-hour={hour}
                      data-day={day.id}
                      type="button"
                      onMouseDown={(e) => {
                        if (e.button === 0) {
                          handlePointerStart(day.id, hour, isWeekendDisabled);
                        }
                      }}
                      onMouseEnter={() => handleMouseEnter(day.id, hour, isWeekendDisabled)}
                      onTouchStart={() => handlePointerStart(day.id, hour, isWeekendDisabled)}
                      className={`group relative w-full h-8 sm:h-9 rounded-lg font-mono text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-xs shadow-emerald-500/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
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
