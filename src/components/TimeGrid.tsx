import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X, Eraser, PenTool, LayoutGrid, Smartphone, Ban } from 'lucide-react';
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
  // Mobile touch draw mode: 'add' (green) or 'remove' (eraser)
  const [mobileDrawMode, setMobileDrawMode] = useState<'add' | 'remove'>('add');

  // Mobile view mode: 'tabs' (single day focus) or 'list' (all days)
  const [mobileView, setMobileView] = useState<'tabs' | 'list'>('tabs');
  const [activeMobileDay, setActiveMobileDay] = useState<DayOfWeek>(settings.startDay);

  // Mouse dragging state
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'add' | 'remove'>('add');
  const dragDayIdRef = useRef<DayOfWeek | null>(null);
  const dragStartHourRef = useRef<number | null>(null);
  const initialSelectionOnDragStartRef = useRef<number[]>([]);
  const [, setRerender] = useState({});

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

  // Window mouse up listener to terminate canvas dragging anywhere
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragDayIdRef.current = null;
        dragStartHourRef.current = null;
        setRerender({});
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

  // Canvas Drag Over / Mouse Enter: smooth range painting
  const handleMouseEnter = (dayId: DayOfWeek, currentHour: number, isDisabled: boolean) => {
    if (isDisabled || !isDraggingRef.current) return;

    if (dragModeRef.current === 'add') {
      if (dragDayIdRef.current === dayId && dragStartHourRef.current !== null) {
        // Continuous range between startHour and currentHour
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
        // Across different day or free-paint
        setHourState(dayId, currentHour, true);
      }
    } else if (dragModeRef.current === 'remove') {
      // Eraser brush
      setHourState(dayId, currentHour, false);
    }
  };

  // Mobile Touch Move handler: allows painting across slots smoothly with finger
  const handleTouchMove = (e: React.TouchEvent, dayId: DayOfWeek) => {
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target) return;

    const hourAttr = target.getAttribute('data-hour');
    const targetDayId = target.getAttribute('data-day');

    if (hourAttr && targetDayId === dayId) {
      const hour = parseInt(hourAttr, 10);
      setHourState(dayId, hour, mobileDrawMode === 'add');
    }
  };

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

  // Render single day card
  const renderDayCard = (day: typeof orderedDays[0], isFullMobile: boolean = false) => {
    const isWeekendDisabled = settings.disableWeekends && day.isWeekend;
    const selectedHours = isWeekendDisabled ? [] : (schedule[day.id] || []);
    const hasSelected = selectedHours.length > 0;

    return (
      <div
        key={day.id}
        className={`flex flex-col rounded-2xl border transition-all ${
          isWeekendDisabled
            ? 'opacity-40 grayscale border-slate-800/40 bg-slate-950/70 cursor-not-allowed select-none'
            : day.isWeekend
            ? 'border-rose-900/40 bg-gradient-to-b from-rose-950/25 via-slate-900/90 to-slate-900 shadow-rose-950/15'
            : 'border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90'
        } shadow-xl backdrop-blur-xs overflow-hidden`}
      >
        {/* Day Header */}
        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${
            isWeekendDisabled
              ? 'border-slate-800/40 bg-slate-900/30'
              : day.isWeekend
              ? 'border-rose-900/30 bg-rose-950/20'
              : 'border-slate-800/80 bg-slate-800/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold text-sm sm:text-base ${
                isWeekendDisabled
                  ? 'text-slate-500'
                  : day.isWeekend
                  ? 'text-rose-300'
                  : 'text-slate-100'
              }`}
            >
              {day.name}
            </span>
            {day.isWeekend && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isWeekendDisabled
                    ? 'bg-slate-800 text-slate-500 border-slate-700'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}
              >
                {isWeekendDisabled ? 'Disabled' : 'Weekend'}
              </span>
            )}
          </div>

          {/* Quick Header Actions */}
          {!isWeekendDisabled && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectAllVisible(day.id)}
                title="Select all visible hours"
                className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleClearDay(day.id)}
                title="Clear day"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Day Hours Grid */}
        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
          {isWeekendDisabled ? (
            <div className="py-10 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Ban className="w-8 h-8 stroke-1 text-slate-600" />
              <p className="text-xs">Weekend is disabled in settings</p>
              <span className="font-mono text-sm font-semibold text-slate-600">—</span>
            </div>
          ) : (
            <>
              <div
                onTouchMove={(e) => handleTouchMove(e, day.id)}
                className={`grid gap-2 ${
                  isFullMobile
                    ? 'grid-cols-3 sm:grid-cols-4'
                    : 'grid-cols-4 md:grid-cols-3 xl:grid-cols-2'
                }`}
              >
                {visibleHours.map((hour) => {
                  const isSelected = selectedHours.includes(hour);
                  const formattedHour = `${String(hour).padStart(2, '0')}:00`;

                  return (
                    <button
                      key={`${day.id}-hour-${hour}`}
                      data-hour={hour}
                      data-day={day.id}
                      type="button"
                      onMouseDown={(e) => handleMouseDown(e, day.id, hour, false)}
                      onMouseEnter={() => handleMouseEnter(day.id, hour, false)}
                      onTouchStart={() => {
                        setHourState(day.id, hour, mobileDrawMode === 'add');
                      }}
                      className={`group relative ${
                        isFullMobile ? 'h-11 text-sm' : 'h-9 text-xs'
                      } rounded-xl font-mono flex items-center justify-center transition-all select-none cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/80 scale-[1.02]'
                          : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-700/50'
                      }`}
                    >
                      <span className="pointer-events-none">{formattedHour}</span>
                    </button>
                  );
                })}
              </div>

              {/* Day Summary Footer */}
              <div className="pt-2.5 border-t border-slate-800/60 text-xs flex items-center justify-between text-slate-400">
                <span>Selected:</span>
                <span
                  className={`font-mono font-medium ${
                    hasSelected ? 'text-emerald-400 font-semibold' : 'text-slate-600'
                  }`}
                >
                  {hasSelected ? `${selectedHours.length} hrs` : 'Unavailable'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs backdrop-blur-xs shadow-lg">
        {/* Interaction hints */}
        <div className="flex flex-wrap items-center gap-3.5 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 inline-block shadow-xs shadow-emerald-500/50"></span>
            <span>Left Click (LMB): <strong>Hold & drag to paint green</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-800 border border-slate-600 inline-block"></span>
            <span>Right Click (RMB): <strong>Click to erase single hour</strong></span>
          </div>
        </div>

        {/* View Mode & Touch Switcher */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile view toggle (Tabs vs All) */}
          <div className="flex md:hidden items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setMobileView('tabs')}
              title="Single Day Focus Mode"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                mobileView === 'tabs' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileView('list')}
              title="Show all days"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                mobileView === 'list' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Touch Draw Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setMobileDrawMode('add')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                mobileDrawMode === 'add'
                  ? 'bg-emerald-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Paint</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileDrawMode('remove')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                mobileDrawMode === 'remove'
                  ? 'bg-rose-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Erase</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar (Visible on mobile when in 'tabs' view mode) */}
      <div className="flex md:hidden overflow-x-auto gap-2 pb-1 scrollbar-none">
        {orderedDays.map((day) => {
          const isCurrent = activeMobileDay === day.id;
          const isWeekendDisabled = settings.disableWeekends && day.isWeekend;
          const hoursCount = isWeekendDisabled ? 0 : (schedule[day.id] || []).length;

          return (
            <button
              key={`tab-${day.id}`}
              type="button"
              onClick={() => setActiveMobileDay(day.id)}
              className={`flex-1 min-w-[70px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : isWeekendDisabled
                  ? 'opacity-40 bg-slate-950/60 border-slate-900 text-slate-500'
                  : day.isWeekend
                  ? 'bg-rose-950/20 border-rose-900/30 text-rose-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-semibold text-xs">{day.shortName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isWeekendDisabled
                    ? 'text-slate-600'
                    : hoursCount > 0
                    ? 'bg-emerald-500/30 text-emerald-300 font-mono font-medium'
                    : 'text-slate-500'
                }`}
              >
                {isWeekendDisabled ? '—' : hoursCount > 0 ? `${hoursCount}h` : '—'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Single Day View */}
      <div className="block md:hidden">
        {mobileView === 'tabs' && (
          <div>
            {(() => {
              const activeDayConfig = orderedDays.find((d) => d.id === activeMobileDay) || orderedDays[0];
              return renderDayCard(activeDayConfig, true);
            })()}
          </div>
        )}
      </div>

      {/* Desktop Grid & Mobile List View */}
      <div
        className={`${
          mobileView === 'tabs' ? 'hidden md:grid' : 'grid'
        } grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3`}
      >
        {orderedDays.map((day) => renderDayCard(day, false))}
      </div>
    </div>
  );
};
