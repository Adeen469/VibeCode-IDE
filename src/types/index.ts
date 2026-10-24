export type ModelProvider =
  | 'gemini'
  | 'ollama'
  | 'lmstudio'
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'custom';

export type ModelCapability = 'chat' | 'tools' | 'vision' | 'reasoning' | 'code';

export type ModelRole =
  | 'active'
  | 'lead'
  | 'responder'
  | 'planner'
  | 'coder'
  | 'reviewer'
  | 'tester'
  | 'context_only';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  endpointUrl?: string;
  contextWindow: number;
  capabilities: ModelCapability[];
  isActive: boolean;
  role: ModelRole;
  encryptedKey?: string;
  status: 'online' | 'offline' | 'probing' | 'ready';
  latencyMs?: number;
  isLocal: boolean;
}

export type OrchestrationMode = 'single' | 'team' | 'pipeline';

export interface PipelineStep {
  stage: 'planner' | 'coder' | 'reviewer' | 'tester';
  model: string;
  role: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  durationMs?: number;
}

export interface SubTask {
  id: string;
  assignee: string;
  model: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

export interface TeamPlan {
  summary: string;
  subtasks: SubTask[];
  consensus?: string;
}

export type SharingMode = 'full_share' | 'context_only' | 'granular';
export type GrantType = 'context' | 'usage' | 'both';

export interface ModelGrant {
  peerId: string;
  modelId: string;
  grantType: GrantType;
  grantedAt: number;
  expiresAt?: number;
  signature: string;
}

export interface Peer {
  id: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  status: 'connected' | 'connecting' | 'disconnected';
  lastSeen: number;
  cursor?: {
    fileId: string;
    line: number;
    ch: number;
  };
  typingIndicator?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  content?: string;
  children?: FileItem[];
  language?: string;
  isDirty?: boolean;
  isModifiedGit?: boolean;
}

export interface EditorTab {
  id: string;
  fileId: string;
  name: string;
  path: string;
  language: string;
  isDirty: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'system' | 'model' | 'peer';
  senderName: string;
  avatarColor?: string;
  content: string;
  timestamp: number;
  modelId?: string;
  orchestrationMode?: OrchestrationMode;
  codeBlocks?: Array<{
    language: string;
    code: string;
  }>;
  pipelineSteps?: PipelineStep[];
  teamPlan?: TeamPlan;
}

export interface DiagnosticItem {
  id: string;
  file: string;
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: 'Compiler' | 'CyberSec Audit' | 'Edge AI Analyzer' | 'DSP Inspector';
}

export interface SecurityVaultStatus {
  isLocked: boolean;
  hasMasterKey: boolean;
  cipherAlgorithm: string;
  storedKeysCount: number;
  lastAccessTime?: number;
}

export type SoloAgentMode = 'agent' | 'chat' | 'edit';

export interface SoloAgentStep {
  id: string;
  type: 'think' | 'tool_call' | 'file_edit' | 'command_exec' | 'security_audit';
  title: string;
  status: 'running' | 'completed' | 'failed';
  detail?: string;
  diffCode?: string;
  filePath?: string;
}

export interface SoloAgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  model: string;
  mode: SoloAgentMode;
  steps?: SoloAgentStep[];
  codeDiff?: {
    filePath: string;
    newCode: string;
    accepted?: boolean;
  };
}

