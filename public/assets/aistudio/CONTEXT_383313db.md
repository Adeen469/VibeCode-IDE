# VibeCode IDE - Project Context

## Project Overview
A completely free, local-first, collaborative IDE where "vibe coders" can orchestrate multiple AI models as a team, with seamless P2P collaboration for human teams.

## Architecture Summary

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Monaco Editor (VS Code engine)
- **Backend**: Tauri 2 (Rust) + SQLite (via sqlx) + SQLCipher for encryption
- **AI Providers**: Ollama, LM Studio, OpenAI, Anthropic, OpenRouter, Custom
- **Collaboration**: WebRTC P2P + Yjs CRDT (planned) + local signaling server
- **State Management**: Zustand + Immer
- **Styling**: Tailwind CSS v4 (with @tailwindcss/postcss)

### Core Principles
1. **Zero cost to users** - No subscriptions, no server fees
2. **Local-first** - All data stays on user's machine unless explicitly shared
3. **Performance-first** - Native Tauri app, client-side orchestration
4. **User sovereignty** - BYOK, local models, P2P - user controls everything

## Implemented Features

### 1. VS Code-like UI (Frontend)
- Sidebar with file tree, search, source control, extensions, AI model management
- Tab bar with drag-to-reorder, close, new file
- Monaco Editor with VS Code all theme (changeable)
- Bottom panel (Terminal, AI Chat, Problems, Output, Debug Console)
- Status bar with git branch, project, AI models, team, peers, encoding, line ending, language
- Keyboard shortcuts (Ctrl+S, Ctrl+N, Ctrl+B, Ctrl+J, Ctrl+Shift+P)

### 2. Multi-Model AI Orchestration (Backend)

#### Model Registry
- Register models from: Ollama, LM Studio, OpenAI, Anthropic, OpenRouter, Custom
- Auto-discovery for local models (Ollama at localhost:11434, LM Studio at localhost:1234)
- Model capabilities: chat, tools, vision, reasoning, code
- Per-project model activation
- Model roles: Active (read context) / Responder (generate responses)

#### Orchestration Modes
1. **Single Responder** - One model responds, others read context
2. **Team Discussion** - Multiple responders discuss, create plan, divide work, execute in parallel
3. **Pipeline** - Sequential processing: Planner → Coder → Reviewer → Tester

#### Model-to-Model Communication Protocol
- Shared context buffer broadcast to all activated models
- Team lead creates JSON plan with subtask assignments
- Subtask dependency resolution
- Parallel execution with context sharing
- Result aggregation

#### AI Provider Implementations
- **Ollama**: `/api/chat` and `/api/tags` endpoints
- **LM Studio**: OpenAI-compatible `/v1/chat/completions` and `/v1/models`
- **OpenAI**: Official API with streaming support
- **Anthropic**: Messages API with system prompt handling
- **OpenRouter**: OpenAI-compatible with referral headers
- **Custom**: Configurable base URL and optional API key

### 3. Team Collaboration (P2P)

#### Sharing Modes
1. **Full Share** - All models pooled, any member uses any model
2. **Context Only** - Shared chat history, each uses own models
3. **Granular** - Per-member per-model permissions (context/usage/both)

#### P2P Infrastructure
- WebRTC data channels for messaging
- STUN servers (Google) for NAT traversal
- Signaling message types: Offer, Answer, ICE Candidate, Join, Leave, PeerList, ModelGrant, ContextSync, CursorUpdate, TypingIndicator
- Local signaling server implementation

#### Team Management
- Create/join/leave teams
- Per-team sharing mode configuration
- Model access grants (context, usage, both)
- Peer presence and cursor tracking

### 4. Database Layer (SQLite + SQLCipher)

#### Tables
- `models` - Registered AI models with encrypted API keys
- `projects` - Project paths, active models, team association
- `conversations` - Chat sessions per project
- `messages` - Chat messages with metadata
- `teams` - Team configurations
- `team_members` - Team membership with permissions
- `model_grants` - Granular model access permissions
- `settings` - Key-value app settings

#### Features
- Foreign key constraints
- Indexes for performance
- Migrations on startup
- Encrypted API key storage (AES-256-GCM + Argon2id)

### 5. File System Operations
- Read/write files
- List directories (with sorting: dirs first, then alphabetical)
- Create/delete/rename files and folders
- File watching (placeholder)
- File tree building with depth limit

### 6. Settings & Encryption
- Theme, font, editor settings persistence
- AI settings (default provider, model, temperature, context window)
- AES-256-GCM encryption for API keys with Argon2id key derivation
- Base64 encoding for storage

## Project Structure

```
vibe-code-ide/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── Editor.tsx           # Monaco Editor wrapper
│   │   ├── Sidebar.tsx          # Activity bar + sidebar views
│   │   ├── Panel.tsx            # Bottom panel (terminal, AI chat, etc.)
│   │   ├── TabBar.tsx           # Editor tabs
│   │   └── StatusBar.tsx        # Status bar
│   ├── store/index.ts           # Zustand store with all state/actions
│   ├── types/index.ts           # TypeScript types
│   ├── utils/index.ts           # Utility functions
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind + VS Code theme
├── src-tauri/                   # Backend (Rust)
│   ├── src/
│   │   ├── commands/            # Tauri commands
│   │   │   ├── file_system.rs   # File operations
│   │   │   ├── project.rs       # Project management
│   │   │   ├── models.rs        # Model registry
│   │   │   ├── chat.rs          # Chat & AI communication
│   │   │   ├── orchestration.rs # Multi-model orchestration
│   │   │   ├── team.rs          # Team collaboration
│   │   │   └── settings.rs      # Settings persistence
│   │   ├── models/mod.rs        # Data models & SQLx types
│   │   ├── database/mod.rs      # Database init & migrations
│   │   ├── ai/providers.rs      # AI provider implementations
│   │   ├── p2p/mod.rs           # WebRTC P2P signaling
│   │   ├── orchestration.rs     # Orchestration engine
│   │   ├── config/mod.rs        # Configuration
│   │   ├── crypto.rs            # Encryption (AES-256-GCM + Argon2id)
│   │   ├── lib.rs               # Main entry point
│   │   └── main.rs              # Binary entry
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Tauri configuration
│   └── build.rs                 # Build script
├── package.json                 # Frontend dependencies
├── vite.config.ts               # Vite config
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind config
├── postcss.config.js            # PostCSS config
├── index.html                   # HTML entry
├── CONTEXT.md                   # This file
└── PROJECT_SPEC.md              # Full specification
```

## Key Technical Decisions

1. **Client-side orchestration** - All model coordination happens in Rust backend, not in frontend
2. **Local-first storage** - SQLite database in app data directory, no cloud sync by default
3. **Encrypted API keys** - Argon2id + AES-256-GCM, keys never logged or exposed
4. **P2P signaling** - WebSocket-based signaling server (can run locally)
5. **Provider abstraction** - Trait-based AI providers for easy extension
6. **Zustand + Immer** - Immutable state updates with mutable syntax

## Development Commands

```bash
# Frontend development
npm run dev          # Vite dev server
npm run build        # TypeScript + Vite build
npm run typecheck    # TypeScript check

# Tauri development
npm run tauri:dev    # Run Tauri app in dev mode
npm run tauri:build  # Build production binaries

# Rust commands (from src-tauri/)
cargo check          # Quick type check
cargo build          # Debug build
cargo build --release # Release build
```

## Current Status

### ✅ Completed
- Project specification and architecture design
- Tauri + React + TypeScript project setup
- VS Code-like UI with Monaco Editor
- File system operations via Tauri commands
- Model registry with 6 provider types
- Chat & AI orchestration commands
- Team collaboration & P2P commands
- Database layer with migrations
- Frontend builds successfully
- Cargo.toml dependency conflicts resolved
- AI provider integrations (all 6 providers)
- WebRTC P2P signaling implementation
- Model-to-model communication protocol (Team mode with plan/subtasks)
- API key encryption (AES-256-GCM + Argon2id)

### 🔄 In Progress
- Granular sharing permissions UI (frontend)

### 📋 Pending / Future Enhancements
- WebRTC data channel integration in frontend
- Yjs CRDT for real-time collaborative editing
- Streaming responses in AI chat
- Command palette (Ctrl+Shift+P)
- Git integration (diff, commit, push)
- Debug adapter protocol support
- Extension system
- Mobile support (Tauri mobile)
- Plugin API for community extensions

## Known Issues / Limitations

1. **Rust compilation** - Requires Visual Studio Build Tools on Windows
2. **WebRTC** - Currently only signaling implementation, data channels need frontend integration
3. **Streaming** - AI streaming responses not yet connected to frontend
4. **Context window management** - Auto-summarization not implemented
5. **Model discovery** - Only Ollama and LM Studio auto-discovery implemented
6. **Testing** - No unit/integration tests yet

## Next Steps for Production

1. Complete granular sharing UI in frontend
2. Connect WebRTC data channels to frontend
3. Implement streaming responses
4. Add context window auto-summarization
5. Write unit tests for core logic
6. Add CI/CD pipeline
7. Create installer packages
8. Documentation and user guide