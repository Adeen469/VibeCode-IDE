import React from 'react';
import { Command, Search, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onSelectNav: (navId: string) => void;
  activeNav: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onSelectNav,
  activeNav,
}) => {
  return (
    <header className="h-10 bg-[#121214] border-b border-neutral-800 flex items-center justify-between gap-8 px-4 select-none shrink-0 z-30">
      {/* Zone 1: Brand Wordmark (Single text element in display face) */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
          VibeCode IDE
        </span>
      </div>

      {/* Zone 2: 4-5 single-line navigation tabs / triggers */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
        <button
          onClick={() => onSelectNav('agent')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'agent'
              ? 'text-sky-300 font-semibold'
              : 'hover:text-white text-sky-400/90'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>AI Agent</span>
        </button>
        <button
          onClick={() => onSelectNav('explorer')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'explorer' ? 'text-white' : ''
          }`}
        >
          Workspace
        </button>
        <button
          onClick={() => onSelectNav('models')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'models' ? 'text-white' : ''
          }`}
        >
          AI Team
        </button>
        <button
          onClick={() => onSelectNav('p2p')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'p2p' ? 'text-white' : ''
          }`}
        >
          P2P Network
        </button>
        <button
          onClick={() => onSelectNav('database')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeNav === 'database' ? 'text-white' : ''
          }`}
        >
          Database & Vault
        </button>
      </nav>

      {/* Zone 3: Exactly 1 Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-md text-xs text-neutral-300 hover:text-white transition-colors whitespace-nowrap shrink-0 font-mono"
        >
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Commands</span>
          <kbd className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded border border-neutral-700">
            Ctrl+P
          </kbd>
        </button>
      </div>
    </header>
  );
};
