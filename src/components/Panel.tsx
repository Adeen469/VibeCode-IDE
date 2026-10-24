import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Terminal,
  AlertCircle,
  Activity,
  Database,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Sparkles,
  Bot,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  CornerDownLeft,
} from 'lucide-react';
import {
  ChatMessage,
  DiagnosticItem,
  OrchestrationMode,
  PipelineStep,
  TeamPlan,
} from '../types';
import { SQL_INIT_DDL, getDatabaseTablesOverview } from '../utils/sql-schema';

interface PanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isOrchestrating: boolean;
  orchestrationMode: OrchestrationMode;
  terminalLines: Array<{ text: string; type: 'cmd' | 'out' | 'err' }>;
  onRunTerminalCommand: (cmd: string) => void;
  diagnostics: DiagnosticItem[];
  onApplyCodeToActiveFile: (code: string) => void;
}

export const Panel: React.FC<PanelProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  chatMessages,
  onSendMessage,
  isOrchestrating,
  orchestrationMode,
  terminalLines,
  onRunTerminalCommand,
  diagnostics,
  onApplyCodeToActiveFile,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat & terminal
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isOrchestrating]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isOrchestrating) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    onRunTerminalCommand(terminalInput.trim());
    setTerminalInput('');
  };

  if (isCollapsed) {
    return (
      <div className="h-8 bg-[#18181b] border-t border-neutral-800 flex items-center justify-between px-3 select-none shrink-0">
        <div className="flex items-center gap-4 text-xs font-medium text-neutral-400">
          <button
            onClick={() => {
              onToggleCollapse();
              onTabChange('chat');
            }}
            className="flex items-center gap-1.5 hover:text-white"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> AI Team Chat
          </button>
          <button
            onClick={() => {
              onToggleCollapse();
              onTabChange('terminal');
            }}
            className="flex items-center gap-1.5 hover:text-white"
          >
            <Terminal className="w-3.5 h-3.5" /> Terminal
          </button>
          <button
            onClick={() => {
              onToggleCollapse();
              onTabChange('problems');
            }}
            className="flex items-center gap-1.5 hover:text-white"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Problems ({diagnostics.length})
          </button>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:text-white text-neutral-400 rounded"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-64 bg-[#141416] border-t border-neutral-800 flex flex-col shrink-0 select-none overflow-hidden">
      {/* Panel Tab Navigation Bar */}
      <div className="h-8 bg-[#18181b] border-b border-neutral-800 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2 h-full text-xs">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center gap-1.5 px-2.5 h-full border-b-2 font-medium transition-colors ${
              activeTab === 'chat'
                ? 'border-sky-500 text-white bg-neutral-800/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>AI Team Orchestration</span>
            <span className="text-[10px] px-1 bg-neutral-800 text-neutral-400 rounded uppercase font-mono">
              {orchestrationMode}
            </span>
          </button>

          <button
            onClick={() => onTabChange('terminal')}
            className={`flex items-center gap-1.5 px-2.5 h-full border-b-2 font-medium transition-colors ${
              activeTab === 'terminal'
                ? 'border-sky-500 text-white bg-neutral-800/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => onTabChange('problems')}
            className={`flex items-center gap-1.5 px-2.5 h-full border-b-2 font-medium transition-colors ${
              activeTab === 'problems'
                ? 'border-sky-500 text-white bg-neutral-800/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Problems</span>
            <span className="text-[10px] px-1 bg-amber-950/70 text-amber-300 rounded font-mono tabular-nums">
              {diagnostics.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange('output')}
            className={`flex items-center gap-1.5 px-2.5 h-full border-b-2 font-medium transition-colors ${
              activeTab === 'output'
                ? 'border-sky-500 text-white bg-neutral-800/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Output & Logs</span>
          </button>

          <button
            onClick={() => onTabChange('database')}
            className={`flex items-center gap-1.5 px-2.5 h-full border-b-2 font-medium transition-colors ${
              activeTab === 'database'
                ? 'border-sky-500 text-white bg-neutral-800/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQLite Schema</span>
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          title="Minimize Panel"
          className="p-1 hover:text-white text-neutral-400 rounded"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {/* AI TEAM CHAT VIEW */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs select-text">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-lg border max-w-3xl ${
                    msg.sender === 'user'
                      ? 'bg-sky-950/40 border-sky-800/50 ml-auto'
                      : msg.sender === 'system'
                      ? 'bg-neutral-900/80 border-neutral-800 mr-auto'
                      : 'bg-indigo-950/30 border-indigo-800/40 mr-auto'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[11px] mb-1.5 border-b border-neutral-800/60 pb-1">
                    <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-sky-400" /> {msg.senderName}
                    </span>
                    <span className="text-[10px] text-neutral-500 tabular-nums">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed text-neutral-200">
                    {msg.content}
                  </div>

                  {/* Render Pipeline 4-Stage Breakdown if present */}
                  {msg.pipelineSteps && msg.pipelineSteps.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-neutral-800">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                        Pipeline Execution DAG (Sequential 4 Stages)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.pipelineSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-black/40 rounded border border-neutral-800 space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-neutral-300 capitalize">
                                {idx + 1}. {step.stage}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {step.model}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 line-clamp-3">
                              {step.output}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render Team Discussion Subtasks if present */}
                  {msg.teamPlan && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-neutral-800">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                        Team Subtasks & Consensus
                      </span>
                      <div className="space-y-1.5">
                        {msg.teamPlan.subtasks.map((task, tIdx) => (
                          <div
                            key={tIdx}
                            className="p-2 bg-black/40 rounded border border-neutral-800 text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between font-medium text-neutral-300">
                              <span>Specialist: {task.assignee}</span>
                              <span className="text-[10px] text-neutral-500">{task.model}</span>
                            </div>
                            <p className="text-neutral-400 text-[10px] line-clamp-3">{task.output}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isOrchestrating && (
                <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs flex items-center gap-2 text-sky-400 animate-pulse max-w-sm">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>AI Team is analyzing context, delegating subtasks, and synthesizing...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input & Suggestion Bar */}
            <div className="p-2 bg-[#18181b] border-t border-neutral-800 shrink-0">
              {/* Quick Prompt Chips */}
              <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto no-scrollbar text-[11px]">
                <button
                  type="button"
                  onClick={() => onSendMessage('Implement Direct Form II Biquad Audio Filter with test cases')}
                  className="px-2 py-0.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded whitespace-nowrap"
                >
                  + Add Biquad Filter
                </button>
                <button
                  type="button"
                  onClick={() => onSendMessage('Audit security of cryptographic storage and derive random salt')}
                  className="px-2 py-0.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded whitespace-nowrap"
                >
                  + Audit Cryptographic Vault
                </button>
                <button
                  type="button"
                  onClick={() => onSendMessage('Run full 4-stage pipeline: Planner, Coder, Reviewer, Tester')}
                  className="px-2 py-0.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded whitespace-nowrap"
                >
                  + Run Full Pipeline
                </button>
              </div>

              <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask AI Team (${orchestrationMode} mode)...`}
                  disabled={isOrchestrating}
                  className="flex-1 px-3 py-1.5 bg-black border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isOrchestrating}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-800 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TERMINAL VIEW */}
        {activeTab === 'terminal' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-black font-mono text-xs select-text">
            {/* Terminal Lines Output */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {terminalLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    line.type === 'cmd'
                      ? 'text-sky-400 font-semibold'
                      : line.type === 'err'
                      ? 'text-rose-400'
                      : 'text-neutral-300'
                  }`}
                >
                  {line.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Input Bar with Quick Commands */}
            <div className="p-2 bg-neutral-950 border-t border-neutral-900 shrink-0">
              <div className="flex items-center gap-1 mb-1 text-[10px] text-neutral-400 overflow-x-auto no-scrollbar">
                <span className="text-neutral-600">Quick:</span>
                {['help', 'ls', 'git status', 'ai models', 'ai probe', 'dsp test', 'vault status', 'clear'].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onRunTerminalCommand(c)}
                      className="px-1.5 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded font-mono"
                    >
                      {c}
                    </button>
                  )
                )}
              </div>

              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="type command (e.g. 'help', 'git status', 'dsp test')..."
                  className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-xs placeholder-neutral-600"
                />
              </form>
            </div>
          </div>
        )}

        {/* PROBLEMS VIEW */}
        {activeTab === 'problems' && (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
            <div className="space-y-1.5">
              {diagnostics.map((diag) => (
                <div
                  key={diag.id}
                  className="flex items-start gap-2.5 p-2 bg-neutral-900/60 rounded border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      diag.severity === 'error'
                        ? 'text-rose-400'
                        : diag.severity === 'warning'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                    }`}
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-neutral-200">
                        {diag.file}:{diag.line}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold">
                        [{diag.source}]
                      </span>
                    </div>
                    <p className="text-neutral-300 text-xs">{diag.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OUTPUT & LOGS VIEW */}
        {activeTab === 'output' && (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-neutral-400 space-y-1 select-text">
            <p className="text-neutral-500">[04:18:00] [VibeCode Runtime] Core engine bootstrap complete.</p>
            <p className="text-neutral-500">[04:18:01] [WebRTC] STUN candidates initialized (stun.l.google.com:19302).</p>
            <p className="text-neutral-500">[04:18:02] [DataChannel] P2P channel 'vibecode_p2p_vibecode-global' open.</p>
            <p className="text-emerald-400">[04:18:05] [Database] SQLite foreign key enforcement active (PRAGMA foreign_keys = ON).</p>
            <p className="text-sky-400">[04:18:06] [Security] AES-256-GCM cipher suite verified with PBKDF2 (100k rounds).</p>
            <p className="text-neutral-300">[04:18:07] [AI Orchestrator] Ready in {orchestrationMode} mode.</p>
          </div>
        )}

        {/* DATABASE VIEW */}
        {activeTab === 'database' && (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">
                SQLite 8-Table Relational Schema
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SQL_INIT_DDL);
                  alert('SQLite DDL copied to clipboard!');
                }}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px]"
              >
                Copy SQL DDL
              </button>
            </div>
            <pre className="p-2.5 bg-black rounded border border-neutral-800 text-[11px] text-neutral-300 overflow-x-auto leading-relaxed">
              {SQL_INIT_DDL.trim()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
