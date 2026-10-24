import React from 'react';
import { X, Split, Play, FileCode, FileText, FileJson } from 'lucide-react';
import { EditorTab } from '../types';

interface TabBarProps {
  tabs: EditorTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onRunCurrentFile?: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onRunCurrentFile,
}) => {
  const getFileIcon = (name: string) => {
    if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js')) {
      return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
    if (name.endsWith('.json')) {
      return <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
  };

  return (
    <div className="h-9 bg-[#18181b] border-b border-neutral-800 flex items-center justify-between px-1 shrink-0 overflow-x-auto select-none">
      <div className="flex items-center h-full overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-2 h-full px-3 text-xs border-r border-neutral-800 cursor-pointer transition-colors max-w-[200px] shrink-0 font-mono ${
                isActive
                  ? 'bg-[#1e1e24] text-white border-t-2 border-t-sky-500 font-medium'
                  : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200'
              }`}
            >
              {getFileIcon(tab.name)}
              <span className="truncate">{tab.name}</span>

              {/* Dirty dot or close button */}
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {tab.isDirty ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:hidden" />
                ) : null}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className={`p-0.5 rounded hover:bg-neutral-700 hover:text-white ${
                    tab.isDirty ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Close (Ctrl+W)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 pr-2 shrink-0">
        <button
          onClick={onRunCurrentFile}
          title="Run / Benchmark File"
          className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors font-medium"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Run</span>
        </button>
        <button
          title="Split Editor"
          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
        >
          <Split className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
