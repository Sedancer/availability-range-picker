import React from 'react';
import type { AppSettings } from '../types';
import { formatOffset } from '../utils/timezones';

export const AppFooter: React.FC<{ settings: AppSettings }> = ({ settings }) => (
  <footer className="relative z-10 border-t border-slate-900/80 bg-slate-950/70 backdrop-blur-xs py-2.5 px-3 text-xs text-slate-400">
    <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 text-[11px] sm:text-xs">
      <span>Me: <strong className="text-slate-300">{formatOffset(settings.myTimezoneOffset)}</strong></span>
      <span className="text-slate-700">•</span>
      <span>Client: <strong className="text-slate-300">{formatOffset(settings.clientTimezoneOffset)}</strong></span>
      <span className="text-slate-700">•</span>
      <span>
        {settings.sleepEnabled
          ? `Sleep: ${String(settings.sleepStartHour).padStart(2, '0')}:00-${String(settings.sleepEndHour).padStart(2, '0')}:00`
          : '24 Hours'}
      </span>
    </div>
  </footer>
);
