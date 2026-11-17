import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import type { AppSettings, WeekSchedule } from '../types';
import { generateAvailabilityString } from '../utils/availability';

interface AvailabilityOutputProps {
  schedule: WeekSchedule;
  settings: AppSettings;
}

export const AvailabilityOutput: React.FC<AvailabilityOutputProps> = ({
  schedule,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState('');

  // Auto-generate string on schedule/settings update
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
    <div className="flex items-center gap-2 w-full bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-lg">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Availability string will appear here..."
        className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-hidden tracking-wide overflow-x-auto selection:bg-emerald-600 selection:text-white"
      />
      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm ${
          copied
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
};
