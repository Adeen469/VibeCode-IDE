import React from 'react';
import {
  GitBranch,
  Bot,
  Users,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Zap,
} from 'lucide-react';
import { OrchestrationMode, SharingMode } from '../types';

interface StatusBarProps {
  activeLanguage: string;
  activeModelsCount: number;
  leadModelName: string;
  peersCount: number;
  sharingMode: SharingMode;
  orchestrationMode: OrchestrationMode;
  isVaultLocked: boolean;
  onOpenTerminal: () => void;
  onOpenAiTeam: () => void;
  onOpenPeers: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeLanguage,
  activeModelsCount,
  leadModelName,
  peersCount,
  sharingMode,
  orchestrationMode,
  isVaultLocked,
  onOpenTerminal,
  onOpenAiTeam,
  onOpenPeers,
}) => {
  return (
    <footer
      className="h-6 bg-[#18181b] border-t border-neutral-800 flex items-center justify-between px-3 text-[11px] text-neutral-400 select-none shrink-0 font-mono"
      aria-label="Status Bar"
    >
      {/* Left Zone: Git branch, problems status, AI team quick launcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenTerminal}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Git Branch: main"
        >
          <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
          <span>main</span>
        </button>

        <span className="text-neutral-700" aria-hidden="true">·</span>

        <button
          onClick={onOpenAiTeam}
          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
          title={`Active AI Team: ${activeModelsCount} models (Lead: ${leadModelName})`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="truncate max-w-[120px]">{leadModelName}</span>
          <span className="text-[10px] bg-sky-950 px-1 rounded uppercase font-semibold">
            {orchestrationMode}
          </span>
        </button>

        <span className="text-neutral-700" aria-hidden="true">·</span>

        <button
          onClick={onOpenPeers}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title={`P2P Peers: ${peersCount} connected (${sharingMode})`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="tabular-nums">{peersCount} peers</span>
        </button>
      </div>

      {/* Right Zone: Security cipher, encoding, language, latency */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1 ${
            isVaultLocked ? 'text-rose-400' : 'text-emerald-400'
          }`}
          title={isVaultLocked ? 'Vault Locked' : 'Vault Unlocked (AES-256-GCM)'}
        >
          {isVaultLocked ? (
            <ShieldAlert className="w-3.5 h-3.5" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          <span>{isVaultLocked ? 'Locked' : 'AES-GCM'}</span>
        </div>

        <span className="text-neutral-700" aria-hidden="true">·</span>

        <span title="Line / Column">Ln 1, Col 1</span>

        <span className="text-neutral-700" aria-hidden="true">·</span>

        <span title="File Encoding">UTF-8</span>

        <span className="text-neutral-700" aria-hidden="true">·</span>

        <span className="capitalize text-neutral-300" title="Active Language Mode">
          {activeLanguage}
        </span>
      </div>
    </footer>
  );
};
