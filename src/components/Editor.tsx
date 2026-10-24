import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ShieldAlert,
  Save,
  Check,
  ChevronDown,
  X,
  Copy,
} from 'lucide-react';
import { FileItem, Peer } from '../types';

interface EditorProps {
  file: FileItem | null;
  onContentChange: (newContent: string) => void;
  onSave: () => void;
  peers: Peer[];
  onTriggerAiRefactor: (prompt: string) => void;
}

// Lightweight syntax tokenizer for TS/JS/JSON/Markdown
function tokenizeLine(line: string) {
  // Regex token rules
  const tokens: Array<{ text: string; color: string }> = [];

  // Match comments
  if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
    return [{ text: line, color: 'text-neutral-500 italic' }];
  }

  const parts = line.split(/(\s+|[(),.;:{}[\]<>=!+\-*/"'])/g);
  for (const part of parts) {
    if (!part) continue;

    if (
      [
        'import',
        'export',
        'from',
        'const',
        'let',
        'var',
        'function',
        'class',
        'return',
        'async',
        'await',
        'if',
        'else',
        'for',
        'while',
        'new',
        'typeof',
        'interface',
        'type',
        'public',
        'private',
        'protected',
      ].includes(part)
    ) {
      tokens.push({ text: part, color: 'text-indigo-400 font-medium' });
    } else if (['true', 'false', 'null', 'undefined'].includes(part)) {
      tokens.push({ text: part, color: 'text-amber-400' });
    } else if (
      ['string', 'number', 'boolean', 'void', 'any', 'Promise', 'CryptoKey', 'AudioContext', 'Float32Array', 'Uint8Array'].includes(
        part
      )
    ) {
      tokens.push({ text: part, color: 'text-emerald-400' });
    } else if (/^\d+$/.test(part)) {
      tokens.push({ text: part, color: 'text-teal-300' });
    } else if (part.startsWith('"') || part.startsWith("'") || part.startsWith('`')) {
      tokens.push({ text: part, color: 'text-lime-300' });
    } else if (/^[A-Z][a-zA-Z0-9]+$/.test(part)) {
      tokens.push({ text: part, color: 'text-sky-300' });
    } else {
      tokens.push({ text: part, color: 'text-neutral-200' });
    }
  }
  return tokens;
}

export const Editor: React.FC<EditorProps> = ({
  file,
  onContentChange,
  onSave,
  peers,
  onTriggerAiRefactor,
}) => {
  const [activeLine, setActiveLine] = useState<number>(1);
  const [findOpen, setFindOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = useMemo(() => {
    return (file?.content || '').split('\n');
  }, [file?.content]);

  // Handle Tab key indentation and Ctrl+S
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setFindOpen(true);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const updated = val.substring(0, start) + '  ' + val.substring(end);
      onContentChange(updated);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const updateCursorLine = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const textUpToCursor = target.value.substring(0, target.selectionStart);
    const lineNum = textUpToCursor.split('\n').length;
    setActiveLine(lineNum);
  };

  const copyToClipboard = () => {
    if (!file?.content) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e24] text-neutral-400 select-none">
        <Sparkles className="w-10 h-10 text-neutral-600 mb-3" />
        <h3 className="text-sm font-semibold text-neutral-300">No Open Document</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Select a file from the explorer or create a new one to begin editing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e24] relative overflow-hidden font-mono text-xs">
      {/* Quick Action Breadcrumb Toolbar */}
      <div className="h-7 px-3 bg-[#18181b] border-b border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 select-none shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-neutral-500">workspace</span>
          <span>/</span>
          <span className="text-neutral-200 font-medium">{file.path}</span>
          {file.isDirty && <span className="text-amber-400">● unsaved</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Peer Presence indicator on current file */}
          {peers.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-neutral-500">Collaborating:</span>
              <div className="flex -space-x-1">
                {peers.map((peer) => (
                  <span
                    key={peer.id}
                    title={`${peer.name} is online`}
                    className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[9px] font-bold text-white uppercase shadow-sm"
                    style={{ backgroundColor: peer.avatarColor }}
                  >
                    {peer.name[0]}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onTriggerAiRefactor(`Review and optimize code in ${file.name}`)}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-950/70 text-indigo-300 hover:bg-indigo-900 rounded border border-indigo-800/60 transition-colors text-[10px]"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" /> Ask AI Team
          </button>

          <button
            onClick={copyToClipboard}
            title="Copy code"
            className="p-1 hover:text-white rounded hover:bg-neutral-800"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          <button
            onClick={onSave}
            title="Save file (Ctrl+S)"
            className="p-1 hover:text-white rounded hover:bg-neutral-800"
          >
            <Save className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* In-Editor Search Floating Widget */}
      {findOpen && (
        <div className="absolute top-8 right-6 z-30 p-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl flex items-center gap-2 text-xs">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            autoFocus
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="Find in file..."
            className="bg-black border border-neutral-700 rounded px-2 py-0.5 text-white focus:outline-none focus:border-sky-500 text-xs w-44"
          />
          <span className="text-[10px] text-neutral-400 font-mono">
            {findQuery
              ? `${(file.content || '').split(findQuery).length - 1} matches`
              : '0 matches'}
          </span>
          <button
            onClick={() => setFindOpen(false)}
            className="p-0.5 text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Code View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Gutter */}
        <div className="w-12 bg-[#18181b] border-r border-neutral-800/80 py-2 flex flex-col text-right pr-3 select-none text-neutral-600 shrink-0 font-mono text-[11px] leading-5">
          {lines.map((_, index) => {
            const lineNum = index + 1;
            const isCurrent = lineNum === activeLine;
            return (
              <span
                key={index}
                className={`${isCurrent ? 'text-neutral-200 font-semibold' : ''}`}
              >
                {lineNum}
              </span>
            );
          })}
        </div>

        {/* Editor Surface: Transparent Textarea over Tokenized Layer */}
        <div className="flex-1 relative overflow-auto font-mono text-xs leading-5">
          {/* Syntax Tokenized Background Layer */}
          <div
            className="absolute inset-0 p-2 pl-3 pointer-events-none whitespace-pre overflow-hidden"
            aria-hidden="true"
          >
            {lines.map((lineText, lineIdx) => {
              const tokens = tokenizeLine(lineText);
              const isMatch = findQuery && lineText.includes(findQuery);
              return (
                <div
                  key={lineIdx}
                  className={`min-h-[20px] ${
                    isMatch ? 'bg-amber-500/20 rounded' : ''
                  }`}
                >
                  {tokens.map((token, tokIdx) => (
                    <span key={tokIdx} className={token.color}>
                      {token.text}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Interactive Transparent Textarea */}
          <textarea
            ref={textareaRef}
            value={file.content || ''}
            onChange={(e) => onContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={updateCursorLine}
            onClick={updateCursorLine}
            spellCheck={false}
            className="absolute inset-0 w-full h-full p-2 pl-3 bg-transparent text-transparent caret-white resize-none focus:outline-none font-mono text-xs leading-5 whitespace-pre overflow-auto"
            style={{ tabSize: 2 }}
          />
        </div>

        {/* Minimap Outline Preview */}
        <div className="w-16 bg-[#151518] border-l border-neutral-800/60 hidden md:flex flex-col py-2 px-1 select-none overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
          {lines.slice(0, 100).map((l, i) => (
            <div
              key={i}
              className={`h-[2px] my-[1px] rounded-xs ${
                l.trim().length > 0 ? 'bg-neutral-600' : 'bg-transparent'
              } ${i + 1 === activeLine ? 'bg-sky-400' : ''}`}
              style={{ width: `${Math.min(100, Math.max(10, l.length * 2))}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
