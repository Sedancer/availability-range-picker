import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X, Eraser, PenTool } from 'lucide-react';
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
  // Mobile touch draw mode: 'add' or 'remove'
  const [mobileDrawMode, setMobileDrawMode] = useState<'add' | 'remove'>('add');

  // Mouse dragging state
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'add' | 'remove'>('add');
  const [, setRerender] = useState({});

  // Compute displayed hours
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  const visibleHours = settings.sleepEnabled
    ? allHours.filter((h) => !isSleepHour(h, settings.sleepStartHour, settings.sleepEndHour))
    : allHours;

  const orderedDays = getOrderedDays(settings.startDay);

  // Apply hour change helper
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
        setRerender({});
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Mouse event handlers for desktop
  const handleMouseDown = (
    e: React.MouseEvent,
    dayId: DayOfWeek,
    hour: number
  ) => {
    // 0 = left button (add), 2 = right button (remove)
    if (e.button === 0) {
      isDraggingRef.current = true;
      dragModeRef.current = 'add';
      setHourState(dayId, hour, true);
    } else if (e.button === 2) {
      e.preventDefault();
      isDraggingRef.current = true;
      dragModeRef.current = 'remove';
      setHourState(dayId, hour, false);
    }
  };

  const handleMouseEnter = (dayId: DayOfWeek, hour: number) => {
    if (isDraggingRef.current) {
      setHourState(dayId, hour, dragModeRef.current === 'add');
    }
  };

  // Quick actions for a day
  const handleSelectAllVisible = (dayId: DayOfWeek) => {
    onChangeSchedule((prev: WeekSchedule) => {
      const current = prev[dayId] || [];
      const merged = Array.from(new Set([...current, ...visibleHours])).sort((a, b) => a - b);
      return { ...prev, [dayId]: merged };
    });
  };

  const handleClearDay = (dayId: DayOfWeek) => {
    onChangeSchedule((prev: WeekSchedule) => ({
      ...prev,
      [dayId]: [],
    }));
  };

  return (
    <div
      className="space-y-4"
      onContextMenu={(e) => {
        // Prevent browser context menu on right click inside the grid so RMB acts smoothly as eraser
        e.preventDefault();
      }}
    >
      {/* Legend & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        {/* Interaction hints */}
        <div className="flex flex-wrap items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-500 inline-block shadow-xs shadow-indigo-500/50"></span>
            <span>Ліва кнопка (LMB): <strong>додати</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 inline-block"></span>
            <span>Права кнопка (RMB): <strong>стерти</strong></span>
          </div>
          <span className="text-slate-500 hidden lg:inline">|</span>
          <span className="text-slate-400 hidden lg:inline">
            Проводьте мишкою із затиснутою кнопкою для швидкого виділення
          </span>
        </div>

        {/* Mobile Draw Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            type="button"
            onClick={() => setMobileDrawMode('add')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              mobileDrawMode === 'add'
                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Додавати</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileDrawMode('remove')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              mobileDrawMode === 'remove'
                ? 'bg-rose-600 text-white font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Стирати</span>
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {orderedDays.map((day) => {
          const selectedHours = schedule[day.id] || [];
          const hasSelected = selectedHours.length > 0;

          return (
            <div
              key={day.id}
              className={`flex flex-col rounded-xl border transition-all ${
                day.isWeekend
                  ? 'border-red-900/40 bg-gradient-to-b from-red-950/20 to-slate-900/90 shadow-red-950/20'
                  : 'border-slate-800/80 bg-slate-900/90'
              } shadow-lg overflow-hidden`}
            >
              {/* Day Header */}
              <div
                className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
                  day.isWeekend
                    ? 'border-red-900/40 bg-red-950/30'
                    : 'border-slate-800 bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-sm ${
                      day.isWeekend ? 'text-red-300' : 'text-slate-100'
                    }`}
                  >
                    {day.nameUk}
                  </span>
                  {day.isWeekend && (
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      Вихідний
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelectAllVisible(day.id)}
                    title="Вибрати всі години цього дня"
                    className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearDay(day.id)}
                    title="Очистити день"
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Hours Grid */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-4 xl:grid-cols-2 gap-1.5">
                  {visibleHours.map((hour) => {
                    const isSelected = selectedHours.includes(hour);
                    const formattedHour = `${String(hour).padStart(2, '0')}:00`;

                    return (
                      <button
                        key={`${day.id}-hour-${hour}`}
                        type="button"
                        onMouseDown={(e) => handleMouseDown(e, day.id, hour)}
                        onMouseEnter={() => handleMouseEnter(day.id, hour)}
                        onTouchStart={() => {
                          setHourState(day.id, hour, mobileDrawMode === 'add');
                        }}
                        className={`group relative h-9 rounded-lg font-mono text-xs flex items-center justify-center transition-all select-none cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50 scale-[1.02]'
                            : 'bg-slate-800/60 hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                        }`}
                      >
                        <span>{formattedHour}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Day Summary Footer */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] flex items-center justify-between text-slate-400">
                  <span>Обрано:</span>
                  <span
                    className={`font-mono font-medium ${
                      hasSelected ? 'text-indigo-400' : 'text-slate-600'
                    }`}
                  >
                    {hasSelected ? `${selectedHours.length} год` : 'Недоступний'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
