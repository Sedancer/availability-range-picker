import React, { useState } from 'react';
import { Copy, Check, Settings, Trash2, Edit3, X } from 'lucide-react';
import type { AppSettings, WeekSchedule } from '../types';
import { generateAvailabilityString } from '../utils/availability';
import { parseAvailabilityString } from '../utils/availabilityParser';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface HeaderProps {
  schedule: WeekSchedule;
  settings: AppSettings;
  onChangeSchedule: (value: WeekSchedule | ((prev: WeekSchedule) => WeekSchedule)) => void;
  onOpenSettings: () => void;
  onClearAll: () => void;
  onEditOpenChange: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  schedule,
  settings,
  onChangeSchedule,
  onOpenSettings,
  onClearAll,
  onEditOpenChange,
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
    onEditOpenChange(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    onEditOpenChange(false);
  };

  const editDialogRef = useDialogFocus(isEditOpen, handleCloseEdit);

  // As user edits text in local timezone, parse and update schedule in real-time
  const handleTextChange = (newText: string) => {
    setEditText(newText);
    const parsed = parseAvailabilityString(newText, schedule);
    onChangeSchedule(parsed);
  };

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
        <div className="max-w-4xl mx-auto flex items-center gap-1.5 sm:gap-2">
          {/* Main Readonly Display Block: Final Result in Client Timezone */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy availability text"
            className="group flex-1 min-w-0 text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-lg px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors shadow-inner"
          >
            <span className="block flex-1 min-w-0 overflow-x-auto whitespace-nowrap scrollbar-none font-mono text-xs sm:text-sm text-slate-100 tracking-tight select-all">
              {clientAvailability || <span className="text-slate-400">No slots selected...</span>}
            </span>
          </button>

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

          {/* Edit Button: Opens manual text editor popup */}
          <button
            type="button"
            onClick={handleOpenEdit}
            aria-label="Edit availability"
            title="Edit availability text manually in local timezone"
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          {/* Clear All button */}
          <button
            type="button"
            onClick={onClearAll}
            aria-label="Clear all selected hours"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
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

      {/* Manual Text Editor Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div
            ref={editDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="availability-editor-title"
            tabIndex={-1}
            className="relative w-full max-w-lg bg-slate-900 text-slate-100 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 id="availability-editor-title" className="text-sm font-semibold text-slate-200">Edit availability</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                aria-label="Close availability editor"
                className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pb-3">
              <textarea
                rows={3}
                value={editText}
                onChange={(e) => handleTextChange(e.target.value)}
                aria-label="Availability schedule"
                placeholder="Fri: 10-13; Sat: -; Sun: 22-24;"
                className="w-full bg-slate-950/70 rounded-lg p-3 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-400 outline-none ring-0 tracking-tight resize-y"
                autoFocus
              />
            </div>

            <div className="px-4 pb-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCloseEdit}
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
