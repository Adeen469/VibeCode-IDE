import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Check,
  GitCommit,
  Radio,
  Wifi,
  WifiOff,
  Shield,
  Key,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Edit3,
  Copy,
  Download,
  FolderPlus,
  FilePlus,
  ClipboardCopy,
  ShieldAlert,
  FlaskConical,
  Code2,
  File,
} from 'lucide-react';
import {
  FileItem,
  AIModel,
  OrchestrationMode,
  SharingMode,
  Peer,
  ModelGrant,
  ModelRole,
} from '../types';
import { getDatabaseTablesOverview } from '../utils/sql-schema';

interface SidebarProps {
  activeTab: string;
  files: FileItem[];
  activeFileId?: string;
  onOpenFile: (fileId: string) => void;
  onCreateNewItem: (name: string, isDirectory: boolean, parentPath?: string) => void;
  onDeleteItem: (id: string) => void;
  onRenameItem: (id: string, newName: string) => void;
  onDuplicateFile: (id: string) => void;
  onDownloadFile: (id: string) => void;
  onTriggerAiAction: (item: FileItem, actionType: 'security' | 'test' | 'refactor' | 'explain' | 'folder_audit') => void;
  models: AIModel[];
  orchestrationMode: OrchestrationMode;
  onSetOrchestrationMode: (mode: OrchestrationMode) => void;
  leadModelId: string;
  onSetLeadModelId: (modelId: string) => void;
  onUpdateModel: (updated: AIModel) => void;
  onProbeLocalModels: () => void;
  sharingMode: SharingMode;
  onSetSharingMode: (mode: SharingMode) => void;
  peers: Peer[];
  modelGrants: ModelGrant[];
  onGrantAccess: (peerId: string, modelId: string, type: 'context' | 'usage' | 'both') => void;
  onRevokeAccess: (peerId: string, modelId: string) => void;
  isVaultLocked: boolean;
  onToggleVaultLock: () => void;
  vaultPassphrase: string;
  onSetVaultPassphrase: (pass: string) => void;
  searchQuery: string;
  onSetSearchQuery: (q: string) => void;
  replaceQuery: string;
  onSetReplaceQuery: (q: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  files,
  activeFileId,
  onOpenFile,
  onCreateNewItem,
  onDeleteItem,
  onRenameItem,
  onDuplicateFile,
  onDownloadFile,
  onTriggerAiAction,
  models,
  orchestrationMode,
  onSetOrchestrationMode,
  leadModelId,
  onSetLeadModelId,
  onUpdateModel,
  onProbeLocalModels,
  sharingMode,
  onSetSharingMode,
  peers,
  modelGrants,
  onGrantAccess,
  onRevokeAccess,
  isVaultLocked,
  onToggleVaultLock,
  vaultPassphrase,
  onSetVaultPassphrase,
  searchQuery,
  onSetSearchQuery,
  replaceQuery,
  onSetReplaceQuery,
}) => {
  // Local state for modals and forms
  const [newFileName, setNewFileName] = useState('');
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [isAddingDirectory, setIsAddingDirectory] = useState(false);
  const [customModelOpen, setCustomModelOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'f-root': true,
    'f-src': true,
  });

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    item: FileItem;
  } | null>(null);

  // Inline rename state
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    currentName: string;
    isDirectory: boolean;
  } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Folder new item modal state
  const [folderNewItemTarget, setFolderNewItemTarget] = useState<{
    parentPath: string;
    isDirectory: boolean;
  } | null>(null);
  const [folderNewName, setFolderNewName] = useState('');

  // Copy notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setRenameTarget(null);
        setFolderNewItemTarget(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.js')) {
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    if (fileName.endsWith('.json')) {
      return <FileJson className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-neutral-400 shrink-0" />;
  };

  // Trigger Context Menu
  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    e.stopPropagation();

    // Clamp inside viewport
    const menuWidth = 230;
    const menuHeight = item.isDirectory ? 260 : 380;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);

    setContextMenu({
      visible: true,
      x: Math.max(8, x),
      y: Math.max(8, y),
      item,
    });
  };

  // Start inline rename
  const handleStartRename = (item: FileItem) => {
    setRenameTarget({
      id: item.id,
      currentName: item.name,
      isDirectory: item.isDirectory,
    });
    setRenameValue(item.name);
    setContextMenu(null);
  };

  // Submit inline rename
  const handleConfirmRename = () => {
    if (renameTarget && renameValue.trim()) {
      onRenameItem(renameTarget.id, renameValue.trim());
      showToast(`Renamed to ${renameValue.trim()}`);
    }
    setRenameTarget(null);
    setRenameValue('');
  };

  // Render Recursive File Tree
  const renderTree = (items: FileItem[], level = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders[item.id] ?? true;
      const isActive = item.id === activeFileId;
      const isRenaming = renameTarget?.id === item.id;

      if (item.isDirectory) {
        return (
          <div key={item.id} className="select-none">
            <div
              onClick={() => toggleFolder(item.id)}
              onContextMenu={(e) => handleContextMenu(e, item)}
              className="flex items-center justify-between py-1 px-2 hover:bg-neutral-800/60 rounded text-neutral-300 hover:text-white cursor-pointer text-xs font-medium group transition-colors"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-sky-500 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-sky-500 shrink-0" />
                )}

                {isRenaming ? (
                  <input
                    type="text"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmRename();
                      if (e.key === 'Escape') setRenameTarget(null);
                    }}
                    onBlur={handleConfirmRename}
                    onClick={(e) => e.stopPropagation()}
                    className="px-1 py-0.5 bg-black border border-sky-500 rounded text-xs text-white font-mono focus:outline-none w-full"
                  />
                ) : (
                  <span className="truncate">{item.name}</span>
                )}
              </div>

              {/* Quick Hover Add Button */}
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderNewItemTarget({ parentPath: item.path, isDirectory: false });
                    setFolderNewName('');
                  }}
                  title="New File in this folder"
                  className="p-1 hover:text-sky-400 text-neutral-500 rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            {isExpanded && item.children && renderTree(item.children, level + 1)}
          </div>
        );
      }

      return (
        <div
          key={item.id}
          onClick={() => onOpenFile(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          className={`group flex items-center justify-between py-1 px-2 rounded cursor-pointer text-xs font-mono transition-colors ${
            isActive
              ? 'bg-neutral-800 text-white font-medium'
              : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200'
          }`}
          style={{ paddingLeft: `${level * 12 + 20}px` }}
        >
          <div className="flex items-center gap-2 truncate flex-1 min-w-0">
            {getFileIcon(item.name)}
            {isRenaming ? (
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') setRenameTarget(null);
                }}
                onBlur={handleConfirmRename}
                onClick={(e) => e.stopPropagation()}
                className="px-1 py-0.5 bg-black border border-sky-500 rounded text-xs text-white font-mono focus:outline-none w-full"
              />
            ) : (
              <span className="truncate">{item.name}</span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, item);
              }}
              title="More actions (Right-click)"
              className="p-1 hover:text-neutral-200 text-neutral-500 rounded"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${item.name}?`)) onDeleteItem(item.id);
              }}
              title="Delete File"
              className="p-1 hover:text-rose-400 text-neutral-500 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="w-72 bg-[#18181b] border-r border-neutral-800 flex flex-col h-full shrink-0 select-none overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-11 left-3 right-3 z-40 bg-neutral-900 border border-sky-600/80 text-sky-300 text-xs py-1.5 px-3 rounded shadow-lg flex items-center justify-between animate-fade-in font-mono">
          <span>{toastMessage}</span>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      )}

      {/* Sidebar Header */}
      <div className="h-9 px-3 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 truncate">
          {activeTab === 'explorer' && 'Explorer: Workspace'}
          {activeTab === 'search' && 'Search in Workspace'}
          {activeTab === 'git' && 'Source Control'}
          {activeTab === 'models' && 'AI Model Registry & Team'}
          {activeTab === 'p2p' && 'P2P Team & Model Grants'}
          {activeTab === 'database' && 'SQLite Schema & Vault'}
          {activeTab === 'settings' && 'Workspace Preferences'}
        </span>
        {activeTab === 'explorer' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsAddingFile(true);
                setIsAddingDirectory(false);
              }}
              title="New File in /src"
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsAddingDirectory(true);
                setIsAddingFile(false);
              }}
              title="New Folder in /src"
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
            >
              <Folder className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Explorer View */}
      {activeTab === 'explorer' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 relative">
          {/* Top-level new file / folder prompt */}
          {(isAddingFile || isAddingDirectory) && (
            <div className="p-2 bg-neutral-900 border border-neutral-700 rounded text-xs space-y-1.5">
              <span className="text-[11px] text-neutral-400 font-medium">
                {isAddingFile ? 'Enter file name (.ts, .json, .md)' : 'Enter folder name'}
              </span>
              <input
                type="text"
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFileName.trim()) {
                    onCreateNewItem(newFileName.trim(), isAddingDirectory);
                    setNewFileName('');
                    setIsAddingFile(false);
                    setIsAddingDirectory(false);
                  } else if (e.key === 'Escape') {
                    setIsAddingFile(false);
                    setIsAddingDirectory(false);
                  }
                }}
                placeholder={isAddingFile ? 'service.ts' : 'components'}
                className="w-full px-2 py-1 bg-black border border-neutral-700 rounded text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setIsAddingFile(false);
                    setIsAddingDirectory(false);
                  }}
                  className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newFileName.trim()) {
                      onCreateNewItem(newFileName.trim(), isAddingDirectory);
                      setNewFileName('');
                      setIsAddingFile(false);
                      setIsAddingDirectory(false);
                    }
                  }}
                  className="px-2 py-0.5 text-[11px] bg-sky-600 text-white rounded hover:bg-sky-500"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* New Item in Specific Folder Dialog */}
          {folderNewItemTarget && (
            <div className="p-2 bg-neutral-900 border border-sky-500/80 rounded text-xs space-y-1.5">
              <span className="text-[11px] text-sky-300 font-medium truncate block">
                {folderNewItemTarget.isDirectory ? 'New Folder in' : 'New File in'}{' '}
                {folderNewItemTarget.parentPath}
              </span>
              <input
                type="text"
                autoFocus
                value={folderNewName}
                onChange={(e) => setFolderNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && folderNewName.trim()) {
                    onCreateNewItem(
                      folderNewName.trim(),
                      folderNewItemTarget.isDirectory,
                      folderNewItemTarget.parentPath
                    );
                    setFolderNewItemTarget(null);
                    setFolderNewName('');
                  } else if (e.key === 'Escape') {
                    setFolderNewItemTarget(null);
                  }
                }}
                placeholder={folderNewItemTarget.isDirectory ? 'audio_filters' : 'filter.ts'}
                className="w-full px-2 py-1 bg-black border border-neutral-700 rounded text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setFolderNewItemTarget(null)}
                  className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (folderNewName.trim()) {
                      onCreateNewItem(
                        folderNewName.trim(),
                        folderNewItemTarget.isDirectory,
                        folderNewItemTarget.parentPath
                      );
                      setFolderNewItemTarget(null);
                      setFolderNewName('');
                    }
                  }}
                  className="px-2 py-0.5 text-[11px] bg-sky-600 text-white rounded hover:bg-sky-500"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Files List */}
          <div className="space-y-0.5">{renderTree(files)}</div>
        </div>
      )}

      {/* RIGHT-CLICK CONTEXT MENU (Rendered as floating layer) */}
      {contextMenu?.visible && (
        <div
          ref={menuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-56 bg-[#1f1f24] border border-neutral-700/80 rounded-md shadow-2xl py-1 text-xs font-mono text-neutral-200 select-none animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header indicator with item name */}
          <div className="px-2.5 py-1 text-[10px] text-neutral-400 font-medium border-b border-neutral-800/80 truncate flex items-center justify-between">
            <span className="truncate">{contextMenu.item.name}</span>
            <span className="text-[9px] uppercase text-neutral-500 font-mono">
              {contextMenu.item.isDirectory ? 'dir' : 'file'}
            </span>
          </div>

          {/* FILE ACTIONS */}
          {!contextMenu.item.isDirectory ? (
            <>
              <button
                onClick={() => {
                  onOpenFile(contextMenu.item.id);
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-neutral-800 flex items-center gap-2 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-sky-400" />
                <span>Open</span>
              </button>

              <button
                onClick={() => handleStartRename(contextMenu.item)}
                className="w-full px-2.5 py-1.5 text-left hover:bg-neutral-800 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Rename...</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">F2</span>
              </button>

              <button
                onClick={() => {
                  onDuplicateFile(contextMenu.item.id);
                  showToast(`Cloned ${contextMenu.item.name}`);
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-neutral-800 flex items-center gap-2 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Duplicate File</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(contextMenu.item.path);
                  showToast('Path copied to clipboard');
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-neutral-800 flex items-center gap-2 transition-colors"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy Relative Path</span>
              </button>

              <button
                onClick={() => {
                  onDownloadFile(contextMenu.item.id);
                  showToast(`Exported ${contextMenu.item.name}`);
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-neutral-800 flex items-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>Download / Export</span>
              </button>

              {/* AI Team Analysis Sub-actions */}
              <div className="my-1 border-t border-neutral-800/80" />
              <div className="px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider text-indigo-400">
                AI Team Actions
              </div>

              <button
                onClick={() => {
                  onTriggerAiAction(contextMenu.item, 'security');
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-indigo-950/60 text-indigo-300 flex items-center gap-2 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Security & Vulnerability Audit</span>
              </button>

              <button
                onClick={() => {
                  onTriggerAiAction(contextMenu.item, 'test');
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-indigo-950/60 text-indigo-300 flex items-center gap-2 transition-colors"
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                <span>Generate Unit Tests</span>
              </button>

              <button
                onClick={() => {
                  onTriggerAiAction(contextMenu.item, 'refactor');
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-indigo-950/60 text-indigo-300 flex items-center gap-2 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Optimize & Zero-Bloat Refactor</span>
              </button>

              <button
                onClick={() => {
                  onTriggerAiAction(contextMenu.item, 'explain');
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-indigo-950/60 text-indigo-300 flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Explain Code Architecture</span>
              </button>

              <div className="my-1 border-t border-neutral-800/80" />

              <button
                onClick={() => {
                  const target = contextMenu.item;
                  setContextMenu(null);
                  if (confirm(`Are you sure you want to delete ${target.name}?`)) {
                    onDeleteItem(target.id);
                    showToast(`Deleted ${target.name}`);
                  }
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-rose-950/60 text-rose-400 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete File</span>
              </button>
            </>
          ) : (
            /* FOLDER ACTIONS */
            <>
              <button
                onClick={() => {
                  setFolderNewItemTarget({
                    parentPath: contextMenu.item.path,
                    isDirectory: false,
                  });
                  setFolderNewName('');
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-neutral-800 flex items-center gap-2 transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5 text-sky-400" />
                <span>New File in Folder...</span>
              </button>

              <button
                onClick={() => {
                  setFolderNewItemTarget({
                    parentPath: contextMenu.item.path,
                    isDirectory: true,
                  });
                  setFolderNewName('');
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-neutral-800 flex items-center gap-2 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>New Folder in Folder...</span>
              </button>

              <button
                onClick={() => handleStartRename(contextMenu.item)}
                className="w-full px-2.5 py-1.5 text-left hover:bg-neutral-800 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Rename Folder...</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">F2</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(contextMenu.item.path);
                  showToast('Folder path copied');
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-neutral-800 flex items-center gap-2 transition-colors"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy Path</span>
              </button>

              <div className="my-1 border-t border-neutral-800/80" />

              <button
                onClick={() => {
                  onTriggerAiAction(contextMenu.item, 'folder_audit');
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-indigo-950/60 text-indigo-300 flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Team: Audit Entire Module</span>
              </button>

              <div className="my-1 border-t border-neutral-800/80" />

              <button
                onClick={() => {
                  const target = contextMenu.item;
                  setContextMenu(null);
                  if (confirm(`Delete folder '${target.name}' and all its contents?`)) {
                    onDeleteItem(target.id);
                    showToast(`Deleted folder ${target.name}`);
                  }
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-rose-950/60 text-rose-400 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Folder</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Search View */}
      {activeTab === 'search' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSetSearchQuery(e.target.value)}
                placeholder="Search (files, symbols)..."
                className="w-full pl-7 pr-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2.5" />
            </div>

            <div className="relative">
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => onSetReplaceQuery(e.target.value)}
                placeholder="Replace with..."
                className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 font-medium">
            {searchQuery ? 'Matches across workspace:' : 'Type query to find symbol occurrences.'}
          </div>

          {searchQuery && (
            <div className="space-y-1 text-xs font-mono">
              <div className="p-2 bg-neutral-900/60 rounded border border-neutral-800">
                <span className="text-sky-400 font-semibold">src/main.ts</span>
                <p className="text-neutral-300 text-[11px] mt-1 pl-2 border-l border-neutral-700">
                  line 4: initializeRuntime() - matched "{searchQuery}"
                </p>
              </div>
              <div className="p-2 bg-neutral-900/60 rounded border border-neutral-800">
                <span className="text-sky-400 font-semibold">src/audio/dsp_processor.ts</span>
                <p className="text-neutral-300 text-[11px] mt-1 pl-2 border-l border-neutral-700">
                  line 18: setBiquadFilter() - parameter validation
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source Control / Git View */}
      {activeTab === 'git' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="flex items-center gap-1.5 font-medium">
              <GitCommit className="w-4 h-4 text-emerald-400" /> branch main
            </span>
            <span className="text-neutral-500 text-[11px]">Synced</span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium text-neutral-400">Commit Message</label>
            <textarea
              rows={3}
              placeholder="feat(orchestrator): add subtask DAG resolution..."
              className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono resize-none"
            />
            <button
              onClick={() => alert('Changes committed to local git tree.')}
              className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Commit to Local Git
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
              Working Tree Changes
            </span>
            <div className="p-2 bg-neutral-900/50 rounded border border-neutral-800 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-amber-400">
                <span>M src/audio/dsp_processor.ts</span>
                <span className="text-[10px] text-neutral-500">+12 -2</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>A src/security/vault_service.ts</span>
                <span className="text-[10px] text-neutral-500">+48</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Models & Orchestrator View */}
      {activeTab === 'models' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Orchestration Mode Picker */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
              Orchestration Mode
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
              <button
                onClick={() => onSetOrchestrationMode('single')}
                className={`py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                  orchestrationMode === 'single'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Single
              </button>
              <button
                onClick={() => onSetOrchestrationMode('team')}
                className={`py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                  orchestrationMode === 'team'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Team
              </button>
              <button
                onClick={() => onSetOrchestrationMode('pipeline')}
                className={`py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                  orchestrationMode === 'pipeline'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Pipeline
              </button>
            </div>
            <p className="text-[10px] text-neutral-400">
              {orchestrationMode === 'single' && 'One model responds while others monitor context.'}
              {orchestrationMode === 'team' && 'Team Lead breaks request into subtasks, executes in parallel, synthesizes consensus.'}
              {orchestrationMode === 'pipeline' && 'Sequential 4-stage pipeline: Planner → Coder → Reviewer → Tester.'}
            </p>
          </div>

          {/* Local Auto-Discovery Probe */}
          <div className="flex items-center justify-between p-2 bg-neutral-900 rounded border border-neutral-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <div>
                <p className="text-xs font-medium text-white">Local Auto-Discovery</p>
                <p className="text-[10px] text-neutral-400">Ollama (11434) & LM Studio (1234)</p>
              </div>
            </div>
            <button
              onClick={onProbeLocalModels}
              title="Probe local ports"
              className="p-1.5 hover:bg-neutral-800 text-sky-400 rounded transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Model Registry List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
                Registered Models ({models.length})
              </span>
              <button
                onClick={() => setCustomModelOpen(true)}
                className="text-[11px] text-sky-400 hover:underline"
              >
                + Register BYOK
              </button>
            </div>

            <div className="space-y-2">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    model.isActive
                      ? 'bg-neutral-900 border-neutral-700'
                      : 'bg-neutral-950/60 border-neutral-800 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            model.status === 'online'
                              ? 'bg-emerald-500'
                              : model.status === 'probing'
                              ? 'bg-amber-500'
                              : 'bg-neutral-500'
                          }`}
                        />
                        <span className="font-medium text-white truncate max-w-[140px]">
                          {model.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                        <span className="uppercase">{model.provider}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{model.latencyMs || 45}ms</span>
                        <span>·</span>
                        <span>{model.isLocal ? 'Local GPU' : 'Cloud API'}</span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={model.isActive}
                        onChange={(e) =>
                          onUpdateModel({ ...model, isActive: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  {/* Role Assignment */}
                  <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Assigned Role:</span>
                    <select
                      value={model.role}
                      onChange={(e) =>
                        onUpdateModel({
                          ...model,
                          role: e.target.value as ModelRole,
                        })
                      }
                      className="bg-black border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200 text-[11px] focus:outline-none focus:border-sky-500"
                    >
                      <option value="lead">Team Lead</option>
                      <option value="responder">Responder</option>
                      <option value="planner">Planner</option>
                      <option value="coder">Coder</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="tester">Tester</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* P2P Collaboration & Granular Grants View */}
      {activeTab === 'p2p' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">P2P Network Room</span>
              <span className="text-[10px] font-mono text-emerald-400">WebRTC DataChannel</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Host: <span className="text-white font-mono">vibecode-global</span>
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Invite link copied!');
              }}
              className="w-full py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-center transition-colors font-medium"
            >
              Copy Peer Invite Link
            </button>
          </div>

          {/* Sharing Mode Picker */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
              P2P Sharing Mode
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-[11px]">
              <button
                onClick={() => onSetSharingMode('full_share')}
                className={`py-1 rounded font-medium transition-colors ${
                  sharingMode === 'full_share' ? 'bg-sky-600 text-white' : 'text-neutral-400'
                }`}
              >
                Full Share
              </button>
              <button
                onClick={() => onSetSharingMode('context_only')}
                className={`py-1 rounded font-medium transition-colors ${
                  sharingMode === 'context_only' ? 'bg-sky-600 text-white' : 'text-neutral-400'
                }`}
              >
                Context Only
              </button>
              <button
                onClick={() => onSetSharingMode('granular')}
                className={`py-1 rounded font-medium transition-colors ${
                  sharingMode === 'granular' ? 'bg-sky-600 text-white' : 'text-neutral-400'
                }`}
              >
                Granular
              </button>
            </div>
          </div>

          {/* Connected Peers List */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
              Connected Peers ({peers.length})
            </span>
            <div className="space-y-1">
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between p-2 bg-neutral-900 rounded border border-neutral-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: peer.avatarColor }}
                    />
                    <span className="text-white font-medium">{peer.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">Active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Granular Model Grants Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
                Granular Grants Matrix
              </span>
              <Shield className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-[10px] text-neutral-400">
              Zero Security Theater: Remote model calls are cryptographically validated against signed grant tokens.
            </p>

            <div className="space-y-2">
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className="p-2.5 bg-neutral-900/80 rounded-lg border border-neutral-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                    <span className="font-semibold text-neutral-200">{peer.name}</span>
                    <span className="text-[10px] font-mono text-neutral-500">{peer.id}</span>
                  </div>

                  <div className="space-y-1.5">
                    {models.slice(0, 3).map((model) => {
                      const currentGrant = modelGrants.find(
                        (g) => g.peerId === peer.id && g.modelId === model.id
                      );
                      return (
                        <div
                          key={model.id}
                          className="flex items-center justify-between gap-1 text-[11px]"
                        >
                          <span className="truncate max-w-[100px] text-neutral-300">
                            {model.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onGrantAccess(peer.id, model.id, 'context')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                currentGrant?.grantType === 'context'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              Context
                            </button>
                            <button
                              onClick={() => onGrantAccess(peer.id, model.id, 'usage')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                currentGrant?.grantType === 'usage'
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              Usage
                            </button>
                            <button
                              onClick={() => onGrantAccess(peer.id, model.id, 'both')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                currentGrant?.grantType === 'both'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              Both
                            </button>
                            {currentGrant && (
                              <button
                                onClick={() => onRevokeAccess(peer.id, model.id)}
                                title="Revoke Grant"
                                className="p-0.5 text-neutral-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SQLite Database Schema & Vault View */}
      {activeTab === 'database' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Master Vault Lock / Unlock */}
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Cryptographic Vault</span>
              <button
                onClick={onToggleVaultLock}
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                {isVaultLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-400" /> Unlock
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Lock
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-neutral-400">
              AES-256-GCM cipher with PBKDF2 (100k rounds). Zero plaintext storage.
            </p>
            {!isVaultLocked && (
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-mono">Master Passphrase:</label>
                <input
                  type="password"
                  value={vaultPassphrase}
                  onChange={(e) => onSetVaultPassphrase(e.target.value)}
                  className="w-full px-2 py-1 bg-black border border-neutral-700 rounded text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>

          {/* SQLite 8-Table Schema Overview */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
              SQLite Tables (SQLCipher)
            </span>
            <div className="space-y-2">
              {getDatabaseTablesOverview().map((table) => (
                <div
                  key={table.name}
                  className="p-2.5 bg-neutral-900/60 rounded border border-neutral-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-sky-400 font-semibold">{table.name}</span>
                    <span className="text-[10px] text-neutral-500 tabular-nums">
                      {table.rowCount} rows
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">{table.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {table.columns.slice(0, 4).map((col) => (
                      <span
                        key={col}
                        className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded"
                      >
                        {col}
                      </span>
                    ))}
                    {table.columns.length > 4 && (
                      <span className="text-[10px] font-mono text-neutral-500">
                        +{table.columns.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings View */}
      {activeTab === 'settings' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-400">Editor Theme</label>
            <select className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white">
              <option>VS Code Dark+ (Default)</option>
              <option>Tokyo Night Clean</option>
              <option>Monokai Pro</option>
              <option>GitHub Dark High Contrast</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-neutral-400">Font Family</label>
            <input
              type="text"
              readOnly
              value="JetBrains Mono, monospace"
              className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-neutral-300 font-mono text-[11px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-400">Tab Size</label>
            <select className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white">
              <option>2 spaces</option>
              <option>4 spaces</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-neutral-400">Zero-Cost Policy</label>
            <div className="p-2 bg-neutral-900 rounded border border-neutral-800 text-[11px] text-neutral-400">
              Permanently enforced: zero paid services, BYOK only, local storage, WebRTC P2P direct sync.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
