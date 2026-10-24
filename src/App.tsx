/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from 'react';
import { useIdeStore } from './store/useIdeStore';
import { Header } from './components/Header';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';
import { Editor } from './components/Editor';
import { Panel } from './components/Panel';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';

export default function App() {
  const store = useIdeStore();

  // Global Keyboard Shortcuts (Ctrl+S, Ctrl+B, Ctrl+J, Ctrl+Shift+P, Ctrl+P)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key === 'p') {
        e.preventDefault();
        store.setCommandPaletteOpen(!store.commandPaletteOpen);
      } else if (isCmdOrCtrl && e.key === 'b') {
        e.preventDefault();
        store.setIsSidebarCollapsed(!store.isSidebarCollapsed);
      } else if (isCmdOrCtrl && e.key === 'j') {
        e.preventDefault();
        store.setIsBottomPanelCollapsed(!store.isBottomPanelCollapsed);
      } else if (isCmdOrCtrl && e.key === 's') {
        e.preventDefault();
        store.saveActiveFile();
      } else if (isCmdOrCtrl && e.key === 'l') {
        e.preventDefault();
        store.setActiveSidebarTab('agent');
        store.setIsSidebarCollapsed(false);
      } else if (isCmdOrCtrl && e.key === '`') {
        e.preventDefault();
        store.setIsBottomPanelCollapsed(false);
        store.setBottomPanelTab('terminal');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [store]);

  // Run file in terminal
  const handleRunFile = useCallback(() => {
    store.setIsBottomPanelCollapsed(false);
    store.setBottomPanelTab('terminal');
    if (store.activeFile?.path.includes('dsp_processor')) {
      store.runTerminalCommand('dsp test');
    } else if (store.activeFile?.path.includes('vault_service')) {
      store.runTerminalCommand('vault status');
    } else {
      store.runTerminalCommand(`cat ${store.activeFile?.path || 'src/main.ts'}`);
    }
  }, [store]);

  // AI Refactor action
  const handleTriggerAiRefactor = useCallback(
    (promptText: string) => {
      store.setIsBottomPanelCollapsed(false);
      store.setBottomPanelTab('chat');
      store.runOrchestration(promptText);
    },
    [store]
  );

  // Apply code to active file
  const handleApplyCodeToActiveFile = useCallback(
    (newCode: string) => {
      if (store.activeTab?.fileId) {
        store.updateFileContent(store.activeTab.fileId, newCode);
      }
    },
    [store]
  );

  const activeLeadModel =
    store.models.find((m) => m.id === store.leadModelId) || store.models[0];
  const activeModelsCount = store.models.filter((m) => m.isActive).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#18181b] text-slate-100 font-sans antialiased">
      {/* Top Bar (Strict 3-Zone Contract) */}
      <Header
        activeNav={store.activeSidebarTab}
        onSelectNav={(tab) => {
          store.setActiveSidebarTab(tab);
          store.setIsSidebarCollapsed(false);
        }}
        onOpenCommandPalette={() => store.setCommandPaletteOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar (48px) */}
        <ActivityBar
          activeTab={store.activeSidebarTab}
          onTabChange={(tab) => {
            if (store.activeSidebarTab === tab && !store.isSidebarCollapsed) {
              store.setIsSidebarCollapsed(true);
            } else {
              store.setActiveSidebarTab(tab);
              store.setIsSidebarCollapsed(false);
            }
          }}
          isVaultLocked={store.isVaultLocked}
          onToggleVault={() => store.setIsVaultLocked(!store.isVaultLocked)}
          activeModelsCount={activeModelsCount}
          peersCount={store.peers.length}
        />

        {/* Collapsible Sidebar (288px) */}
        {!store.isSidebarCollapsed && (
          <Sidebar
            activeTab={store.activeSidebarTab}
            files={store.files}
            activeFileId={store.activeTab?.fileId}
            onOpenFile={store.openFile}
            onCreateNewItem={store.createNewItem}
            onDeleteItem={store.deleteItem}
            onRenameItem={store.renameItem}
            onDuplicateFile={store.duplicateFile}
            onDownloadFile={store.downloadFile}
            onTriggerAiAction={(item, actionType) => {
              store.setIsBottomPanelCollapsed(false);
              store.setBottomPanelTab('chat');
              if (item.id) {
                store.openFile(item.id);
              }
              let prompt = '';
              if (actionType === 'security') {
                prompt = `Perform a comprehensive Cyber Security and Edge-Case Vulnerability Audit for ${item.path}. Inspect injection, data validation, and secrets handling.`;
              } else if (actionType === 'test') {
                prompt = `Generate a robust unit test suite with edge-case tests (null/undefined, boundary values, exception handling) for ${item.path}.`;
              } else if (actionType === 'refactor') {
                prompt = `Refactor and optimize ${item.path} for peak performance, numerical stability, and strict zero-bloat compliance.`;
              } else if (actionType === 'explain') {
                prompt = `Explain the design patterns, architecture, and line-by-line internal mechanics of ${item.path}.`;
              } else if (actionType === 'folder_audit') {
                prompt = `Perform an architectural review and dependency graph audit for module directory ${item.path}.`;
              }
              store.runOrchestration(prompt);
            }}
            models={store.models}
            orchestrationMode={store.orchestrationMode}
            onSetOrchestrationMode={store.setOrchestrationMode}
            leadModelId={store.leadModelId}
            onSetLeadModelId={store.setLeadModelId}
            onUpdateModel={(updated) =>
              store.setModels((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
            }
            onProbeLocalModels={store.probeLocalModels}
            sharingMode={store.sharingMode}
            onSetSharingMode={store.handleSetSharingMode}
            peers={store.peers}
            modelGrants={store.modelGrants}
            onGrantAccess={store.handleGrantAccess}
            onRevokeAccess={store.handleRevokeAccess}
            isVaultLocked={store.isVaultLocked}
            onToggleVaultLock={() => store.setIsVaultLocked(!store.isVaultLocked)}
            vaultPassphrase={store.vaultPassphrase}
            onSetVaultPassphrase={store.setVaultPassphrase}
            searchQuery={store.searchQuery}
            onSetSearchQuery={store.setSearchQuery}
            replaceQuery={store.replaceQuery}
            onSetReplaceQuery={store.setReplaceQuery}
            soloAgentMode={store.soloAgentMode}
            onSetSoloAgentMode={store.setSoloAgentMode}
            soloAgentMessages={store.soloAgentMessages}
            isAgentRunning={store.isAgentRunning}
            onRunSoloAgentTask={store.runSoloAgentTask}
            onApplyAgentDiff={store.applyAgentDiff}
            onClearSoloAgentSession={store.clearSoloAgentSession}
            activeFileName={store.activeFile?.name}
          />
        )}

        {/* Editor & Bottom Panel Workspace Center */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#1e1e24]">
          {/* Tab Bar */}
          <TabBar
            tabs={store.openTabs}
            activeTabId={store.activeTabId}
            onSelectTab={store.setActiveTabId}
            onCloseTab={store.closeTab}
            onRunCurrentFile={handleRunFile}
          />

          {/* Central Code Editor */}
          <Editor
            file={store.activeFile}
            onContentChange={(val) => {
              if (store.activeTab?.fileId) {
                store.updateFileContent(store.activeTab.fileId, val);
              }
            }}
            onSave={store.saveActiveFile}
            peers={store.peers}
            onTriggerAiRefactor={handleTriggerAiRefactor}
          />

          {/* Bottom Dockable Panel (AI Chat, Terminal, Problems, Output, SQLite) */}
          <Panel
            activeTab={store.bottomPanelTab}
            onTabChange={store.setBottomPanelTab}
            isCollapsed={store.isBottomPanelCollapsed}
            onToggleCollapse={() =>
              store.setIsBottomPanelCollapsed(!store.isBottomPanelCollapsed)
            }
            chatMessages={store.chatMessages}
            onSendMessage={store.runOrchestration}
            isOrchestrating={store.isOrchestrating}
            orchestrationMode={store.orchestrationMode}
            terminalLines={store.terminalLines}
            onRunTerminalCommand={store.runTerminalCommand}
            diagnostics={store.diagnostics}
            onApplyCodeToActiveFile={handleApplyCodeToActiveFile}
          />
        </main>
      </div>

      {/* Status Bar (24px) */}
      <StatusBar
        activeLanguage={store.activeFile?.language || 'typescript'}
        activeModelsCount={activeModelsCount}
        leadModelName={activeLeadModel?.name || 'Gemini 3.8 Flash'}
        peersCount={store.peers.length}
        sharingMode={store.sharingMode}
        orchestrationMode={store.orchestrationMode}
        isVaultLocked={store.isVaultLocked}
        onOpenTerminal={() => {
          store.setIsBottomPanelCollapsed(false);
          store.setBottomPanelTab('terminal');
        }}
        onOpenAiTeam={() => {
          store.setIsBottomPanelCollapsed(false);
          store.setBottomPanelTab('chat');
        }}
        onOpenPeers={() => {
          store.setActiveSidebarTab('p2p');
          store.setIsSidebarCollapsed(false);
        }}
      />

      {/* Fuzzy Command Palette (Ctrl+Shift+P / Ctrl+P) */}
      <CommandPalette
        isOpen={store.commandPaletteOpen}
        onClose={() => store.setCommandPaletteOpen(false)}
        onOpenFile={store.openFile}
        onSelectSidebarTab={(tab) => {
          store.setActiveSidebarTab(tab);
          store.setIsSidebarCollapsed(false);
        }}
        onSelectPanelTab={(tab) => {
          store.setBottomPanelTab(tab);
          store.setIsBottomPanelCollapsed(false);
        }}
        onSetOrchestrationMode={store.setOrchestrationMode}
        onProbeLocalModels={store.probeLocalModels}
        onToggleVaultLock={() => store.setIsVaultLocked(!store.isVaultLocked)}
        isVaultLocked={store.isVaultLocked}
      />
    </div>
  );
}
