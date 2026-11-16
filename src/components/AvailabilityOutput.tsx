import React, { useState } from 'react';
import { Copy, Check, FileText, Info } from 'lucide-react';
import type { AppSettings, WeekSchedule } from '../types';
import {
  generateAvailabilityString,
  type OutputFormatType,
} from '../utils/availability';
import { formatOffset } from '../utils/timezones';

interface AvailabilityOutputProps {
  schedule: WeekSchedule;
  settings: AppSettings;
}

export const AvailabilityOutput: React.FC<AvailabilityOutputProps> = ({
  schedule,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<OutputFormatType>('multiline');

  const textOutput = generateAvailabilityString(schedule, settings, format);
  const offsetDiff = settings.clientTimezoneOffset - settings.myTimezoneOffset;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Generated Availability String
            </h3>
            <p className="text-xs text-slate-400">
              Updates in real-time. Click anywhere in the box to copy.
            </p>
          </div>
        </div>

        {/* Format Selector & 1-Click Copy Button */}
        <div className="flex items-center gap-2">
          {/* Format buttons */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setFormat('multiline')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                format === 'multiline'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Multi-line
            </button>
            <button
              type="button"
              onClick={() => setFormat('singleline')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                format === 'singleline'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single-line
            </button>
          </div>

          {/* Quick Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-md ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 animate-in zoom-in" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy 1-Click</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clickable Output Box */}
      <div
        onClick={handleCopy}
        title="Click anywhere to copy"
        className="group relative bg-slate-950/80 border border-slate-800/90 hover:border-indigo-500/50 rounded-xl p-3.5 sm:p-4 font-mono text-xs sm:text-sm text-slate-200 transition-all cursor-pointer overflow-x-auto"
      >
        <pre className="whitespace-pre-wrap leading-relaxed select-all">
          {textOutput}
        </pre>

        {/* Hover overlay hint */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/90 text-slate-300 text-[11px] px-2 py-1 rounded border border-slate-700 pointer-events-none flex items-center gap-1 shadow-md">
          <Copy className="w-3 h-3" />
          <span>Click to copy</span>
        </div>
      </div>

      {/* Timezone Note */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        {offsetDiff !== 0 ? (
          <span>
            Hours automatically converted to client timezone (
            <strong className="text-sky-300">
              {formatOffset(settings.clientTimezoneOffset)}
            </strong>
            , offset: {offsetDiff > 0 ? `+${offsetDiff}` : offsetDiff}h).
          </span>
        ) : (
          <span>
            Timezone matches client (
            <strong className="text-emerald-300">
              {formatOffset(settings.myTimezoneOffset)}
            </strong>
            ).
          </span>
        )}
      </div>
    </div>
  );
};
