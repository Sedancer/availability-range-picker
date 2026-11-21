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
  // Dragging state for single-click & continuous range drag
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'add' | 'remove'>('add');
  const dragDayIdRef = useRef<DayOfWeek | null>(null);
  const dragStartHourRef = useRef<number | null>(null);
  const initialSelectionRef = useRef<number[]>([]);

  // Compute displayed hours
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  const visibleHours = settings.sleepEnabled
    ? allHours.filter((h) => !isSleepHour(h, settings.sleepStartHour, settings.sleepEndHour))
    : allHours;

  const orderedDays = getOrderedDays(settings.startDay);

  // Apply continuous range between startHour and currentHour
  const applyRangeState = useCallback(
    (dayId: DayOfWeek, currentHour: number) => {
      if (dragStartHourRef.current === null) return;

      const start = Math.min(dragStartHourRef.current, currentHour);
      const end = Math.max(dragStartHourRef.current, currentHour);
      const rangeHours = visibleHours.filter((h) => h >= start && h <= end);
      const shouldAdd = dragModeRef.current === 'add';

      onChangeSchedule((prev: WeekSchedule) => {
        const base = initialSelectionRef.current;
        let updated: number[];

        if (shouldAdd) {
          updated = Array.from(new Set([...base, ...rangeHours])).sort((a, b) => a - b);
        } else {
          updated = base.filter((h) => !rangeHours.includes(h));
        }

        return {
          ...prev,
          [dayId]: updated,
        };
      });
    },
    [onChangeSchedule, visibleHours]
  );

  // Unified global end listener
  useEffect(() => {
    const handleEnd = () => {
      isDraggingRef.current = false;
      dragDayIdRef.current = null;
      dragStartHourRef.current = null;
    };
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Pointer Down (Mouse LMB, Touch or Pen):
  // Smart Toggle start
  const handlePointerStart = (dayId: DayOfWeek, hour: number, isDisabled: boolean) => {
    if (isDisabled) return;

    const currentHours = schedule[dayId] || [];
    const isCurrentlySelected = currentHours.includes(hour);
    const targetMode = isCurrentlySelected ? 'remove' : 'add';

    isDraggingRef.current = true;
    dragModeRef.current = targetMode;
    dragDayIdRef.current = dayId;
    dragStartHourRef.current = hour;
    initialSelectionRef.current = currentHours;

    // Apply start hour immediately
    applyRangeState(dayId, hour);
  };

  // Mouse Enter while dragging (desktop continuous range)
  const handleMouseEnter = (dayId: DayOfWeek, hour: number, isDisabled: boolean) => {
    if (isDisabled || !isDraggingRef.current) return;
    if (dragDayIdRef.current !== dayId) return; // Locked strictly to starting day
    applyRangeState(dayId, hour);
  };

  // Touch Move / Touch End range updates using elementFromPoint with closest button support
  const handleTouchRangeAtPoint = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !dragDayIdRef.current) return;

    const target = document.elementFromPoint(clientX, clientY);
    if (!target) return;

    const button = target.closest('[data-hour]');
    if (!button) return;

    const hourAttr = button.getAttribute('data-hour');
    const dayAttr = button.getAttribute('data-day') as DayOfWeek | null;

    if (hourAttr && dayAttr === dragDayIdRef.current) {
      const currentHour = parseInt(hourAttr, 10);
      applyRangeState(dayAttr, currentHour);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleTouchRangeAtPoint(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (touch) {
      handleTouchRangeAtPoint(touch.clientX, touch.clientY);
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
      onTouchEnd={handleTouchEnd}
      className="w-full select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 7 Columns */}
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
                    title={`Clear ${day.shortName}`}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                ) : (
                  <Ban className="w-3 h-3 text-slate-600" />
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
                      onPointerDown={(e) => {
                        if (e.button === 0) {
                          handlePointerStart(day.id, hour, isWeekendDisabled);
                        }
                      }}
                      onMouseEnter={() => handleMouseEnter(day.id, hour, isWeekendDisabled)}
                      className={`group relative w-full h-8 sm:h-9 rounded-lg font-mono text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-xs shadow-emerald-500/30'
                          : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800/60 backdrop-blur-xs'
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
