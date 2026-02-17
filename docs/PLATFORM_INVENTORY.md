# Amapiano-AI-Studio Platform Inventory

**Last Verified:** February 2026  
**Status:** Production-Ready Autonomous Agent System

---

## Table of Contents
1. [Autonomous Agent System](#1-autonomous-agent-system)
2. [Edge Functions (Backend)](#2-edge-functions-backend)
3. [Audio Processing Library](#3-audio-processing-library)
4. [DSP Components](#4-dsp-components)
5. [Machine Learning Components](#5-machine-learning-components)
6. [Research Library](#6-research-library)
7. [React Hooks](#7-react-hooks)
8. [Pages & Routes](#8-pages--routes)
9. [UI Components](#9-ui-components)
10. [Feature Components](#10-feature-components)
11. [Database Tables](#11-database-tables)
12. [Secrets & API Keys](#12-secrets--api-keys)

---

## 1. Autonomous Agent System

### Core Agent Components (`src/lib/agents/`)

| File | Purpose |
|------|---------|
| `AutonomousAgent.ts` | Main agent orchestrator with ReAct loop integration |
| `AutonomousProductionLoop.ts` | Autonomous production pipeline |
| `GoalDecomposer.ts` | Breaks high-level goals into subtasks |
| `LLMReasoningEngine.ts` | LLM-powered reasoning via Lovable AI Gateway |
| `ReActLoop.ts` | Reasoning + Acting cycle implementation |
| `RealToolDefinitions.ts` | Platform tool integrations |
| `ReflectionSystem.ts` | Self-evaluation and learning |
| `ToolChainManager.ts` | Tool execution and fallback handling |
| `AgentSignalBus.ts` | Inter-agent event/signal bus |
| `AmapianoMLTools.ts` | ML tool wrappers for agent use |
| `AmbientAgentOrchestrator.ts` | Ambient/background agent orchestration |
| `DurableAgentState.ts` | Persistent agent state across sessions |
| `JudgeAgent.ts` | Quality judgement agent |
| `Level5AgentCore.ts` | Level 5 autonomy core logic |
| `MultiAgentScaler.ts` | Multi-agent scaling coordinator |
| `SamplePackProcessor.ts` | Sample pack processing agent tool |
| `ScheduledAgentHeartbeat.ts` | Periodic agent health checks |
| `WebWorkerAgentPool.ts` | Web Worker pool for parallel agent execution |
| `WorkflowReplayEngine.ts` | Replay and debug agent workflows |
| `index.ts` | Module exports |

### Registered Agent Tools

| Tool Name | Description | Backend |
|-----------|-------------|---------|
| `stem_separation` | Separate audio into stems using Demucs | `stem-separation` edge function |
| `voice_synthesis` | Generate speech via ElevenLabs TTS | `generate-song-with-vocals` edge function |
| `lyrics_generation` | Generate multilingual lyrics via AI | `generate-lyrics` edge function |
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
| `generate-lyrics` | Multi-language lyrics generation (dual version A/B) | Gemini |
| `generate-song-suno` | Suno-style song generation | Suno API |
| `generate-song-elevenlabs-singing` | ElevenLabs singing voice | ElevenLabs |
| `generate-instrumental` | Standalone instrumental generation | Replicate |
| `generate-backing-with-intro` | Backing track with intro | Internal |
| `generate-layer` | Individual layer generation | Internal |
| `build-beat-around-loop` | Beat construction from loop | Internal |
| `sound-effect-generator` | Sound effect synthesis | Internal |

### Audio Processing Functions

| Function | Purpose | Technology |
|----------|---------|------------|
| `stem-separation` | Demucs stem separation | Replicate API |
| `stem-splitter` | Alternative stem splitting | Internal |
| `stem-classify` | Stem type classification | Internal |
| `vocal-remover` | Vocal isolation/removal | Internal |
| `audio-format-converter` | Format conversion | FFmpeg |
| `audio-to-midi` | Audio to MIDI conversion | Internal |
| `analyze-audio` | Audio feature analysis | Essentia patterns |
| `amapianorize-audio` | Amapianorization processing | Custom DSP |
| `essentia-deep-analysis` | Deep audio analysis | Essentia.js |
| `music-analysis` | Musicality benchmarking | Internal |
| `ai-mastering` | AI-powered mastering | Internal |
| `analyze-training-sample` | Training data analysis | Internal |

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
| `text-to-speech` | Generic TTS wrapper |
| `voice-to-text` | Speech to text transcription |
| `rag-knowledge-search` | RAG-based semantic search |
| `get-personalized-feed` | Personalized content feed |
| `demo-audio-files` | Demo audio file serving |
| `multi-language-processor` | Multi-language text processing |
| `amapiano-subgenre-ai` | Subgenre classification |
| `metrics` | Internal metrics collection |

### Subscription & Billing Functions

| Function | Purpose |
|----------|---------|
| `check-subscription` | Verify user subscription status |
| `create-subscription` | Create Stripe subscription |
| `create-checkout` | Create Stripe checkout session |
| `create-purchase` | Process one-time purchases |
| `customer-portal` | Stripe customer portal redirect |

### Monitoring & Alerting Functions

| Function | Purpose |
|----------|---------|
| `detect-performance-anomalies` | Performance monitoring |
| `generate-performance-report` | Report generation |
| `record-generation-cost` | Cost tracking |
| `send-performance-alert` | Alert notifications |
| `send-regression-alert` | Regression alert notifications |
| `send-research-alert` | Research notifications |
| `send-paper-notification` | Paper submission notifications |
| `send-test-notification` | Test notification dispatch |
| `send-thesis-validation-email` | Thesis validation emails |
| `track-ab-conversion` | A/B test tracking |

### Orchestration & AI Assistant Functions

| Function | Purpose |
|----------|---------|
| `aura-conductor-orchestration` | Multi-agent orchestration |
| `aura-ai-suggestions` | AI suggestion generation |
| `aura-ai-suggestions-stream` | Streaming suggestions |
| `realtime-ai-assistant` | Real-time AI assistance |
| `preset-recommendations` | Preset recommendation engine |
| `dj-agent-brain` | DJ agent decision engine |
| `modal-agent` | Modal compute agent |
| `modal-analyze` | Modal compute analysis |
| `modal-generate` | Modal compute generation |
| `modal-quantize` | Modal compute quantization |
| `modal-separate` | Modal compute separation |

**Total Edge Functions: 68**

---

## 3. Audio Processing Library (`src/lib/audio/`)

| File | Purpose |
|------|---------|
| `audioProcessor.ts` | WebAudio real-time processing (sidechain, filter sweeps, mixing) |
| `amapianorizationEngine.ts` | 7-stage Amapianorization pipeline |
| `amapianorizerPresets.ts` | Amapianorizer preset configurations |
| `amapianorizerTransformer.ts` | Amapianorizer audio transformation |
| `authenticityScoring.ts` | Regional authenticity scoring with learned weights |
| `logDrumLibrary.ts` | Log drum samples across 4 SA regions |
| `percussionLibrary.ts` | Percussion sample library |
| `sampleGenerator.ts` | WebAudio synthetic sample generation |
| `sampleLoader.ts` | Sample loading with caching |
| `svdQuantAudio.ts` | Phase-coherent quantization (4/8/16-bit) |
| `musicAnalysis.ts` | Musicality metrics (BCS, KSI, TSR) |
| `musicTheory.ts` | Music theory utilities |
| `audioEncoderMetrics.ts` | Encoder quality metrics |
| `amapianoGasp.ts` | Amapiano gasp/vocal sample processing |
| `amapianoSynths.ts` | Amapiano-specific synth patches |
| `AnalyticQualityScore.ts` | Analytic quality scoring |
| `EnhancedLocalVoice.ts` | Enhanced local voice synthesis |
| `ExtendEngine.ts` | Audio extension/looping engine |
| `FMLogDrumSynth.ts` | FM synthesis log drum generator |
| `NeuralGrooveEngine.ts` | Neural-powered groove generation |
| `ProducerDNA.ts` | Producer style fingerprinting |
| `RealAudioEngine.ts` | Real audio engine (Tone.js integration) |
| `ReferenceToGenerate.ts` | Reference-to-generation pipeline |
| `SharedAnalysisPipeline.ts` | Shared analysis pipeline across pages |
| `VocalProcessor.ts` | Vocal processing utilities |
| `enhanced4BitQuantizer.ts` | Enhanced 4-bit quantization |
| `heritageAffinity.ts` | Heritage/cultural affinity scoring |
| `localVoiceModel.ts` | Local voice model inference |
| `toneUtils.ts` | Tone.js utility functions |
| `vocalTechniqueGenerator.ts` | Vocal technique generation |
| `wavEncoder.ts` | WAV file encoding |

---

## 4. DSP Components (`src/lib/dsp/`)

### Effects

| Module | Purpose |
|--------|---------|
| `compressor.ts` | Dynamics compression |
| `limiter.ts` | Brickwall limiter |
| `gate.ts` | Noise gate |
| `eq.ts` | Parametric equalizer |
| `multiband.ts` | Multiband processing |
| `reverb.ts` | Reverb |
| `delay.ts` | Delay |
| `chorus.ts` | Chorus |
| `flanger.ts` | Flanger |
| `phaser.ts` | Phaser |
| `distortion.ts` | Distortion |
| `tremolo.ts` | Tremolo |
| `autopan.ts` | Auto-panning |
| `ringmod.ts` | Ring modulation |
| `vocoder.ts` | Vocoder |
| `stereoImager.ts` | Stereo imaging |

### DSP Infrastructure

| Module | Purpose |
|--------|---------|
| `AudioContextManager.ts` | AudioContext lifecycle management |
| `ParameterOptimizer.ts` | DSP parameter optimization |
| `ParameterParser.ts` | Parameter parsing utilities |
| `RealTimeAudioEngine.ts` | Real-time DSP engine |
| `VST3Exporter.ts` | VST3 format export |
| `VersionControl.ts` | DSP chain version control |
| `WasmCompiler.ts` | WASM compilation for DSP |
| `euclideanRhythm.ts` | Euclidean rhythm generator |
| `regionalSwingProfiles.ts` | SA regional swing profiles |
| `masteringPresets.ts` | Mastering preset chains |
| `presets.ts` | General DSP presets |
| `types.ts` | DSP type definitions |

---

## 5. Machine Learning Components (`src/lib/ml/`)

| File | Purpose |
|------|---------|
| `authenticityLearning.ts` | Linear regression for learned authenticity weights |
| `frechetAudioDistance.ts` | FAD calculator for quality assessment |
| `realTimePrediction.ts` | Real-time genre/element prediction |
| `vectorEmbeddings.ts` | TF-IDF + OpenAI embeddings for semantic search |
| `AmapianoClassifier.ts` | Amapiano subgenre classifier |
| `AmapianoFeatureExtractor.ts` | Amapiano-specific feature extraction |
| `AuthenticElementGenerator.ts` | Authentic element generation |
| `GrooveLearningEngine.ts` | Groove pattern learning |
| `NeuralAuthenticityModel.ts` | Neural authenticity scoring model |
| `NeuralDiscriminator.ts` | Neural quality discriminator |
| `NeuralElementSelector.ts` | Neural element selection |
| `NeuralGenreClassifier.ts` | Neural genre classification |
| `NeuralReflectionSystem.ts` | Neural reflection/self-evaluation |
| `ProductionRuleEngine.ts` | Production rule engine |

---

## 6. Research Library (`src/lib/research/`)

| File | Purpose |
|------|---------|
| `DistributedInferenceCoordinator.ts` | Distributed inference coordination |
| `ModelQuantizer.ts` | Model quantization testing |
| `RadialAttention.ts` | Radial attention mechanism |
| `SparseInferenceCache.ts` | Sparse inference caching |

---

## 7. React Hooks (`src/hooks/`)

### Agent & AI Hooks

| Hook | Purpose |
|------|---------|
| `useAutonomousAgent` | Autonomous agent state management |
| `useAgentMemoryPersistence` | Agent execution persistence |
| `useMLPredictions` | Unified ML predictions interface |
| `useMultiAgentOrchestrator` | Multi-agent coordination |
| `useAmapianoML` | Amapiano ML model interface |
| `useAmbientOrchestrator` | Ambient agent orchestration |
| `useMCPServer` | MCP server integration |

### Audio Processing Hooks

| Hook | Purpose |
|------|---------|
| `useAudioEngine` | Core audio engine |
| `useHighSpeedAudioEngine` | Low-latency audio processing |
| `useRealTimeAudioEngine` | Real-time audio with Tone.js |
| `useRealTimeAudio` | Real-time audio utilities |
| `useRealAudioDAW` | Real audio DAW engine |
| `useAudioEffects` | Effects chain management |
| `useAudioPlayer` | Audio playback control |
| `useEssentiaAnalysis` | Essentia.js audio analysis |
| `useUnifiedMusicAnalysis` | Combined analysis pipeline |
| `useTonePlayback` | Tone.js playback control |
| `useWaveformVisualization` | Waveform rendering |
| `useSpectralAnalysis` | Spectral analysis |
| `useAutoTimeStretch` | Automatic time stretching |
| `useRealtimeFeatureExtraction` | Real-time feature extraction |

### Amapianorization Hooks

| Hook | Purpose |
|------|---------|
| `useAmapianorizationProcessor` | Amapianorization execution |
| `useAmapianorizationPersistence` | Results persistence |
| `useAmapianorizer` | Amapianorizer control |
| `useAmapianoPlayback` | Amapiano-specific playback |
| `useLogDrumDesigner` | Log drum pattern design |
| `usePercussionLayering` | Percussion layer control |
| `useBassLayering` | Bass layer control |

### DAW & Project Hooks

| Hook | Purpose |
|------|---------|
| `useDawProjects` | DAW project management |
| `useDAWProject` | Single DAW project state |
| `useDAWState` | DAW UI state |
| `useDAWClipHandlers` | Clip interaction handlers |
| `useDAWTrackHandlers` | Track interaction handlers |
| `useProjectManager` | Project CRUD operations |
| `useProjectVersions` | Version control |
| `useProjectSharing` | Project sharing |
| `useProjectTemplates` | Template management |
| `useUndoRedo` | Undo/redo stack |
| `useArrangementTemplates` | Arrangement template management |
| `useRemixTemplates` | Remix template management |

### Collaboration Hooks

| Hook | Purpose |
|------|---------|
| `useRealtimeCollaboration` | Real-time sync |
| `useRealtimePresence` | User presence |
| `useEnhancedCollaboration` | Enhanced collab features |
| `useDuetCollaboration` | Duet creation |
| `useCrossWorkspaceSharing` | Cross-workspace sharing |
| `useVoiceChat` | Voice chat |

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
| `useRoyaltySplits` | Royalty split management |
| `useDistribution` | Music distribution |
| `useTrendAnalysis` | Trend analysis |

### Research & Testing Hooks

| Hook | Purpose |
|------|---------|
| `useUserStudyPersistence` | User study data |
| `useUserStudyAudioPersistence` | Study audio storage |
| `useAudioAnalysisPersistence` | Analysis results storage |
| `useGeneratedSamplesPersistence` | Sample generation history |
| `useModelQuantizer` | Quantization testing |
| `useABTesting` | A/B test management |
| `useTestHistory` | Test history tracking |
| `useRadialAttention` | Radial attention interface |
| `useSparseInferenceCache` | Sparse inference cache |
| `useDistributedInference` | Distributed inference |

### Performance Hooks

| Hook | Purpose |
|------|---------|
| `useRealtimePerformanceMonitoring` | Performance metrics |
| `usePerformanceAlerts` | Alert management |
| `usePerformanceTeamCollaboration` | Team collaboration on perf |
| `useCostTracking` | Cost monitoring |

### Misc Hooks

| Hook | Purpose |
|------|---------|
| `use-mobile` | Mobile device detection |
| `use-toast` | Toast notification |
| `useCloudStorage` | Cloud storage integration |
| `useCommunityFeedback` | Community feedback |
| `useDataSpace` | Data space management |
| `useDebouncedRequest` | Debounced API requests |
| `useFeatureFlags` | Feature flag management |
| `useLANDRMastering` | LANDR mastering integration |
| `useLANDRSamples` | LANDR samples integration |
| `useMIDIController` | MIDI controller input |
| `useMIDIHumanization` | MIDI humanization |
| `useModalApi` | Modal compute API |
| `useModelAnalytics` | Model analytics |
| `useMultiLanguage` | Multi-language support |
| `useMultiModalVectorSearch` | Multi-modal vector search |
| `useNeuralMusicEngine` | Neural music engine |
| `usePatternsLibrary` | Pattern library |
| `useSampleLibrary` | Sample library |
| `useStyleTransfer` | Style transfer |
| `useVectorSearch` | Vector search |
| `useWasmAcceleratedGeneration` | WASM-accelerated generation |
| `useWorkspace` | Workspace management |
| `useAuditLog` | Audit log |
| `useAsyncJobPolling` | Async job polling |

**Total Hooks: 97**

---

## 8. Pages & Routes

### Core Production Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `Index.tsx` | Landing page |
| `/auth` | `Auth.tsx` | Authentication |
| `/daw` | `DAW.tsx` | Digital Audio Workstation |
| `/generate` | `Generate.tsx` | Music generation (7 tabs: Prompt, Reference, Stem-by-Stem, Mood, Voice-to-MIDI, Suno-Style, Modal GPU). Reference tab: generation is driven by reference analysis; description field is supplementary only. Supports multi-voice selection for duets. |
| `/analyze` | `Analyze.tsx` | Audio analysis |
| `/amapianorize` | `Amapianorize.tsx` | Amapianorization workflow |
| `/samples` | `Samples.tsx` | Sample library |
| `/patterns` | `Patterns.tsx` | Pattern library |
| `/studio` | `Studio.tsx` | Studio workspace |
| `/audio-editor` | `AudioEditor.tsx` | Audio editing |
| `/audio-lab` | `AudioLab.tsx` | Audio experimentation lab |
| `/master` | `MasteringStudio.tsx` | AI mastering studio |

### Generation Sub-Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/generate-song-suno` | `SunoGenerator.tsx` | Suno-style generation |
| `/generate-song-elevenlabs-singing` | `ElevenLabsSinging.tsx` | ElevenLabs singing voice |
| `/generate-instrumental` | `InstrumentalGenerator.tsx` | Instrumental generation |
| `/generate-backing-with-intro` | `BackingWithIntro.tsx` | Backing track with intro |
| `/ai-lyrics-generator` | `AILyricsGeneratorPage.tsx` | Standalone lyrics generator |
| `/stem-splitter` | `StemSplitterPage.tsx` | Stem splitting (auto-loads from Generate page via localStorage handoff) |
| `/vocal-remover` | `VocalRemoverPage.tsx` | Vocal removal |
| `/sound-effect` | `SoundEffectPage.tsx` | Sound effect generation |
| `/suno-studio` | `SunoStudioPage.tsx` | Suno studio interface |

### AI & Agent Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/ai-hub` | `AIHub.tsx` | AI capabilities hub |
| `/agent-demo` | `AgentDemo.tsx` | Autonomous agent testing |
| `/aura` | `AuraPlatform.tsx` | AURA orchestration |
| `/aura-x` | `AuraXHub.tsx` | Aura-X hub |
| `/aura-x/architecture` | `AuraXArchitecture.tsx` | Aura-X architecture docs |
| `/aura-x/text-to-production` | `TextToProduction.tsx` | Text-to-production pipeline |
| `/aura-x/voice-licensing` | `VoiceLicensing.tsx` | Voice licensing |
| `/vast-demo` | `VASTDemo.tsx` | VAST integration demo |
| `/level5-dashboard` | `Level5Dashboard.tsx` | Level 5 autonomy dashboard |
| `/modal-dashboard` | `ModalDashboard.tsx` | Modal compute dashboard |
| `/dj-agent` | `DJAgent.tsx` | DJ agent interface |

### Social & Creator Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/social` | `SocialFeed.tsx` | Social content feed |
| `/social/post/:id` | `SocialFeed.tsx` | Individual post view |
| `/creator-hub` | `CreatorHub.tsx` | Creator dashboard |
| `/release` | `ReleaseManager.tsx` | Release management |
| `/promote` | `PromotionHub.tsx` | Promotion hub |
| `/landr` | `LANDRHub.tsx` | LANDR integration hub |

### Research & Testing Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/audio-test-lab` | `AudioTestLab.tsx` | Audio testing & quantization |
| `/user-study` | `UserStudy.tsx` | A/B blind listening tests |
| `/study-recruitment` | `StudyRecruitment.tsx` | Study participant recruitment |
| `/study-analytics` | `StudyAnalytics.tsx` | Study results dashboard |
| `/research` | `Research.tsx` | Research overview |
| `/workflow-validation` | `WorkflowValidation.tsx` | Workflow testing |
| `/ab-pair-generator` | `ABPairGenerator.tsx` | A/B test pair generation |
| `/ml/quantize` | `MLQuantize.tsx` | ML quantization testing |
| `/training` | `TrainingDataCollection.tsx` | Training data collection |
| `/training-dataset` | `TrainingDataset.tsx` | Training dataset management |

### Development & Admin Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | `Admin.tsx` | Admin dashboard |
| `/admin/inventory` | `AdminInventory.tsx` | Platform inventory dashboard |
| `/plugin-dev` | `PluginDev.tsx` | Plugin development |
| `/performance` | `Performance.tsx` | Performance monitoring |
| `/profile` | `Profile.tsx` | User profile |
| `/templates` | `TemplatesShowcase.tsx` | Template gallery |
| `/voice-lab` | `VoiceLab.tsx` | Voice experimentation lab |

### Demo & Showcase Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/essentia-demo` | `EssentiaDemo.tsx` | Essentia.js demo |
| `/aura808` | `Aura808Demo.tsx` | 808 synthesis demo |
| `/rhythm-demo` | `RhythmDemo.tsx` | Rhythm pattern demo |
| `/amapiano-pro` | `AmapianoPro.tsx` | Amapiano Pro features |
| `/pitch-deck` | `AWSActivatePitchDeck.tsx` | AWS pitch deck |
| `/pitch-deck-comparison` | `PitchDeckComparison.tsx` | Pitch deck comparison |

### Redirect Routes

| Route | Target |
|-------|--------|
| `/subscription` | `/` with subscription modal |
| `/marketplace` | `/` with marketplace modal |
| `/subscription-success` | `/` |
| `/purchase-success` | `/` |
| `/aihub` | Redirects to `/ai-hub` |

**Total Routed Pages: 61** (excluding redirects and catch-all)

---

## 9. UI Components (`src/components/ui/`)

**Layout:** accordion, card, collapsible, dialog, drawer, resizable, scroll-area, separator, sheet, sidebar, tabs

**Form:** button, calendar, checkbox, form, input, input-otp, label, radio-group, select, slider, switch, textarea, toggle, toggle-group

**Navigation:** breadcrumb, command, context-menu, dropdown-menu, menubar, navigation-menu, pagination, popover

**Feedback:** alert, alert-dialog, badge, progress, skeleton, sonner, toast, toaster, tooltip

**Data Display:** aspect-ratio, avatar, carousel, chart, hover-card, table

---

## 10. Feature Components (`src/components/`)

### Component Directories

| Directory | Purpose |
|-----------|---------|
| `admin/` | Admin dashboard panels |
| `agent/` | Agent UI components |
| `ai/` | AI assistant integrations |
| `amapiano/` | Amapiano-specific UI |
| `audio/` | Audio player/visualizer |
| `aura/` | AURA orchestration UI |
| `collaboration/` | Collaboration panels |
| `daw/` | DAW timeline, mixer, transport |
| `daw-pro/` | Advanced DAW components |
| `distribution/` | Music distribution UI |
| `dj-agent/` | DJ agent interface |
| `generate/` | Generation page sub-components (incl. `GeneratedTrackAnalysis`) |
| `instruments/` | Virtual instrument UIs |
| `integrations/` | Third-party integrations |
| `marketplace/` | Plugin marketplace |
| `music/` | Music tools (StemSplitter, VocalRemover, etc.) |
| `navigation/` | App navigation |
| `network/` | Network status |
| `plugins/` | Plugin management panels |
| `research/` | Research/study UIs |
| `samples/` | Sample library UI |
| `social/` | Social feed, interactions |
| `studio/` | Studio workspace |
| `suno-studio/` | Suno studio UI |
| `timeline/` | Timeline rendering |
| `training/` | Training data UI |
| `voice/` | Voice processing UI |
| `voice-engine/` | Voice engine UI |

### Standalone Feature Components

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
| `VoiceToMIDI.tsx` | Voice-to-MIDI engine |
| `VoiceToMusicEngine.tsx` | Voice-to-music pipeline |
| `UnifiedVoiceToMusicEngine.tsx` | Unified voice engine |
| `MoodBasedGenerator.tsx` | Mood-based generation |
| `AIAssistantHub.tsx` | AI assistant hub |
| `AIModelRouter.tsx` | Multi-model routing |
| `AIPromptParser.tsx` | Natural language prompt parsing |
| `DuetCreator.tsx` | Duet creation interface |
| `CreatorDashboard.tsx` | Creator analytics |
| `EngagementAnalytics.tsx` | Engagement metrics |
| `BatchProcessor.tsx` | Batch audio processing |
| `EnhancedFileUpload.tsx` | Multi-format file upload |
| `GhostProducerMode.tsx` | Ghost producer mode |
| `RAGKnowledgeBase.tsx` | RAG knowledge base UI |
| `WorkspaceManager.tsx` | Workspace management |

---

## 11. Database Tables

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
| `cloud_project_versions` | Cloud project version history |
| `arrangement_templates` | Arrangement templates |

### Audio & Analysis

| Table | Purpose |
|-------|---------|
| `audio_analysis_results` | Analysis data |
| `audio_to_midi_conversions` | MIDI conversion results |
| `amapianorization_results` | Amapianorization results |
| `generated_samples` | Sample generation history |
| `production_sessions` | Generation session data |
| `musical_vectors` | Vector embeddings |

### Social Features

| Table | Purpose |
|-------|---------|
| `social_posts` | Social content |
| `post_comments` | Comments |
| `post_interactions` | Likes, shares |
| `community_posts` | Community content |
| `community_comments` | Community comments |
| `community_feedback` | Community feedback |
| `creator_earnings` | Earnings tracking |
| `creator_analytics` | Creator analytics |
| `music_clips` | Music clip segments |
| `duet_collaborations` | Duet collaborations |

### Agent & AI

| Table | Purpose |
|-------|---------|
| `agent_executions` | Agent run history |
| `agent_memory` | Agent memory storage |
| `ai_context_memory` | AI context persistence |
| `ai_model_usage` | Model usage tracking |
| `ai_model_marketplace` | AI model listings |
| `aura_conductor_sessions` | AURA orchestration sessions |

### Research & Performance

| Table | Purpose |
|-------|---------|
| `ab_test_results` | A/B test results |
| `papers` | Research papers |
| `model_versions` | Model version tracking |
| `learning_metrics` | Learning metrics |
| `performance_metrics` | Performance data |
| `performance_anomalies` | Anomaly tracking |
| `performance_benchmarks` | Performance benchmarks |
| `performance_comments` | Performance annotations |
| `expert_annotations` | Expert annotations |
| `content_gap_analysis` | Content gap analysis |

### Marketplace & Plugins

| Table | Purpose |
|-------|---------|
| `marketplace_items` | Plugin listings |
| `plugin_reviews` | Plugin reviews |
| `plugin_downloads` | Download tracking |
| `plugin_submissions` | Submission queue |
| `plugin_categories` | Plugin categories |
| `orders` | Purchase records |
| `instrument_presets` | Instrument presets |
| `instruments_catalog` | Instrument catalog |

### Collaboration

| Table | Purpose |
|-------|---------|
| `collaboration_sessions` | Collab sessions |
| `collaboration_participants` | Participant tracking |
| `collaboration_rooms` | Room management |

### Distribution & Licensing

| Table | Purpose |
|-------|---------|
| `distribution_releases` | Release distribution |
| `artist_licenses` | Artist licenses |
| `artist_payouts` | Artist payouts |
| `licensed_content` | Licensed content |
| `partnership_requests` | Partnership requests |
| `partnership_metrics` | Partnership metrics |
| `voice_models` | Voice model registry |

### Analytics & Events

| Table | Purpose |
|-------|---------|
| `analytics_events` | Analytics event tracking |

### Infrastructure

| Table | Purpose |
|-------|---------|
| `distributed_inference_jobs` | Distributed inference jobs |
| `dj_library_tracks` | DJ library tracks |
| `dj_track_features` | DJ track features |
| `dj_performance_plans` | DJ performance plans |
| `dj_renders` | DJ renders |
| `automation_lanes` | DAW automation lanes |

---

## 12. Secrets & API Keys

### Configured Secrets

| Secret | Service | Status |
|--------|---------|--------|
| `REPLICATE_API_KEY` | Replicate (MusicGen, Demucs) | ✅ Configured |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS & Singing | ✅ Configured |
| `OPENAI_API_KEY` | OpenAI embeddings | ✅ Configured |
| `STRIPE_SECRET_KEY` | Stripe billing | ✅ Configured (managed) |
| `RESEND_API_KEY` | Email notifications | ✅ Configured |
| `SUNO_API_KEY` | Suno music generation | ✅ Configured |
| `AIML_API_KEY` | AI/ML API | ✅ Configured |
| `LOVABLE_API_KEY` | Lovable AI Gateway | ✅ Auto-configured (managed) |
| `SUPABASE_URL` | Supabase connection | ✅ Auto-configured |
| `SUPABASE_ANON_KEY` | Supabase anon key | ✅ Auto-configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | ✅ Auto-configured |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Edge Functions** | 68 |
| **Agent Components** | 20 |
| **Audio Library Files** | 31 |
| **DSP Modules** | 28 |
| **ML Components** | 14 |
| **Research Components** | 4 |
| **React Hooks** | 97 |
| **Pages/Routes** | 61 |
| **UI Components (shadcn)** | 48 |
| **Feature Component Dirs** | 29 |
| **Database Tables** | 60+ |
| **Configured Secrets** | 11 |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AMAPIANO-AI-STUDIO                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  61 React Pages │  │  48 UI Comps    │  │  Feature Comps  │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│  ┌────────▼────────────────────▼────────────────────▼────────┐ │
│  │                  97 React Hooks Layer                      │ │
│  │  (useAutonomousAgent, useAudioEngine, useAmapianorization) │ │
│  └────────┬────────────────────┬────────────────────┬────────┘ │
│           │                    │                    │           │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐ │
│  │  Agent System   │  │  Audio + DSP    │  │   ML Library    │ │
│  │  20 components  │  │  31 + 28 files  │  │  14 components  │ │
│  │  - ReAct Loop   │  │  - WebAudio     │  │  - FAD Calc     │ │
│  │  - LLM Engine   │  │  - SVDQuant     │  │  - Embeddings   │ │
│  │  - Multi-Agent  │  │  - 16 DSP FX    │  │  - Neural Nets  │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│  ┌────────▼────────────────────▼────────────────────▼────────┐ │
│  │                  Supabase Client Layer                     │ │
│  └────────┬────────────────────┬────────────────────┬────────┘ │
├───────────┼────────────────────┼────────────────────┼──────────┤
│           │   68 EDGE FUNCTIONS│                    │          │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐ │
│  │   AI Functions  │  │ Audio Functions │  │ Utility Funcs   │ │
│  │  - generate-*   │  │  - stem-sep     │  │  - zip-stems    │ │
│  │  - agent-reason │  │  - analyze      │  │  - billing (5)  │ │
│  │  - lyrics       │  │  - mastering    │  │  - alerts (6)   │ │
│  │  - modal-*      │  │  - vocal-remove │  │  - dj-agent     │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│  ┌────────▼────────────────────▼────────────────────▼────────┐ │
│  │                    External APIs                           │ │
│  │  Lovable AI │ ElevenLabs │ Replicate │ Stripe │ OpenAI    │ │
│  │  Suno │ Gemini │ AIML │ Modal │ Resend                    │ │
│  └───────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Supabase Database                        │ │
│  │  60+ Tables │ RLS Policies │ Functions │ Storage Buckets   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Behavioral Notes

- **Generate `/generate` Reference tab**: Generation is driven by reference analysis metadata (BPM, key, genre, mood). The description field is supplementary only and includes a helper note clarifying this. The prompt field clears when switching to the Reference tab.
- **Multi-voice duets**: Voice style selector supports multi-select; selecting 2+ voices activates Duet Mode in the generation payload.
- **Stem Splitter auto-load**: The `/stem-splitter` page auto-loads tracks from the Generate page via a `localStorage` handoff (`pendingStemTrack`).
- **Generated Track Analysis**: After generation, users can run a full analysis (BPM, Key, Energy, Genre) on the output track via the `GeneratedTrackAnalysis` component.
- **Lyrics generation**: Uses `generate-lyrics` edge function (Gemini), returns dual versions (A/B) with titles. Supports theme auto-synthesis, sub-genre, mood, language, and multi-voice style parameters.

---

*This inventory was verified against the actual codebase on February 2026.*
