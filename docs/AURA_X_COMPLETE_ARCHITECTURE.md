# AURA-X: Level 5 Autonomous Music Generation & Production AI Agent
## Complete Architectural Characterization & Recreation Prompt

> **Use this document as a prompt for Cursor/Claude to recreate the Amapiano AI Studio platform.**

---

## Executive Summary

**AURA-X** is a Level 5 Autonomous AI Agent for real-time generative music production, specifically optimized for Amapiano - a South African electronic dance music genre. The platform combines:

1. **Suno-style text-to-song generation** - Full track creation from natural language
2. **Moises-style audio processing** - Stem separation, audio analysis, vocal removal
3. **Production-grade DAW capabilities** - Multi-track editing, mixing, mastering
4. **Autonomous agent architecture** - Self-improving AI that can plan, execute, and reflect

---

## Technology Stack

```yaml
Frontend:
  - React 18 + TypeScript
  - Vite (build tool)
  - TailwindCSS + shadcn/ui components
  - Framer Motion (animations)
  - TanStack Query (data fetching)

Audio Processing:
  - Tone.js (Web Audio synthesis)
  - Essentia.js (audio analysis)
  - TensorFlow.js (ML in browser)
  - Web Audio API (low-level audio)
  
Backend:
  - Supabase (PostgreSQL + Auth + Storage + Edge Functions)
  - Modal Labs (GPU compute for ML inference)
  - Deno runtime (Edge Functions)

AI/LLM:
  - Lovable AI Gateway (Gemini 2.5 Flash, GPT-5)
  - ElevenLabs (voice synthesis)
  - Suno API (music generation)
  - Custom ML models (Amapiano classification)

State Management:
  - React hooks + Context
  - TanStack Query (server state)
  - Local storage (persistence)
```

---

## Agent Architecture (Level 5 Autonomous)

### Directory Structure

```
src/lib/agent/
├── AutonomousAgent.ts      # Main orchestrator
├── ReActLoop.ts            # Reason-Act-Observe cycle
├── GoalDecomposer.ts       # LLM goal breakdown
├── ReflectionSystem.ts     # Self-evaluation
├── ToolChainManager.ts     # Tool execution
├── EventEmitter.ts         # Event bus
└── ambient/
    ├── AgentSignalBus.ts        # Inter-agent messaging
    ├── ScheduledAgentHeartbeat.ts # Health monitoring
    ├── JudgeAgent.ts            # Quality evaluation
    ├── DurableAgentState.ts     # State persistence
    └── WorkflowReplayEngine.ts  # Deterministic replay
```

### Agent Lifecycle: Sense → Learn → Reason → Act

```typescript
// AgentStatus states
type AgentStatus = 
  | 'idle'       // Waiting for input
  | 'planning'   // Decomposing goal
  | 'executing'  // Running tools
  | 'reflecting' // Self-evaluation
  | 'completed'  // Success
  | 'failed'     // Error state
  | 'paused';    // User paused

// Configuration
interface AgentConfig {
  maxSteps: number;           // Max reasoning steps (default: 10)
  maxRetries: number;         // Retry failed tasks (default: 3)
  enableReflection: boolean;  // Self-evaluation (default: true)
  enableLearning: boolean;    // Memory persistence (default: true)
  parallelExecution: boolean; // Concurrent tasks (default: true)
}
```

### Core Agent Flow

```
User Goal → GoalDecomposer → Subtasks → ReActLoop → Tools → Reflection → Output
     ↑                                                              ↓
     └──────────────── Learning/Memory Persistence ←────────────────┘
```

---

## Context Engineering Principles

Inspired by Manus (Context Engineering for AI Agents):

### 1. KV-Cache Optimization
- Keep prompt prefixes stable
- Use append-only context
- Deterministic JSON serialization
- Cache breakpoints at system prompt end

### 2. Token Logit Masking
- State machine for tool availability
- Mask unavailable actions during decoding
- Consistent action name prefixes (e.g., `browser_*`, `audio_*`)

### 3. File System as Context
- Externalize long-term memory to files
- Restorable compression (keep URLs, drop content)
- Unlimited context via file read/write

### 4. Todo.md Recitation
- Periodically write task lists
- Keeps goals in recent attention span
- Prevents "lost-in-the-middle" issues

### 5. Error Preservation
- Keep failed attempts in context
- Enables self-correction
- Reduces repeated mistakes

### 6. Diversity Injection
- Vary serialization templates
- Prevent few-shot pattern lock-in
- Break repetitive behaviors

---

## Application Routes

```typescript
const routes = [
  // Core Pages
  { path: "/", component: Index },
  { path: "/auth", component: Auth },
  { path: "/profile", component: Profile },
  
  // Music Generation
  { path: "/generate", component: Generate },
  { path: "/generate-song-suno", component: SunoGenerator },
  { path: "/generate-instrumental", component: InstrumentalGenerator },
  { path: "/generate-backing-with-intro", component: BackingWithIntro },
  { path: "/ai-lyrics-generator", component: AILyricsGeneratorPage },
  
  // Audio Processing
  { path: "/analyze", component: Analyze },
  { path: "/stem-splitter", component: StemSplitterPage },
  { path: "/vocal-remover", component: VocalRemoverPage },
  { path: "/amapianorize", component: Amapianorize },
  { path: "/audio-editor", component: AudioEditor },
  
  // Content Libraries
  { path: "/samples", component: Samples },
  { path: "/patterns", component: Patterns },
  { path: "/templates", component: TemplatesShowcase },
  
  // Production Tools
  { path: "/daw", component: DAW },
  { path: "/plugin-dev", component: PluginDev },
  
  // Social & Community
  { path: "/social", component: SocialFeed },
  { path: "/creator-hub", component: CreatorHub },
  
  // AI & Agent
  { path: "/ai-hub", component: AIHub },
  { path: "/aura", component: AuraPlatform },
  { path: "/aura-x", component: AuraXHub },
  { path: "/level5-dashboard", component: Level5Dashboard },
  { path: "/agent-demo", component: AgentDemo },
  
  // Advanced
  { path: "/research", component: Research },
  { path: "/performance", component: Performance },
  { path: "/modal-dashboard", component: ModalDashboard },
  { path: "/ml/quantize", component: MLQuantize },
];
```

---

## DAW Components

### Core DAW Features

```
src/components/daw/
├── FeatureToolbar.tsx              # Main toolbar with all tools
├── AmapianoSwingQuantizer.tsx      # Regional swing patterns
├── VelocityPatternGenerator.tsx    # ML velocity patterns
├── LogDrumPitchEnvelopeEditor.tsx  # Log drum design
├── RegionalStyleSelector.tsx       # Gauteng/KZN/Cape styles
├── AuthenticityMeter.tsx           # Real-time scoring
├── AudioToMidiConverter.tsx        # Audio→MIDI
├── CloudProjectManager.tsx         # Cloud sync
├── CollaborationTools.tsx          # Real-time collab
└── ProjectVersionHistory.tsx       # Version control
```

### DAW Data Types

```typescript
interface DawProjectData {
  bpm: number;
  keySignature: string;
  timeSignature: string;
  masterVolume: number;
  tracks: DawTrackV2[];
  automationLanes: AutomationLane[];
}

interface DawTrackV2 {
  id: string;
  type: 'midi' | 'audio';
  name: string;
  instrument?: string;
  clips: MidiClip[] | AudioClip[];
  mixer: MixerChannel;
  isArmed: boolean;
  color: string;
  automationLanes: AutomationLane[];
}
```

---

## Edge Functions (Backend)

```
supabase/functions/
├── agent-reasoning/          # LLM reasoning for agents
├── ai-chat/                  # General AI chat
├── ai-music-generation/      # Music orchestration
├── generate-song-suno/       # Suno API wrapper
├── generate-lyrics/          # AI lyrics
├── stem-separation/          # Demucs wrapper
├── vocal-remover/            # Vocal removal
├── analyze-audio/            # Feature extraction
├── amapianorize-audio/       # 7-stage transformation
├── elevenlabs-tts/           # Voice synthesis
├── modal-agent/              # GPU compute
├── modal-analyze/            # Modal analysis
├── modal-generate/           # Modal generation
├── neural-music-generation/  # Neural networks
├── rag-knowledge-search/     # RAG search
└── realtime-ai-assistant/    # Streaming AI
```

---

## ML Tools Registry

```typescript
const amapianoMLTools = [
  {
    name: 'amapiano_classification',
    description: 'Classify audio (rhythm, timbral, harmonic)',
    inputSchema: { audioUrl: string, featureTypes: string[] }
  },
  {
    name: 'amapiano_element_generation',
    description: 'Generate log drums, basslines, keys',
    inputSchema: { elementType: string, bpm: number, key: string }
  },
  {
    name: 'amapiano_production_validation',
    description: 'Validate against authentic rules',
    inputSchema: { projectData: object, strictMode: boolean }
  },
  {
    name: 'amapiano_authenticity_score',
    description: 'Score track authenticity',
    inputSchema: { audioUrl: string, targetRegion: string }
  }
];
```

---

## React Hooks

```typescript
// Agent Hooks
useAutonomousAgent()        // Agent state management
useAmbientOrchestrator()    // Background orchestration
useAmapianoML()             // ML predictions

// Audio Hooks
useAudioEngine()            // Tone.js wrapper
useHighSpeedAudioEngine()   // Low-latency audio
useEssentiaAnalysis()       // Essentia.js analysis
useTonePlayback()           // Playback control

// Collaboration
useRealtimeCollaboration()  // WebSocket presence
useEnhancedCollaboration()  // Enhanced features

// Data
useDawProjects()            // DAW CRUD
useSubscription()           // Stripe
useSocialFeed()             // Social data

// ML/AI
useMLPredictions()          // ML inference
useModalApi()               // Modal GPU
useVectorSearch()           // Semantic search
```

---

## Design System

### Color Tokens (HSL format)

```css
:root {
  /* Brand Colors */
  --primary: 45 96% 64%;              /* Gold - SA sunshine */
  --secondary: 15 85% 58%;            /* Orange - African sunset */
  --accent: 270 95% 75%;              /* Purple - creativity */
  
  /* Surfaces */
  --background: 220 8% 8%;            /* Dark base */
  --card: 220 13% 11%;                /* Card surface */
  --muted: 220 13% 16%;               /* Muted surface */
  
  /* Agent Status */
  --agent-idle: 215 20% 50%;
  --agent-planning: 45 96% 64%;
  --agent-executing: 160 80% 45%;
  --agent-complete: 142 76% 46%;
  
  /* Genre Colors */
  --genre-amapiano: 45 96% 64%;
  --genre-private-school: 270 75% 65%;
  --genre-three-step: 160 80% 45%;
  --genre-gqom: 0 85% 55%;
}
```

### Responsive Breakpoints

```typescript
screens: {
  xs: '475px',    // Small phones
  sm: '640px',    // Large phones
  md: '768px',    // Tablets
  lg: '1024px',   // Laptops
  xl: '1280px',   // Desktops
  '2xl': '1400px' // Large screens
}
```

---

## Database Schema

### Core Tables

```sql
-- Agent Executions
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  goal TEXT NOT NULL,
  decomposed_goal JSONB,
  execution_result JSONB,
  reflections JSONB,
  learnings JSONB,
  success BOOLEAN,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ
);

-- Agent Memory
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  memory_key TEXT NOT NULL,
  memory_type TEXT DEFAULT 'short_term',
  memory_data JSONB NOT NULL,
  importance_score FLOAT DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- DAW Projects
CREATE TABLE daw_projects (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bpm INTEGER DEFAULT 120,
  key_signature TEXT,
  time_signature TEXT DEFAULT '4/4',
  project_data JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Key Differentiators

1. **Cultural Authenticity** - ML trained on authentic Amapiano with regional style recognition
2. **Level 5 Autonomy** - Goal decomposition, reflection, self-correction, learning
3. **Hybrid Compute** - Edge Functions + Modal GPU for cost-effective scaling
4. **Real-time Collaboration** - WebSocket-powered multi-user DAW editing
5. **Context Engineering** - Manus-inspired KV-cache optimization

---

## Recreation Checklist

### Phase 1: Foundation
- [ ] Set up React + Vite + TypeScript project
- [ ] Configure TailwindCSS with design system
- [ ] Install shadcn/ui components
- [ ] Set up Supabase project with auth

### Phase 2: Agent Core
- [ ] Implement AutonomousAgent class
- [ ] Build ReActLoop with tool execution
- [ ] Create GoalDecomposer with LLM
- [ ] Add ReflectionSystem for self-evaluation
- [ ] Implement ToolChainManager

### Phase 3: Audio Engine
- [ ] Integrate Tone.js for synthesis
- [ ] Add Essentia.js for analysis
- [ ] Create audio recording/playback
- [ ] Build waveform visualization

### Phase 4: DAW
- [ ] Multi-track timeline
- [ ] Piano roll editor
- [ ] Mixer with effects
- [ ] Automation lanes
- [ ] Cloud project sync

### Phase 5: AI Integration
- [ ] Edge functions for LLM calls
- [ ] Suno API integration
- [ ] ElevenLabs voice synthesis
- [ ] Modal GPU compute

### Phase 6: Social Features
- [ ] Vertical feed (TikTok-style)
- [ ] Like/share/remix
- [ ] Creator monetization

---

*Document Version: 1.0*
*Last Updated: January 2026*
