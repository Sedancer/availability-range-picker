import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X, Eraser, PenTool, LayoutGrid, Smartphone, Sparkles, Ban } from 'lucide-react';
import type { AppSettings, DayOfWeek, WeekSchedule } from '../types';
import { getOrderedDays, isSleepHour } from '../utils/availability';

interface TimeGridProps {
  schedule: WeekSchedule;
  settings: AppSettings;
  onChangeSchedule: (value: WeekSchedule | ((prev: WeekSchedule) => WeekSchedule)) => void;
  onPrefillMonWed: () => void;
}

export const TimeGrid: React.FC<TimeGridProps> = ({
  schedule,
  settings,
  onChangeSchedule,
  onPrefillMonWed,
}) => {
  // Mobile touch draw mode: 'add' or 'remove'
  const [mobileDrawMode, setMobileDrawMode] = useState<'add' | 'remove'>('add');

  // Mobile view mode: 'tabs' (day by day full screen) or 'list' (all 7 days together)
  const [mobileView, setMobileView] = useState<'tabs' | 'list'>('tabs');
  const [activeMobileDay, setActiveMobileDay] = useState<DayOfWeek>(settings.startDay);

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
    hour: number,
    isDisabled: boolean
  ) => {
    if (isDisabled) return;
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

  const handleMouseEnter = (dayId: DayOfWeek, hour: number, isDisabled: boolean) => {
    if (isDisabled) return;
    if (isDraggingRef.current) {
      setHourState(dayId, hour, dragModeRef.current === 'add');
    }
  };

  // Preset handlers
  const handleApplyPreset = (dayId: DayOfWeek, presetHours: number[]) => {
    onChangeSchedule((prev: WeekSchedule) => ({
      ...prev,
      [dayId]: presetHours.filter((h) => visibleHours.includes(h)).sort((a, b) => a - b),
    }));
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
                title="Select all active hours"
                className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
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
            <div className="py-8 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Ban className="w-8 h-8 stroke-1 text-slate-600" />
              <p className="text-xs">Weekend is disabled in settings</p>
              <span className="font-mono text-sm font-semibold text-slate-600">—</span>
            </div>
          ) : (
            <>
              <div
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
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50 scale-[1.02]'
                          : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                      }`}
                    >
                      <span>{formattedHour}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Presets for this day */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(day.id, [10, 11, 12, 13, 14, 15, 16, 17])}
                  className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                >
                  10-18
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(day.id, [14, 15, 16, 17])}
                  className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                >
                  14-18
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(day.id, [18, 19, 20, 21])}
                  className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                >
                  18-22
                </button>
              </div>

              {/* Day Summary Footer */}
              <div className="pt-2 border-t border-slate-800/60 text-xs flex items-center justify-between text-slate-400">
                <span>Selected:</span>
                <span
                  className={`font-mono font-medium ${
                    hasSelected ? 'text-indigo-400 font-semibold' : 'text-slate-600'
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
            <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 inline-block shadow-xs shadow-indigo-500/50"></span>
            <span>Left Click (LMB): <strong>Add</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-800 border border-slate-700 inline-block"></span>
            <span>Right Click (RMB): <strong>Erase</strong></span>
          </div>

          {/* Prefill Mon-Wed Quick Button */}
          <button
            type="button"
            onClick={onPrefillMonWed}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 hover:from-indigo-500/30 hover:to-violet-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all cursor-pointer font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Prefill Mon–Wed</span>
          </button>
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
                mobileView === 'tabs' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileView('list')}
              title="Show all days"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                mobileView === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400'
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
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Add</span>
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
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
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
                    ? 'bg-indigo-500/30 text-indigo-300 font-mono font-medium'
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
