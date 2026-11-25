import React, { useState } from 'react';
import { Copy, Check, Settings, ListX, Edit3 } from 'lucide-react';
import type { AppSettings, WeekSchedule } from '../types';
import { generateAvailabilityString } from '../utils/availability';
import { formatOffset } from '../utils/timezones';

interface HeaderProps {
  schedule: WeekSchedule;
  settings: AppSettings;
  onOpenSettings: () => void;
  onClearAll: () => void;
  isEditorOpen: boolean;
  onToggleEditor: () => void;
  editText: string;
  onEditTextChange: (text: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  schedule,
  settings,
  onOpenSettings,
  onClearAll,
  isEditorOpen,
  onToggleEditor,
  editText,
  onEditTextChange,
}) => {
  const [copied, setCopied] = useState(false);

  const clientAvailability = generateAvailabilityString(schedule, settings);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(clientAvailability);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = clientAvailability;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const succeeded = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!succeeded) throw new Error('Copy command was rejected');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-start gap-1.5 sm:gap-2">
          <div className="availability-result relative flex-1 min-w-0">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy availability text"
              className="group w-full min-w-0 text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-lg px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors shadow-inner"
            >
              <span className="block flex-1 min-w-0 overflow-x-auto whitespace-nowrap scrollbar-none font-mono text-xs sm:text-sm text-slate-100 tracking-tight select-all">
                {clientAvailability || <span className="text-slate-400">No slots selected...</span>}
              </span>
            </button>
            {isEditorOpen && (
              <div className="availability-editor-overlay">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/95 p-2.5 shadow-2xl backdrop-blur-md">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label htmlFor="availability-editor" className="text-[11px] font-medium text-slate-300">
                      Edit schedule <span className="text-slate-400">· Times in {formatOffset(settings.myTimezoneOffset)}</span>
                    </label>
                    <button
                      type="button"
                      onClick={onToggleEditor}
                      aria-label="Close schedule editor"
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                  <textarea
                    id="availability-editor"
                    rows={2}
                    value={editText}
                    onChange={(event) => onEditTextChange(event.target.value)}
                    aria-label={`Schedule in ${formatOffset(settings.myTimezoneOffset)}`}
                    placeholder="Mon: 09-12; Tue: 14-16;"
                    autoFocus
                    className="w-full resize-y rounded-lg border border-slate-800 bg-slate-950/80 p-2 font-mono text-xs text-slate-100 placeholder-slate-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleEditor}
            aria-label={isEditorOpen ? 'Close schedule editor' : 'Edit availability'}
            title="Edit availability text inline in local timezone"
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isEditorOpen ? 'Done' : 'Edit'}</span>
          </button>

          {/* Clear All button */}
          <button
            type="button"
            onClick={onClearAll}
            aria-label="Clear all selected hours"
            title="Clear all selected hours"
            className="flex shrink-0 items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/5 px-2 py-1.5 text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/15 hover:text-rose-200 transition-colors cursor-pointer"
          >
            <ListX className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Clear all</span>
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
};
