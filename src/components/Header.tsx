import React from 'react';
import { Settings, Clock, Trash2 } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onClearAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onClearAll }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <h1 className="text-base font-bold tracking-tight text-white">
            TimeSlotter
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Clear button */}
          <button
            onClick={onClearAll}
            title="Clear all selected slots"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
