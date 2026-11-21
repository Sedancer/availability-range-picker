import React, { useState, useEffect } from 'react';
import { Copy, Check, Settings, Trash2, Edit3, X, Sparkles } from 'lucide-react';
import type { AppSettings, WeekSchedule } from '../types';
import { generateAvailabilityString } from '../utils/availability';
import { parseAvailabilityString } from '../utils/availabilityParser';
import { formatOffset } from '../utils/timezones';

interface HeaderProps {
  schedule: WeekSchedule;
  settings: AppSettings;
  onChangeSchedule: (value: WeekSchedule | ((prev: WeekSchedule) => WeekSchedule)) => void;
  onOpenSettings: () => void;
  onClearAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  schedule,
  settings,
  onChangeSchedule,
  onOpenSettings,
  onClearAll,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Client timezone output string (shown in main view)
  const clientAvailability = generateAvailabilityString(schedule, settings);

  // Local timezone string (used for manual text editing)
  const localSettings: AppSettings = {
    ...settings,
    clientTimezoneOffset: settings.myTimezoneOffset, // offsetDiff = 0 -> purely local
  };
  const [editText, setEditText] = useState('');

  // When modal opens, sync the text to current local schedule
  const handleOpenEdit = () => {
    setEditText(generateAvailabilityString(schedule, localSettings));
    setIsEditOpen(true);
  };

  // As user edits text in local timezone, parse and update schedule in real-time
  const handleTextChange = (newText: string) => {
    setEditText(newText);
    const parsed = parseAvailabilityString(newText, schedule);
    onChangeSchedule(parsed);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(clientAvailability);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Close modal on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditOpen) {
        setIsEditOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center gap-1.5 sm:gap-2">
          {/* Main Readonly Display Block: Final Result in Client Timezone */}
          <div
            onClick={handleCopy}
            title="Click to copy availability text"
            className="group flex-1 min-w-0 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-lg px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors shadow-inner"
          >
            <div className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap scrollbar-none font-mono text-xs sm:text-sm text-slate-100 tracking-tight select-all">
              {clientAvailability || <span className="text-slate-600">No slots selected...</span>}
            </div>

            {/* Target Timezone Badge */}
            <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-emerald-400 border border-slate-700/50 transition-colors">
              Client {formatOffset(settings.clientTimezoneOffset)}
            </span>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Edit Button: Opens manual text editor popup */}
          <button
            type="button"
            onClick={handleOpenEdit}
            title="Edit availability text manually in local timezone"
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          {/* Clear All button */}
          <button
            type="button"
            onClick={onClearAll}
            title="Clear all selected hours"
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

      {/* Manual Text Editor Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-xl bg-slate-900 border border-slate-800 text-slate-100 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Manual Availability Editor
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Local {formatOffset(settings.myTimezoneOffset)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Edit your available hours in your local time:</span>
                <span className="text-[11px] text-slate-500">Live syncs with grid</span>
              </div>

              {/* Textarea for manual text */}
              <textarea
                rows={4}
                value={editText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="e.g. Fri: 10-13, 15-18; Sat: 10-13; Sun: 22-24; Mon: -; Tue: -; Wed: 8-10; Thu: 17-22;"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-3 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-hidden tracking-tight resize-y"
                autoFocus
              />

              {/* Live Preview of Converted Client String */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Sparkles className="w-3 h-3" />
                    Target Client Output ({formatOffset(settings.clientTimezoneOffset)}):
                  </span>
                  <span className="text-[10px] text-slate-500">Auto-converted</span>
                </div>
                <div className="font-mono text-xs text-slate-300 break-all bg-slate-900/50 p-1.5 rounded border border-slate-800/50">
                  {clientAvailability}
                </div>
              </div>

              {/* Syntax hints */}
              <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                <span>• Use <code className="text-slate-400 font-mono">10-13</code> for ranges</span>
                <span>• Use <code className="text-slate-400 font-mono">22-24</code> for midnight</span>
                <span>• Use <code className="text-slate-400 font-mono">-</code> for empty days</span>
                <span>• Separate days with <code className="text-slate-400 font-mono">;</code></span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
