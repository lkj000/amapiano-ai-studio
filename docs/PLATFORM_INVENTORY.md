# Amapiano-AI-Studio Platform Inventory

**Generated:** December 2024  
**Status:** Production-Ready Autonomous Agent System

---

## Table of Contents
1. [Autonomous Agent System](#1-autonomous-agent-system)
2. [Edge Functions (Backend)](#2-edge-functions-backend)
3. [Audio Processing Library](#3-audio-processing-library)
4. [Machine Learning Components](#4-machine-learning-components)
5. [React Hooks](#5-react-hooks)
6. [Pages & Routes](#6-pages--routes)
7. [UI Components](#7-ui-components)
8. [Feature Components](#8-feature-components)
9. [Database Tables](#9-database-tables)
10. [Secrets & API Keys](#10-secrets--api-keys)

---

## 1. Autonomous Agent System

### Core Agent Components (`src/lib/agents/`)

| File | Purpose | Status |
|------|---------|--------|
| `AutonomousAgent.ts` | Main agent orchestrator with ReAct loop integration | ✅ Production |
| `GoalDecomposer.ts` | Breaks high-level goals into subtasks | ✅ Production |
| `LLMReasoningEngine.ts` | LLM-powered reasoning via Lovable AI Gateway | ✅ Production |
| `ReActLoop.ts` | Reasoning + Acting cycle implementation | ✅ Production |
| `RealToolDefinitions.ts` | 7 real platform tool integrations | ✅ Production |
| `ReflectionSystem.ts` | Self-evaluation and learning | ✅ Production |
| `ToolChainManager.ts` | Tool execution and fallback handling | ✅ Production |

### Registered Agent Tools

| Tool Name | Description | Backend |
|-----------|-------------|---------|
| `stem_separation` | Separate audio into stems using Demucs | `stem-separation` edge function |
| `voice_synthesis` | Generate speech via ElevenLabs TTS | `generate-song-with-vocals` edge function |
| `lyrics_generation` | Generate multilingual lyrics via AI | `ai-chat` edge function |
| `audio_analysis` | Analyze BPM, key, energy | `analyze-audio` edge function |
| `amapianorization` | Add authentic Amapiano elements | `audioProcessor.ts` (WebAudio) |
| `music_generation` | Generate instrumental music | `generate-music` edge function (Replicate) |
| `export_stems` | Bundle stems into ZIP | `zip-stems` edge function |

---

## 2. Edge Functions (Backend)

### AI & Generation Functions

| Function | Purpose | API Used |
|----------|---------|----------|
| `ai-chat` | Conversational AI for lyrics generation | Lovable AI Gateway |
| `agent-reasoning` | LLM reasoning for autonomous agent | Lovable AI Gateway |
| `ai-music-generation` | Neural music generation | OpenAI |
| `generate-music` | Instrumental music generation | Replicate MusicGen |
| `generate-song-with-vocals` | Voice synthesis with lyrics | ElevenLabs |
| `generate-sample` | Synthetic sample generation | Internal |
| `neural-music-generation` | Advanced neural music gen | OpenAI |

### Audio Processing Functions

| Function | Purpose | Technology |
|----------|---------|------------|
| `stem-separation` | Demucs stem separation | Replicate API |
| `audio-format-converter` | Format conversion | FFmpeg |
| `audio-to-midi` | Audio to MIDI conversion | Internal |
| `analyze-audio` | Audio feature analysis | Essentia patterns |
| `amapianorize-audio` | Amapianorization processing | Custom DSP |
| `essentia-deep-analysis` | Deep audio analysis | Essentia.js |
| `music-analysis` | Musicality benchmarking | Internal |

### Plugin & Development Functions

| Function | Purpose |
|----------|---------|
| `ai-plugin-generator` | AI-powered plugin code generation |
| `ai-plugin-chat` | Plugin development assistant |
| `compile-wasm-plugin` | WASM plugin compilation |
| `compile-cpp-plugin` | C++ plugin compilation |
| `plugin-parameter-translation` | Parameter mapping |
| `ml-plugin-optimizer` | ML-based plugin optimization |
| `pattern-analyzer` | Musical pattern analysis |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `zip-stems` | Bundle stems into downloadable ZIP |
| `elevenlabs-tts` | Direct ElevenLabs TTS wrapper |
| `voice-to-text` | Speech to text transcription |
| `rag-knowledge-search` | RAG-based semantic search |
| `get-personalized-feed` | Personalized content feed |
| `demo-audio-files` | Demo audio file serving |

### Subscription & Billing Functions

| Function | Purpose |
|----------|---------|
| `check-subscription` | Verify user subscription status |
| `create-subscription` | Create Stripe subscription |
| `create-purchase` | Process one-time purchases |
| `customer-portal` | Stripe customer portal redirect |

### Research & Monitoring Functions

| Function | Purpose |
|----------|---------|
| `detect-performance-anomalies` | Performance monitoring |
| `generate-performance-report` | Report generation |
| `record-generation-cost` | Cost tracking |
| `send-performance-alert` | Alert notifications |
| `send-research-alert` | Research notifications |
| `send-paper-notification` | Paper submission notifications |
| `track-ab-conversion` | A/B test tracking |

### Orchestration Functions

| Function | Purpose |
|----------|---------|
| `aura-conductor-orchestration` | Multi-agent orchestration |
| `aura-ai-suggestions` | AI suggestion generation |
| `aura-ai-suggestions-stream` | Streaming suggestions |
| `realtime-ai-assistant` | Real-time AI assistance |
| `preset-recommendations` | Preset recommendation engine |
| `amapiano-subgenre-ai` | Subgenre classification |
| `multi-language-processor` | Multi-language text processing |

---

## 3. Audio Processing Library

### Core Audio (`src/lib/audio/`)

| File | Purpose | Status |
|------|---------|--------|
| `audioProcessor.ts` | WebAudio real-time processing (sidechain, filter sweeps, mixing) | ✅ Production |
| `amapianorizationEngine.ts` | 7-stage Amapianorization pipeline | ✅ Production |
| `authenticityScoring.ts` | Regional authenticity scoring with learned weights | ✅ Production |
| `logDrumLibrary.ts` | 53 log drum samples across 4 SA regions | ✅ Production |
| `percussionLibrary.ts` | Percussion sample library | ✅ Production |
| `sampleGenerator.ts` | WebAudio synthetic sample generation | ✅ Production |
| `sampleLoader.ts` | Sample loading with caching | ✅ Production |
| `svdQuantAudio.ts` | Phase-coherent quantization (4/8/16-bit) | ✅ Production |
| `musicAnalysis.ts` | Musicality metrics (BCS, KSI, TSR) | ✅ Production |
| `audioEncoderMetrics.ts` | Encoder quality metrics | ✅ Production |

### DSP Components (`src/lib/dsp/`)

| Component | Purpose |
|-----------|---------|
| Sidechain Compression | Amapiano "pump" effect |
| Filter Sweeps | Tension building effects |
| Time Stretching | BPM matching |
| Pitch Shifting | Key matching |

---

## 4. Machine Learning Components

### ML Library (`src/lib/ml/`)

| File | Purpose | Status |
|------|---------|--------|
| `authenticityLearning.ts` | Linear regression for learned authenticity weights | ✅ Production |
| `frechetAudioDistance.ts` | FAD calculator for quality assessment | ✅ Production |
| `realTimePrediction.ts` | Real-time genre/element prediction | ✅ Production |
| `vectorEmbeddings.ts` | TF-IDF + OpenAI embeddings for semantic search | ✅ Production |

### Research Library (`src/lib/research/`)

| Component | Purpose |
|-----------|---------|
| Quantization Testing | SVDQuant-Audio validation |
| Benchmark Suite | Musicality metrics |

---

## 5. React Hooks

### Agent & AI Hooks

| Hook | Purpose |
|------|---------|
| `useAutonomousAgent` | Autonomous agent state management |
| `useAgentMemoryPersistence` | Agent execution persistence |
| `useMLPredictions` | Unified ML predictions interface |
| `useMultiAgentOrchestrator` | Multi-agent coordination |

### Audio Processing Hooks

| Hook | Purpose |
|------|---------|
| `useAudioEngine` | Core audio engine |
| `useHighSpeedAudioEngine` | Low-latency audio processing |
| `useRealTimeAudioEngine` | Real-time audio with Tone.js |
| `useAudioEffects` | Effects chain management |
| `useEssentiaAnalysis` | Essentia.js audio analysis |
| `useUnifiedMusicAnalysis` | Combined analysis pipeline |
| `useTonePlayback` | Tone.js playback control |
| `useWaveformVisualization` | Waveform rendering |

### Amapianorization Hooks

| Hook | Purpose |
|------|---------|
| `useAmapianorizationProcessor` | Amapianorization execution |
| `useAmapianorizationPersistence` | Results persistence |
| `useLogDrumDesigner` | Log drum pattern design |
| `usePercussionLayering` | Percussion layer control |
| `useBassLayering` | Bass layer control |

### DAW & Project Hooks

| Hook | Purpose |
|------|---------|
| `useDawProjects` | DAW project management |
| `useProjectManager` | Project CRUD operations |
| `useProjectVersions` | Version control |
| `useProjectSharing` | Project sharing |
| `useProjectTemplates` | Template management |
| `useUndoRedo` | Undo/redo stack |

### Collaboration Hooks

| Hook | Purpose |
|------|---------|
| `useRealtimeCollaboration` | Real-time sync |
| `useRealtimePresence` | User presence |
| `useEnhancedCollaboration` | Enhanced collab features |
| `useDuetCollaboration` | Duet creation |

### Plugin Hooks

| Hook | Purpose |
|------|---------|
| `usePluginSystem` | Plugin management |
| `useVSTPluginSystem` | VST plugin integration |
| `usePluginCompiler` | Plugin compilation |
| `usePluginMarketplace` | Marketplace integration |
| `useWasmPluginLoader` | WASM plugin loading |

### Social & Monetization Hooks

| Hook | Purpose |
|------|---------|
| `useSocialFeed` | Social feed management |
| `usePersonalizedFeed` | Personalized content |
| `useTipping` | Creator tipping |
| `useCreatorWallet` | Creator earnings |
| `useSubscription` | Subscription status |
| `useStripeBilling` | Stripe integration |

### Research & Testing Hooks

| Hook | Purpose |
|------|---------|
| `useUserStudyPersistence` | User study data |
| `useUserStudyAudioPersistence` | Study audio storage |
| `useAudioAnalysisPersistence` | Analysis results storage |
| `useGeneratedSamplesPersistence` | Sample generation history |
| `useModelQuantizer` | Quantization testing |

### Performance Hooks

| Hook | Purpose |
|------|---------|
| `useRealtimePerformanceMonitoring` | Performance metrics |
| `usePerformanceAlerts` | Alert management |
| `usePerformanceDemoData` | Demo data generation |
| `useCostTracking` | Cost monitoring |

---

## 6. Pages & Routes

### Main Application Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `Index.tsx` | Landing page |
| `/auth` | `Auth.tsx` | Authentication |
| `/daw` | `DAW.tsx` | Digital Audio Workstation |
| `/generate` | `Generate.tsx` | Music generation |
| `/analyze` | `Analyze.tsx` | Audio analysis |
| `/amapianorize` | `Amapianorize.tsx` | Amapianorization workflow |
| `/samples` | `Samples.tsx` | Sample library |
| `/patterns` | `Patterns.tsx` | Pattern library |

### Research & Testing Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/audio-test-lab` | `AudioTestLab.tsx` | Audio testing & quantization |
| `/user-study` | `UserStudy.tsx` | A/B blind listening tests |
| `/study-recruitment` | `StudyRecruitment.tsx` | Study participant recruitment |
| `/study-analytics` | `StudyAnalytics.tsx` | Study results dashboard |
| `/research` | `Research.tsx` | Research overview |
| `/workflow-validation` | `WorkflowValidation.tsx` | Workflow testing |

### Platform Features

| Route | Page | Purpose |
|-------|------|---------|
| `/ai-hub` | `AIHub.tsx` | AI capabilities hub |
| `/agent-demo` | `AgentDemo.tsx` | Autonomous agent testing |
| `/aura-platform` | `AuraPlatform.tsx` | AURA orchestration |
| `/vast-demo` | `VASTDemo.tsx` | VAST integration demo |
| `/creator-hub` | `CreatorHub.tsx` | Creator dashboard |
| `/social-feed` | `SocialFeed.tsx` | Social content feed |

### Development & Admin

| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | `Admin.tsx` | Admin dashboard |
| `/plugin-dev` | `PluginDev.tsx` | Plugin development |
| `/performance` | `Performance.tsx` | Performance monitoring |
| `/profile` | `Profile.tsx` | User profile |
| `/templates-showcase` | `TemplatesShowcase.tsx` | Template gallery |

### Demo Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/essentia-demo` | `EssentiaDemo.tsx` | Essentia.js demo |
| `/aura-808-demo` | `Aura808Demo.tsx` | 808 synthesis demo |
| `/audio-editor` | `AudioEditor.tsx` | Audio editing |
| `/ab-pair-generator` | `ABPairGenerator.tsx` | A/B test pair generation |

---

## 7. UI Components

### Shadcn/UI Base Components (`src/components/ui/`)

**Layout:** accordion, card, collapsible, dialog, drawer, resizable, scroll-area, separator, sheet, sidebar, tabs

**Form:** button, calendar, checkbox, form, input, input-otp, label, radio-group, select, slider, switch, textarea, toggle, toggle-group

**Navigation:** breadcrumb, command, context-menu, dropdown-menu, menubar, navigation-menu, pagination, popover

**Feedback:** alert, alert-dialog, badge, progress, skeleton, sonner, toast, toaster, tooltip

**Data Display:** aspect-ratio, avatar, carousel, chart, hover-card, table

---

## 8. Feature Components

### AI Components (`src/components/ai/`)

| Component | Purpose |
|-----------|---------|
| AI Assistant integrations | AI-powered assistance |
| Model routing | Multi-model selection |
| Prompt parsing | Natural language understanding |

### Aura Components (`src/components/aura/`)

| Component | Purpose |
|-----------|---------|
| AURA orchestration UI | Multi-agent visualization |
| Task queue display | Queue management |
| Agent status indicators | Status monitoring |

### DAW Components (`src/components/daw/`)

| Component | Purpose |
|-----------|---------|
| Timeline rendering | Track visualization |
| Mixer panel | Audio mixing |
| Transport controls | Playback control |
| Piano roll | MIDI editing |
| Automation lanes | Parameter automation |

### Marketplace Components (`src/components/marketplace/`)

| Component | Purpose |
|-----------|---------|
| Plugin listings | Plugin browsing |
| Purchase flow | Transaction handling |
| Reviews system | User reviews |

### Research Components (`src/components/research/`)

| Component | Purpose |
|-----------|---------|
| Study interfaces | User study UI |
| Analytics dashboards | Results visualization |
| Benchmark displays | Metric presentation |

### Social Components (`src/components/social/`)

| Component | Purpose |
|-----------|---------|
| Feed rendering | Post display |
| Interactions | Likes, comments, shares |
| Creator tools | Creator utilities |

### Major Feature Components

| Component | Purpose |
|-----------|---------|
| `AmapianorizeEngine.tsx` | Amapianorization UI |
| `InteractiveDAW.tsx` | Full DAW interface |
| `StemByStepGenerator.tsx` | Suno-style workflow |
| `MusicAnalysisPanel.tsx` | Analysis visualization |
| `CollaborationPanel.tsx` | Real-time collab UI |
| `PluginManagerPanel.tsx` | Plugin management |
| `VirtualInstruments.tsx` | Virtual instrument rack |
| `SmartPresetRecommendations.tsx` | AI preset suggestions |

---

## 9. Database Tables

### User & Authentication

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `subscribers` | Subscription status |
| `user_roles` | Role-based access |
| `user_wallets` | Creator earnings |

### Content & Projects

| Table | Purpose |
|-------|---------|
| `daw_projects` | DAW project storage |
| `cloud_projects` | Cloud project sync |
| `project_versions` | Version history |
| `project_shares` | Sharing permissions |
| `project_templates` | Project templates |

### Audio & Analysis

| Table | Purpose |
|-------|---------|
| `audio_analysis_results` | Analysis data |
| `amapianorization_results` | Processing results |
| `generated_samples` | Sample generation history |
| `samples` | Sample library |
| `musical_vectors` | Vector embeddings |

### Social Features

| Table | Purpose |
|-------|---------|
| `social_posts` | Social content |
| `post_comments` | Comments |
| `post_interactions` | Likes, shares |
| `community_posts` | Community content |
| `creator_earnings` | Earnings tracking |
| `tip_transactions` | Tipping history |

### Agent & AI

| Table | Purpose |
|-------|---------|
| `agent_executions` | Agent run history |
| `agent_memory` | Agent memory storage |
| `ai_context_memory` | AI context persistence |
| `ai_model_usage` | Model usage tracking |
| `ai_model_marketplace` | AI model listings |

### Research

| Table | Purpose |
|-------|---------|
| `user_study_responses` | Study data collection |
| `papers` | Research papers |
| `reviews` | Paper reviews |
| `performance_metrics` | Performance data |
| `performance_anomalies` | Anomaly tracking |

### Marketplace

| Table | Purpose |
|-------|---------|
| `marketplace_items` | Plugin listings |
| `plugin_reviews` | Plugin reviews |
| `plugin_downloads` | Download tracking |
| `plugin_submissions` | Submission queue |
| `orders` | Purchase records |

### Collaboration

| Table | Purpose |
|-------|---------|
| `collaboration_sessions` | Collab sessions |
| `collaboration_rooms` | Room management |
| `room_participants` | Participant tracking |

---

## 10. Secrets & API Keys

### Configured Secrets (Supabase)

| Secret | Service | Status |
|--------|---------|--------|
| `REPLICATE_API_KEY` | Replicate (MusicGen, Demucs) | ✅ Configured |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS | ✅ Configured |
| `OPENAI_API_KEY` | OpenAI embeddings | ✅ Configured |
| `STRIPE_SECRET_KEY` | Stripe billing | ✅ Configured |
| `RESEND_API_KEY` | Email notifications | ✅ Configured |
| `LOVABLE_API_KEY` | Lovable AI Gateway | ✅ Auto-configured |
| `SUPABASE_URL` | Supabase connection | ✅ Auto-configured |
| `SUPABASE_ANON_KEY` | Supabase anon key | ✅ Auto-configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | ✅ Auto-configured |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Edge Functions** | 49 |
| **Agent Tools** | 7 |
| **React Hooks** | 75+ |
| **Pages/Routes** | 30 |
| **UI Components** | 48 |
| **Feature Components** | 100+ |
| **Database Tables** | 50+ |
| **Configured Secrets** | 9 |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AMAPIANO-AI-STUDIO                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   React Pages   │  │  UI Components  │  │  Feature Comps  │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│  ┌────────▼────────────────────▼────────────────────▼────────┐  │
│  │                     React Hooks Layer                      │  │
│  │  (useAutonomousAgent, useAudioEngine, useAmapianorization) │  │
│  └────────┬────────────────────┬────────────────────┬────────┘  │
│           │                    │                    │           │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐  │
│  │  Agent System   │  │  Audio Library  │  │   ML Library    │  │
│  │  - ReAct Loop   │  │  - WebAudio     │  │  - FAD Calc     │  │
│  │  - LLM Engine   │  │  - SVDQuant     │  │  - Embeddings   │  │
│  │  - Tool Chain   │  │  - Processor    │  │  - Prediction   │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│  ┌────────▼────────────────────▼────────────────────▼────────┐  │
│  │                  Supabase Client Layer                     │  │
│  └────────┬────────────────────┬────────────────────┬────────┘  │
├───────────┼────────────────────┼────────────────────┼───────────┤
│           │     EDGE FUNCTIONS │                    │           │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐  │
│  │   AI Functions  │  │ Audio Functions │  │ Utility Funcs   │  │
│  │  - ai-chat      │  │  - stem-sep     │  │  - zip-stems    │  │
│  │  - agent-reason │  │  - generate     │  │  - check-sub    │  │
│  │  - neural-music │  │  - analyze      │  │  - billing      │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│  ┌────────▼────────────────────▼────────────────────▼────────┐  │
│  │                    External APIs                           │  │
│  │  Lovable AI │ ElevenLabs │ Replicate │ Stripe │ OpenAI    │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Supabase Database                        │  │
│  │  50+ Tables │ RLS Policies │ Functions │ Storage Buckets   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

*This inventory represents the complete platform state as of December 2024.*
