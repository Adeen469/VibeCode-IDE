import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileCode,
  Terminal,
  Bot,
  Users,
  Database,
  Lock,
  Unlock,
  Sparkles,
  Command,
} from 'lucide-react';
import { OrchestrationMode } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (fileId: string) => void;
  onSelectSidebarTab: (tab: string) => void;
  onSelectPanelTab: (tab: string) => void;
  onSetOrchestrationMode: (mode: OrchestrationMode) => void;
  onProbeLocalModels: () => void;
  onToggleVaultLock: () => void;
  isVaultLocked: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenFile,
  onSelectSidebarTab,
  onSelectPanelTab,
  onSetOrchestrationMode,
  onProbeLocalModels,
  onToggleVaultLock,
  isVaultLocked,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    {
      id: 'open-agent',
      label: 'AI Agent: Open Solo Assistant (Ctrl+L)',
      category: 'Agent',
      icon: Sparkles,
      action: () => onSelectSidebarTab('agent'),
    },
    {
      id: 'open-main',
      label: 'Open: src/main.ts',
      category: 'File',
      icon: FileCode,
      action: () => onOpenFile('f-main'),
    },
    {
      id: 'open-dsp',
      label: 'Open: src/audio/dsp_processor.ts (Edge DSP)',
      category: 'File',
      icon: FileCode,
      action: () => onOpenFile('f-dsp'),
    },
    {
      id: 'open-vault',
      label: 'Open: src/security/vault_service.ts (Crypto Vault)',
      category: 'File',
      icon: FileCode,
      action: () => onOpenFile('f-vault'),
    },
    {
      id: 'mode-team',
      label: 'AI: Switch to Team Discussion Mode',
      category: 'Orchestrator',
      icon: Bot,
      action: () => {
        onSetOrchestrationMode('team');
        onSelectPanelTab('chat');
      },
    },
    {
      id: 'mode-pipeline',
      label: 'AI: Switch to 4-Stage Sequential Pipeline',
      category: 'Orchestrator',
      icon: Sparkles,
      action: () => {
        onSetOrchestrationMode('pipeline');
        onSelectPanelTab('chat');
      },
    },
    {
      id: 'mode-single',
      label: 'AI: Switch to Single Responder Mode',
      category: 'Orchestrator',
      icon: Bot,
      action: () => {
        onSetOrchestrationMode('single');
        onSelectPanelTab('chat');
      },
    },
    {
      id: 'probe-models',
      label: 'AI: Auto-Probe Local Ollama & LM Studio Ports',
      category: 'Models',
      icon: Bot,
      action: () => {
        onProbeLocalModels();
        onSelectSidebarTab('models');
      },
    },
    {
      id: 'view-terminal',
      label: 'View: Open Terminal Panel',
      category: 'View',
      icon: Terminal,
      action: () => onSelectPanelTab('terminal'),
    },
    {
      id: 'view-p2p',
      label: 'P2P: Open Collaboration & Granular Grants Matrix',
      category: 'Collaboration',
      icon: Users,
      action: () => onSelectSidebarTab('p2p'),
    },
    {
      id: 'toggle-vault',
      label: isVaultLocked ? 'Security: Unlock Vault (AES-256-GCM)' : 'Security: Lock Vault',
      category: 'Security',
      icon: isVaultLocked ? Unlock : Lock,
      action: onToggleVaultLock,
    },
    {
      id: 'view-database',
      label: 'Database: Open SQLite Schema & DDL Explorer',
      category: 'Database',
      icon: Database,
      action: () => onSelectSidebarTab('database'),
    },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#18181b] border border-neutral-700 rounded-lg shadow-2xl overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search files (Ctrl+Shift+P)..."
            className="w-full bg-transparent border-none text-white focus:outline-none text-xs font-mono placeholder-neutral-500"
          />
          <kbd className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5 text-xs font-mono">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 text-xs">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-600 text-white font-medium'
                      : 'text-neutral-300 hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="w-4 h-4 shrink-0 opacity-80" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                      isSelected ? 'bg-sky-700 text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
