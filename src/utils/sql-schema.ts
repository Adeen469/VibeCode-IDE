/**
 * SQLite & SQLCipher Relational Database Layer Representation
 * Corresponds to VibeCode IDE context schema:
 * 8 Tables: models, projects, conversations, messages, teams, team_members, model_grants, settings.
 */

export const SQL_INIT_DDL = `
-- VibeCode IDE SQLite Schema (with SQLCipher encryption)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('gemini', 'ollama', 'lmstudio', 'openai', 'anthropic', 'openrouter', 'custom')),
  endpoint_url TEXT,
  context_window INTEGER NOT NULL DEFAULT 8192,
  capabilities TEXT NOT NULL, -- JSON array
  is_active INTEGER NOT NULL DEFAULT 1,
  role TEXT NOT NULL DEFAULT 'responder',
  encrypted_key TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  active_models TEXT NOT NULL, -- JSON array of model IDs
  team_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'team' CHECK(mode IN ('single', 'team', 'pipeline')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK(sender IN ('user', 'system', 'model', 'peer')),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  model_id TEXT,
  metadata TEXT, -- JSON object for subtasks/plan
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sharing_mode TEXT NOT NULL DEFAULT 'granular' CHECK(sharing_mode IN ('full_share', 'context_only', 'granular')),
  owner_peer_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  peer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'collaborator',
  joined_at INTEGER NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS model_grants (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  peer_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  grant_type TEXT NOT NULL CHECK(grant_type IN ('context', 'usage', 'both')),
  granted_at INTEGER NOT NULL,
  signature TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_grants_peer ON model_grants(peer_id, model_id);
`;

export interface TableSummary {
  name: string;
  columns: string[];
  rowCount: number;
  description: string;
}

export function getDatabaseTablesOverview(): TableSummary[] {
  return [
    {
      name: 'models',
      columns: ['id', 'name', 'provider', 'endpoint_url', 'context_window', 'capabilities', 'role', 'encrypted_key'],
      rowCount: 4,
      description: 'Registered AI providers with AES-256-GCM encrypted API credentials',
    },
    {
      name: 'projects',
      columns: ['id', 'name', 'path', 'active_models', 'team_id', 'created_at'],
      rowCount: 1,
      description: 'Local workspace projects and active model bindings',
    },
    {
      name: 'conversations',
      columns: ['id', 'project_id', 'title', 'mode', 'created_at'],
      rowCount: 2,
      description: 'Chat sessions, multi-model team threads and pipelines',
    },
    {
      name: 'messages',
      columns: ['id', 'conversation_id', 'sender', 'sender_name', 'content', 'model_id', 'metadata'],
      rowCount: 8,
      description: 'Multi-turn messages, subtask delegations, and synthesized code patches',
    },
    {
      name: 'teams',
      columns: ['id', 'name', 'sharing_mode', 'owner_peer_id', 'created_at'],
      rowCount: 1,
      description: 'P2P collaboration teams and access sharing configurations',
    },
    {
      name: 'team_members',
      columns: ['id', 'team_id', 'peer_id', 'name', 'role', 'joined_at'],
      rowCount: 3,
      description: 'P2P network participants, permissions and peer metadata',
    },
    {
      name: 'model_grants',
      columns: ['id', 'team_id', 'peer_id', 'model_id', 'grant_type', 'signature'],
      rowCount: 2,
      description: 'Cryptographically signed granular model access tokens (Context/Usage/Both)',
    },
    {
      name: 'settings',
      columns: ['key', 'value', 'updated_at'],
      rowCount: 12,
      description: 'Key-value application preferences, vault salt, editor configuration',
    },
  ];
}
