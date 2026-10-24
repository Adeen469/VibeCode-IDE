import React from 'react';
import {
  Files,
  Search,
  GitBranch,
  Bot,
  Users,
  Database,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface ActivityBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isVaultLocked: boolean;
  onToggleVault: () => void;
  activeModelsCount: number;
  peersCount: number;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeTab,
  onTabChange,
  isVaultLocked,
  onToggleVault,
  activeModelsCount,
  peersCount,
}) => {
  const topNavItems = [
    {
      id: 'agent',
      label: 'AI Agent (Solo Vibe Coder) (Ctrl+L)',
      icon: Sparkles,
      isSpecial: true,
    },
    { id: 'explorer', label: 'Explorer (Ctrl+Shift+E)', icon: Files },
    { id: 'search', label: 'Search (Ctrl+Shift+F)', icon: Search },
    { id: 'git', label: 'Source Control (Ctrl+Shift+G)', icon: GitBranch },
    {
      id: 'models',
      label: 'Multi-Model Team Orchestration',
      icon: Bot,
      badge: activeModelsCount,
    },
    {
      id: 'p2p',
      label: 'P2P Team Collaboration & Grants',
      icon: Users,
      badge: peersCount,
    },
    { id: 'database', label: 'SQLite Schema & Security Vault', icon: Database },
  ];

  return (
    <aside
      className="w-12 bg-[#121214] border-r border-neutral-800 flex flex-col justify-between items-center py-2 shrink-0 z-20"
      aria-label="Activity Bar"
    >
      <div className="flex flex-col gap-1 w-full items-center">
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={item.label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
                isActive
                  ? item.id === 'agent'
                    ? 'text-sky-300 bg-sky-950/80 shadow-sm border border-sky-800/60'
                    : 'text-white bg-neutral-800/80 shadow-sm'
                  : item.id === 'agent'
                  ? 'text-sky-400 hover:text-sky-200 hover:bg-neutral-800/40'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[1.75]" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-3.5 h-3.5 flex items-center justify-center text-[10px] font-mono tabular-nums bg-sky-600 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1 w-full items-center">
        <button
          onClick={onToggleVault}
          title={isVaultLocked ? 'Vault is Locked (AES-256-GCM)' : 'Vault is Unlocked (Encrypted Storage)'}
          className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
            isVaultLocked
              ? 'text-rose-400 hover:bg-rose-950/40'
              : 'text-emerald-400 hover:bg-emerald-950/40'
          }`}
        >
          {isVaultLocked ? (
            <ShieldAlert className="w-5 h-5 stroke-[1.75]" />
          ) : (
            <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
          )}
        </button>

        <button
          onClick={() => onTabChange('settings')}
          title="Settings (Ctrl+,)"
          className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
            activeTab === 'settings'
              ? 'text-white bg-neutral-800/80'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <Settings className="w-5 h-5 stroke-[1.75]" />
        </button>
      </div>
    </aside>
  );
};
