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

  // Compute displayed hours (0..23 or filtered by sleep)
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

  // Global mouse up listener to terminate dragging anywhere
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

  // Desktop Mouse Down: LMB = paint green; RMB = erase point
  const handleMouseDown = (
    e: React.MouseEvent,
    dayId: DayOfWeek,
    hour: number,
    isDisabled: boolean
  ) => {
    if (isDisabled) return;

    if (e.button === 0) {
      // Left Click: start canvas paint range
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

  // Canvas Drag Over: smooth horizontal range painting
  const handleMouseEnter = (dayId: DayOfWeek, currentHour: number, isDisabled: boolean) => {
    if (isDisabled || !isDraggingRef.current) return;

    if (dragModeRef.current === 'add') {
      if (dragDayIdRef.current === dayId && dragStartHourRef.current !== null) {
        // Continuous range between startHour and currentHour within the day row
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

  // Mobile Touch Move: smooth dragging across row
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
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-xl space-y-2 select-none overflow-x-auto"
      onContextMenu={(e) => {
        // Block browser context menu so RMB acts purely as eraser
        e.preventDefault();
      }}
    >
      {/* 7 Horizontal Rows (One per Day) */}
      <div className="min-w-[620px] space-y-1.5">
        {orderedDays.map((day) => {
          const isWeekendDisabled = settings.disableWeekends && day.isWeekend;
          const selectedHours = isWeekendDisabled ? [] : (schedule[day.id] || []);

          return (
            <div
              key={day.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
                isWeekendDisabled
                  ? 'opacity-30 border-slate-800/40 bg-slate-950/40 pointer-events-none'
                  : day.isWeekend
                  ? 'border-rose-900/30 bg-rose-950/10'
                  : 'border-slate-800/60 bg-slate-950/40'
              }`}
            >
              {/* Day Label (3 letters) + Clear Button */}
              <div className="flex items-center justify-between w-18 shrink-0 pr-1">
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

              {/* Hours in a Single Horizontal Row */}
              <div
                onTouchMove={(e) => handleTouchMove(e, day.id)}
                className="flex items-center gap-1 flex-1"
              >
                {visibleHours.map((hour) => {
                  const isSelected = selectedHours.includes(hour);
                  const hourLabel = String(hour).padStart(2, '0');

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
                      className={`group relative flex-1 h-8 sm:h-9 rounded-lg font-mono text-[11px] sm:text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-xs shadow-emerald-500/30 ring-1 ring-emerald-400'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/40'
                      }`}
                    >
                      <span className="pointer-events-none">{hourLabel}</span>
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
