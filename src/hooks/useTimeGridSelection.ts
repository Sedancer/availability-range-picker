import { useCallback, useEffect, useRef } from 'react';
import type { TouchEvent } from 'react';
import type { DayOfWeek, WeekSchedule } from '../types';

interface TimeGridSelectionOptions {
  schedule: WeekSchedule;
  visibleHours: number[];
  onChangeSchedule: (value: WeekSchedule | ((prev: WeekSchedule) => WeekSchedule)) => void;
}

export function useTimeGridSelection({
  schedule,
  visibleHours,
  onChangeSchedule,
}: TimeGridSelectionOptions) {
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'add' | 'remove'>('add');
  const dragDayIdRef = useRef<DayOfWeek | null>(null);
  const dragStartHourRef = useRef<number | null>(null);
  const initialSelectionRef = useRef<number[]>([]);

  const applyRangeState = useCallback((dayId: DayOfWeek, currentHour: number) => {
    if (dragStartHourRef.current === null) return;

    const start = Math.min(dragStartHourRef.current, currentHour);
    const end = Math.max(dragStartHourRef.current, currentHour);
    const rangeHours = visibleHours.filter((hour) => hour >= start && hour <= end);
    const shouldAdd = dragModeRef.current === 'add';

    onChangeSchedule((previous) => {
      const base = initialSelectionRef.current;
      const updated = shouldAdd
        ? Array.from(new Set([...base, ...rangeHours])).sort((a, b) => a - b)
        : base.filter((hour) => !rangeHours.includes(hour));

      return { ...previous, [dayId]: updated };
    });
  }, [onChangeSchedule, visibleHours]);

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

  const handlePointerStart = (dayId: DayOfWeek, hour: number, isDisabled: boolean) => {
    if (isDisabled) return;

    const currentHours = schedule[dayId] || [];
    isDraggingRef.current = true;
    dragModeRef.current = currentHours.includes(hour) ? 'remove' : 'add';
    dragDayIdRef.current = dayId;
    dragStartHourRef.current = hour;
    initialSelectionRef.current = currentHours;
    applyRangeState(dayId, hour);
  };

  const handleMouseEnter = (dayId: DayOfWeek, hour: number, isDisabled: boolean) => {
    if (isDisabled || !isDraggingRef.current || dragDayIdRef.current !== dayId) return;
    applyRangeState(dayId, hour);
  };

  const handleTouchRangeAtPoint = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !dragDayIdRef.current) return;
    const target = document.elementFromPoint(clientX, clientY);
    const button = target?.closest('[data-hour]');
    if (!button) return;

    const hour = Number(button.getAttribute('data-hour'));
    const day = button.getAttribute('data-day') as DayOfWeek | null;
    if (Number.isInteger(hour) && day === dragDayIdRef.current) {
      applyRangeState(day, hour);
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) handleTouchRangeAtPoint(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (touch) handleTouchRangeAtPoint(touch.clientX, touch.clientY);
  };

  return { handlePointerStart, handleMouseEnter, handleTouchMove, handleTouchEnd };
}
