import React, { useState, useEffect } from 'react';
import { Copy, Check, Settings, Trash2 } from 'lucide-react';
import type { AppSettings, WeekSchedule } from '../types';
import { generateAvailabilityString } from '../utils/availability';

interface HeaderProps {
  schedule: WeekSchedule;
  settings: AppSettings;
  onOpenSettings: () => void;
  onClearAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  schedule,
  settings,
  onOpenSettings,
  onClearAll,
}) => {
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState('');

  // Sync generated string whenever schedule or settings change
  useEffect(() => {
    setValue(generateAvailabilityString(schedule, settings));
  }, [schedule, settings]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center gap-1.5 sm:gap-2">
        {/* The single valuable input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Availability string..."
          className="flex-1 min-w-0 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 sm:px-3 py-1.5 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-hidden tracking-tight overflow-x-auto selection:bg-emerald-600 selection:text-white"
        />

        {/* 1 Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Clear All button */}
        <button
          type="button"
          onClick={onClearAll}
          title="Clear all"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
