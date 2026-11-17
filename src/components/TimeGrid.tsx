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
  // Mouse dragging state
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'add' | 'remove'>('add');
  const dragDayIdRef = useRef<DayOfWeek | null>(null);
  const dragStartHourRef = useRef<number | null>(null);
  const initialSelectionOnDragStartRef = useRef<number[]>([]);

  // Compute displayed hours (e.g. 8..21 or 0..23)
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

  // Window mouse up listener to terminate dragging anywhere
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragDayIdRef.current = null;
        dragStartHourRef.current = null;
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Desktop Mouse Down: LMB = paint green downwards; RMB = erase point
  const handleMouseDown = (
    e: React.MouseEvent,
    dayId: DayOfWeek,
    hour: number,
    isDisabled: boolean
  ) => {
    if (isDisabled) return;

    if (e.button === 0) {
      // Left Click: start vertical canvas paint range
      isDraggingRef.current = true;
      dragModeRef.current = 'add';
      dragDayIdRef.current = dayId;
      dragStartHourRef.current = hour;
      initialSelectionOnDragStartRef.current = schedule[dayId] || [];

      setHourState(dayId, hour, true);
    } else if (e.button === 2) {
      // Right Click: erase point
      e.preventDefault();
      isDraggingRef.current = true;
      dragModeRef.current = 'remove';
      dragDayIdRef.current = dayId;
      dragStartHourRef.current = hour;

      setHourState(dayId, hour, false);
    }
  };

  // Canvas Drag Over downwards/upwards within the day column
  const handleMouseEnter = (dayId: DayOfWeek, currentHour: number, isDisabled: boolean) => {
    if (isDisabled || !isDraggingRef.current) return;

    if (dragModeRef.current === 'add') {
      if (dragDayIdRef.current === dayId && dragStartHourRef.current !== null) {
        // Continuous range between startHour and currentHour vertically
        const start = Math.min(dragStartHourRef.current, currentHour);
        const end = Math.max(dragStartHourRef.current, currentHour);

        const rangeHours = visibleHours.filter((h) => h >= start && h <= end);

        onChangeSchedule((prev: WeekSchedule) => {
          const base = initialSelectionOnDragStartRef.current;
          const merged = Array.from(new Set([...base, ...rangeHours])).sort((a, b) => a - b);
          return {
            ...prev,
            [dayId]: merged,
          };
        });
      } else {
        setHourState(dayId, currentHour, true);
      }
    } else if (dragModeRef.current === 'remove') {
      setHourState(dayId, currentHour, false);
    }
  };

  // Mobile Touch Drag Move: allows smooth 1-finger painting vertically
  const handleTouchMove = (e: React.TouchEvent, dayId: DayOfWeek) => {
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target) return;

    const hourAttr = target.getAttribute('data-hour');
    const targetDayId = target.getAttribute('data-day');

    if (hourAttr && targetDayId === dayId) {
      const hour = parseInt(hourAttr, 10);
      setHourState(dayId, hour, true);
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
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl select-none overflow-x-auto touch-pan-x"
      onContextMenu={(e) => {
        // Block browser context menu for right-click erasing
        e.preventDefault();
      }}
    >
      {/* 7 Columns: Each day is a vertical column, hours go downwards (8, 9, 10... 21) */}
      <div className="grid grid-cols-7 gap-2 min-w-[500px] sm:min-w-full">
        {orderedDays.map((day) => {
          const isWeekendDisabled = settings.disableWeekends && day.isWeekend;
          const selectedHours = isWeekendDisabled ? [] : (schedule[day.id] || []);

          return (
            <div
              key={day.id}
              className={`flex flex-col items-center rounded-xl p-1.5 border transition-all ${
                isWeekendDisabled
                  ? 'opacity-30 border-slate-800/40 bg-slate-950/40 pointer-events-none'
                  : day.isWeekend
                  ? 'border-rose-900/40 bg-rose-950/10'
                  : 'border-slate-800/80 bg-slate-950/40'
              }`}
            >
              {/* Day Header (3 letters + Clear Button) */}
              <div className="flex items-center justify-between w-full px-1 py-1 mb-2 border-b border-slate-800/60">
                <span
                  className={`font-mono text-xs font-bold tracking-wider ${
                    day.isWeekend ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {day.shortName}
                </span>

                {!isWeekendDisabled ? (
                  <button
                    type="button"
                    onClick={() => handleClearDay(day.id)}
                    title={`Clear ${day.shortName}`}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Ban className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>

              {/* Hours Column: Hours going DOWNWARDS (8, 9, 10 ... 21) */}
              <div
                onTouchMove={(e) => handleTouchMove(e, day.id)}
                className="flex flex-col gap-1 w-full"
              >
                {visibleHours.map((hour) => {
                  const isSelected = selectedHours.includes(hour);

                  return (
                    <button
                      key={`${day.id}-hour-${hour}`}
                      data-hour={hour}
                      data-day={day.id}
                      type="button"
                      onMouseDown={(e) => handleMouseDown(e, day.id, hour, isWeekendDisabled)}
                      onMouseEnter={() => handleMouseEnter(day.id, hour, isWeekendDisabled)}
                      onTouchStart={() => {
                        if (!isWeekendDisabled) {
                          setHourState(day.id, hour, !isSelected);
                        }
                      }}
                      className={`group relative w-full h-7 sm:h-8 rounded-lg font-mono text-[11px] sm:text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-xs shadow-emerald-500/30 ring-1 ring-emerald-400'
                          : 'bg-slate-800/70 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/40'
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
