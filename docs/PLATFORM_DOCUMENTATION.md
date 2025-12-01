# Amapiano AI Studio - Complete Platform Documentation

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Research Infrastructure / Partial Production Ready

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Pages & Navigation](#pages--navigation)
3. [Feature Status Matrix](#feature-status-matrix)
4. [AI/ML/LLM Capabilities](#aimlllm-capabilities)
5. [Data & Database](#data--database)
6. [Gaps & Limitations](#gaps--limitations)
7. [Production Readiness Assessment](#production-readiness-assessment)

---

## Platform Overview

### What Is This Platform?

Amapiano AI Studio is a web-based Digital Audio Workstation (DAW) integrated with AI-powered music generation, specifically designed for creating and enhancing Amapiano music. It serves dual purposes:

1. **Consumer Product**: Music creation platform for producers
2. **PhD Research Infrastructure**: Thesis baseline for MIT EECS doctoral research on "Green AI for Audio Generation"

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI primitives |
| State Management | TanStack Query, React Context |
| Audio Processing | Web Audio API, Tone.js |
| Backend | Supabase (PostgreSQL, Edge Functions, Storage) |
| AI Gateway | Lovable AI (Google Gemini, OpenAI GPT) |
| External APIs | ElevenLabs (TTS), Replicate (Demucs stem separation) |

---

## Pages & Navigation

### Main Navigation Structure

```
/ (Index/Landing)
├── /daw                    - Digital Audio Workstation
├── /generate               - Suno-Style Music Generation Workflow
├── /feed                   - Social Feed
├── /samples                - Sample Library Browser
├── /patterns               - Pattern Library
├── /aura                   - AURA Platform (AI Orchestration)
├── /ai-hub                 - AI Tools Hub
├── /creator-hub            - Creator Dashboard
├── /research               - Research Overview
├── /admin                  - Admin Dashboard
├── /auth                   - Authentication
├── /user-study             - A/B Listening Test (PhD Research)
├── /study-recruitment      - Study Participant Recruitment
├── /study-analytics        - Study Results Dashboard
├── /audio-test-lab         - Audio Processing Test Lab
├── /analyze                - Audio Analysis
├── /essentia-demo          - Essentia.js Demo
├── /vast-demo              - VAST Platform Demo
├── /aura808-demo           - AURA-808 Demo
└── /404                    - Not Found
```

---

### Page-by-Page Documentation

#### 1. Landing Page (`/`)

**Purpose:** Marketing landing page introducing the platform

**Tabs/Sections:**
- Hero section with CTA buttons
- Features showcase
- Pricing information
- Footer with links

**Buttons:**
| Button | Action | Status |
|--------|--------|--------|
| "Get Started" | Navigate to /auth | ✅ Active |
| "Try Demo" | Navigate to /daw | ✅ Active |
| "Learn More" | Scroll to features | ✅ Active |

**Status:** ✅ Production Ready

---

#### 2. Digital Audio Workstation (`/daw`)

**Purpose:** Professional multi-track audio editing environment

**Tabs:**
| Tab | Purpose | Status |
|-----|---------|--------|
| Tracks | Timeline view with audio tracks | ✅ Functional |
| Mixer | Volume/pan mixing console | ✅ Functional |
| Effects | DSP effect chain management | ⚠️ Partial (UI only, limited processing) |
| Samples | Sample browser sidebar | ✅ Functional |
| Analysis | Essentia.js audio analysis | ✅ Functional |

**Key Components:**
- Timeline with zoom/scroll
- Track lanes (add/remove/mute/solo)
- Transport controls (play/pause/stop/record)
- BPM/time signature controls
- Master volume

**Buttons:**
| Button | Action | Status |
|--------|--------|--------|
| Play/Pause | Toggle playback | ✅ Active |
| Stop | Stop and reset position | ✅ Active |
| Record | Start recording | ⚠️ UI only |
| Add Track | Create new track | ✅ Active |
| Save Project | Save to Supabase | ✅ Active |
| Export | Export audio file | ⚠️ Partial |

**Expected Output:** Multi-track audio project with mixed stems

**Status:** ⚠️ Partial Production Ready
- Timeline/mixing: Functional
- Real-time effects: Limited
- Recording: Not implemented
- Export: Basic WAV only

---

#### 3. Generate Page (`/generate`)

**Purpose:** Suno-style end-to-end music generation workflow

**Steps/Wizard:**
| Step | Name | Purpose | Status |
|------|------|---------|--------|
| 1 | Generate Lyrics | AI lyrics in African languages | ✅ Functional |
| 2 | Configure Voice | Male/female/duet, style selection | ✅ Functional |
| 3 | Generate Song | Create song with vocals | ⚠️ Requires ElevenLabs subscription |
| 4 | Separate Stems | Demucs stem separation | ✅ Functional |
| 5 | Amapianorize | Enhance with Amapiano elements | ✅ Functional |

**Buttons:**
| Button | Action | Status |
|--------|--------|--------|
| Generate Lyrics | Call ai-chat edge function | ✅ Active |
| Save Lyrics | Store edited lyrics | ✅ Active |
| Generate Song | Call generate-song-with-vocals | ⚠️ Requires paid API |
| Separate Stems | Call stem-separation | ✅ Active |
| Amapianorize | Apply Amapiano enhancement | ✅ Active |
| Export All Assets | Download ZIP of stems | ✅ Active |
| Open in DAW | Navigate to /daw with stems | ✅ Active |

**Expected Output:** 
- Generated lyrics text
- Audio file with vocals
- Separated stems (vocals, drums, bass, piano, other)
- Amapianorized enhanced audio

**Status:** ⚠️ Partial Production Ready
- Lyrics generation: Fully functional
- Vocal synthesis: Requires ElevenLabs paid plan
- Stem separation: Fully functional (2-5 min processing)
- Amapianorization: Functional with real WebAudio processing

---

#### 4. Social Feed (`/feed`)

**Purpose:** TikTok-style vertical feed of user-generated music

**Tabs:**
| Tab | Purpose | Status |
|-----|---------|--------|
| For You | Algorithmic feed | ⚠️ Demo (no real algorithm) |
| Following | Posts from followed users | ⚠️ Demo |
| Trending | Popular posts | ⚠️ Demo |

**Buttons:**
| Button | Action | Status |
|--------|--------|--------|
| Like | Like a post | ✅ Active (DB write) |
| Comment | Open comments | ✅ Active |
| Share | Share post | ⚠️ UI only |
| Remix | Create remix | ⚠️ Demo |

**Expected Output:** Scrollable feed of music posts with engagement

**Status:** ⚠️ Demo
- UI: Complete
- Database: Tables exist
- Algorithm: Not implemented (chronological only)
- Real content: None (would need user uploads)

---

#### 5. Samples Library (`/samples`)

**Purpose:** Browse and preview audio samples

**Tabs:**
| Tab | Purpose | Status |
|-----|---------|--------|
| All | All samples | ✅ Functional |
| Drums | Drum samples | ✅ Functional |
| Bass | Bass samples | ✅ Functional |
| Keys | Keyboard/piano samples | ✅ Functional |
| FX | Effect samples | ✅ Functional |
| Analysis | AI audio analysis | ✅ Functional |

**Buttons:**
| Button | Action | Status |
|--------|--------|--------|
| Preview | Play sample | ✅ Active |
| Add to Project | Add to DAW | ✅ Active |
| Download | Download sample | ⚠️ Partial |
| Analyze | Run Essentia analysis | ✅ Active |

**Expected Output:** Searchable/filterable sample library with preview

**Status:** ✅ Production Ready (with limited sample content)

---

#### 6. Patterns Library (`/patterns`)

**Purpose:** Browse rhythm and melodic patterns

**Tabs:**
| Tab | Purpose | Status |
|-----|---------|--------|
| Drums | Drum patterns | ✅ Functional |
| Bass | Basslines | ✅ Functional |
| Melodies | Melodic patterns | ✅ Functional |
| Analysis | Pattern analysis | ✅ Functional |

**Status:** ✅ Production Ready (with limited pattern content)

---

#### 7. AURA Platform (`/aura`)

**Purpose:** AI orchestration and autonomous music generation

**Tabs:**
| Tab | Purpose | Status |
|-----|---------|--------|
| Conductor | AI task orchestration | ⚠️ Demo (mock responses) |
| Generate | Music generation | ⚠️ Demo |
| Analysis | Audio analysis | ✅ Functional |

**Expected Output:** Orchestrated AI-generated music

**Status:** ⚠️ Demo
- UI: Complete
- Orchestration: Mock implementation
- Actual AI generation: Not connected to real models

---

#### 8. AI Hub (`/ai-hub`)

**Purpose:** Central hub for all AI tools

**Tabs:**
| Tab | Purpose | Status |
|-----|---------|--------|
| Generate | Text-to-music generation | ⚠️ Demo |
| Transform | Style transfer | ⚠️ Demo |
| Analyze | Audio analysis | ✅ Functional |
| Analysis | Essentia deep analysis | ✅ Functional |

**Status:** ⚠️ Partial
- Analysis: Fully functional
- Generation: Demo/mock only

---

#### 9. Creator Hub (`/creator-hub`)

**Purpose:** Creator analytics and monetization dashboard

**Tabs:**
| Tab | Purpose | Status |
|-----|---------|--------|
| Overview | Stats summary | ⚠️ Demo |
| Analytics | Detailed metrics | ⚠️ Demo |
| Earnings | Revenue tracking | ⚠️ Demo |
| Analysis | Content analysis | ✅ Functional |

**Status:** ⚠️ Demo (no real creator economy implemented)

---

#### 10. Research Page (`/research`)

**Purpose:** PhD research overview and documentation

**Sections:**
- Research objectives
- Current progress
- Technical architecture
- Links to study pages

**Status:** ✅ Production Ready (documentation page)

---

#### 11. Admin Dashboard (`/admin`)

**Purpose:** Platform administration

**Tabs:**
| Tab | Purpose | Status |
|-----|---------|--------|
| Overview | Platform stats | ⚠️ Demo |
| Users | User management | ⚠️ Demo |
| Content | Content moderation | ⚠️ Demo |
| Monitoring | API performance metrics | ✅ Functional |
| MLOps | AI model analytics | ⚠️ Partial |
| Security | Security checklist | ✅ Functional |

**Status:** ⚠️ Partial (monitoring/security functional, others demo)

---

#### 12. User Study (`/user-study`)

**Purpose:** A/B blind listening test for PhD research

**Flow:**
1. Demographics collection (age, country, DAW, experience)
2. Listen to Track A and Track B (randomized)
3. Rate authenticity (1-10 scale)
4. Select preference
5. Provide feedback
6. Submit response

**Buttons:**
| Button | Action | Status |
|--------|--------|--------|
| Play Track A/B | Play audio samples | ✅ Active |
| Submit | Save response to database | ✅ Active |

**Expected Output:** User study response saved to `user_study_responses` table

**Status:** ✅ Production Ready

---

#### 13. Study Recruitment (`/study-recruitment`)

**Purpose:** Recruit participants for user study

**Features:**
- Copy study link
- Share via Email (pre-written message)
- Share via WhatsApp
- Share via Twitter/X

**Status:** ✅ Production Ready

---

#### 14. Study Analytics (`/study-analytics`)

**Purpose:** Analyze user study results

**Metrics Displayed:**
- Total responses
- Unique participants
- Average authenticity rating
- Preference breakdown (Track A vs B)
- Results by experience level
- Results by Amapiano familiarity

**Buttons:**
| Button | Action | Status |
|--------|--------|--------|
| Export JSON | Download raw data | ✅ Active |
| Export CSV | Download spreadsheet | ✅ Active |
| Refresh | Reload data | ✅ Active |

**Status:** ✅ Production Ready

---

#### 15. Audio Test Lab (`/audio-test-lab`)

**Purpose:** Test audio processing algorithms

**Sections:**
| Section | Purpose | Status |
|---------|---------|--------|
| Sample Generation | Generate synthetic samples | ✅ Functional |
| Amapianorization Test | Test enhancement engine | ✅ Functional |
| Quantization Test | Test SVDQuant-Audio | ✅ Functional |
| Analysis Results | View musicality metrics | ✅ Functional |

**Expected Output:**
- Generated audio samples (WAV)
- Amapianorized audio
- Quantized audio with quality metrics
- Musicality analysis results

**Status:** ✅ Production Ready (research tool)

---

## Feature Status Matrix

| Feature | UI | Backend | Database | AI/ML | Status |
|---------|----|---------| ---------|-------|--------|
| User Authentication | ✅ | ✅ | ✅ | - | ✅ Production |
| DAW Timeline | ✅ | ✅ | ✅ | - | ✅ Production |
| DAW Mixer | ✅ | ✅ | ✅ | - | ✅ Production |
| DAW Effects | ✅ | ⚠️ | - | - | ⚠️ Partial |
| Lyrics Generation | ✅ | ✅ | ✅ | ✅ | ✅ Production |
| Vocal Synthesis | ✅ | ⚠️ | - | ⚠️ | ⚠️ Requires paid API |
| Stem Separation | ✅ | ✅ | ✅ | ✅ | ✅ Production |
| Amapianorization | ✅ | ✅ | ✅ | ✅ | ✅ Production |
| Sample Library | ✅ | ✅ | ✅ | - | ✅ Production |
| Pattern Library | ✅ | ✅ | ✅ | - | ✅ Production |
| Social Feed | ✅ | ⚠️ | ✅ | ❌ | ⚠️ Demo |
| Creator Economy | ✅ | ❌ | ✅ | - | ⚠️ Demo |
| Essentia Analysis | ✅ | ✅ | ✅ | ✅ | ✅ Production |
| User Study | ✅ | ✅ | ✅ | - | ✅ Production |
| SVDQuant-Audio | ✅ | ✅ | - | ✅ | ✅ Production |

---

## AI/ML/LLM Capabilities

### 1. Large Language Models (LLMs)

#### Lyrics Generation
| Aspect | Details |
|--------|---------|
| Model | Google Gemini 2.5 Flash (via Lovable AI Gateway) |
| Endpoint | `ai-chat` edge function |
| Input | Language, genre, style, theme |
| Output | Lyrics text in African languages |
| Languages | Zulu, Xhosa, Sotho, Tswana, Afrikaans, English |
| Status | ✅ **Fully Implemented & Functional** |

#### AI Orchestration (AURA Conductor)
| Aspect | Details |
|--------|---------|
| Model | Lovable AI Gateway (attempted) |
| Endpoint | `aura-conductor-orchestration` edge function |
| Actual Behavior | Falls back to heuristic plan generation |
| Status | ⚠️ **Mock/Heuristic** - Not using real LLM orchestration |

### 2. Audio AI Models

#### Stem Separation (Demucs)
| Aspect | Details |
|--------|---------|
| Model | cjwbw/demucs on Replicate |
| Version | `25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953` |
| Input | Audio file URL (public Supabase storage) |
| Output | 5 stems (vocals, drums, bass, piano, other) |
| Processing Time | 2-5 minutes |
| Status | ✅ **Fully Implemented & Functional** |

#### Voice Synthesis (ElevenLabs)
| Aspect | Details |
|--------|---------|
| Model | ElevenLabs TTS API |
| Endpoint | `generate-song-with-vocals` edge function |
| Input | Text, voice ID, voice settings |
| Output | Audio file with synthesized vocals |
| Status | ⚠️ **Requires Paid Subscription** |

#### Essentia.js Audio Analysis
| Aspect | Details |
|--------|---------|
| Library | essentia.js (WebAssembly) |
| Runs On | Client-side (browser) |
| Features Extracted | BPM, key, danceability, energy, loudness, spectral features |
| Status | ✅ **Fully Implemented & Functional** |

### 3. Custom Algorithms (Not ML-based)

#### SVDQuant-Audio (Phase-Aware Quantization)
| Aspect | Details |
|--------|---------|
| Type | Signal processing algorithm (not ML) |
| Purpose | Compress audio while preserving quality |
| Bit Depths | 4-bit, 8-bit, 16-bit |
| Techniques | Mid/Side processing, TPDF dithering, noise shaping, transient detection |
| Quality Metrics | FAD, stereo imaging, transient preservation |
| Status | ✅ **Fully Implemented** |

#### Amapianorization Engine
| Aspect | Details |
|--------|---------|
| Type | Rule-based + learned weights (not neural) |
| Purpose | Enhance audio with Amapiano elements |
| Components | Log drum library, percussion library, element selector, authenticity scoring |
| Processing | Real WebAudio API signal processing |
| Status | ✅ **Fully Implemented** |

#### Intelligent Element Selector
| Aspect | Details |
|--------|---------|
| Type | Heuristic matching algorithm |
| Input | BPM, key, complexity, regional style |
| Output | Selected samples matching source characteristics |
| Status | ✅ **Fully Implemented** |

#### Learned Authenticity Scoring
| Aspect | Details |
|--------|---------|
| Type | Weighted scoring model |
| Current State | Region-specific weights (Johannesburg, Pretoria, Durban, Cape Town) |
| Learning Source | Designed for user study annotation feedback |
| Status | ✅ **Implemented** (weights not yet trained from real data) |

### 4. RAG (Retrieval-Augmented Generation)

| Aspect | Details |
|--------|---------|
| Implementation | `rag-knowledge-search` edge function |
| Vector Storage | `musical_vectors` table with pgvector |
| Actual Usage | ⚠️ **Minimal** - Basic text scoring, not true vector similarity |
| Status | ⚠️ **Partial/Demo** |

### 5. Model Training

| Aspect | Status |
|--------|--------|
| Custom Model Training | ❌ **Not Implemented** |
| Fine-tuning | ❌ **Not Implemented** |
| Dataset | MagnaTagATune identified as interim (not integrated) |
| Training Infrastructure | ❌ **Not Implemented** |

### 6. AI/ML Gaps

| Gap | Description | Impact |
|-----|-------------|--------|
| No Custom Audio Generation | Relies on external APIs (ElevenLabs, Replicate) | Limited control, cost dependency |
| No Multimodal AI | Cannot "listen" to audio and generate complementary parts | Missing key feature from Suno |
| No Model Training | Cannot train custom Amapiano-specific models | Quality ceiling |
| RAG Not Functional | Vector search exists but not used meaningfully | No context-aware generation |
| No Local Models | All AI requires internet connection | Latency, cost, privacy concerns |

---

## Data & Database

### Database Tables (Supabase PostgreSQL)

#### Core Tables
| Table | Purpose | RLS | Status |
|-------|---------|-----|--------|
| `profiles` | User profiles | ✅ | ✅ Active |
| `subscribers` | Subscription data | ✅ | ✅ Active |
| `daw_projects` | DAW project storage | ✅ | ✅ Active |
| `samples` | Sample library metadata | ✅ | ✅ Active |

#### Social/Community Tables
| Table | Purpose | RLS | Status |
|-------|---------|-----|--------|
| `social_posts` | User-generated posts | ✅ | ⚠️ Demo |
| `community_posts` | Community content | ✅ | ⚠️ Demo |
| `community_comments` | Comments | ✅ | ⚠️ Demo |

#### AI/ML Tables
| Table | Purpose | RLS | Status |
|-------|---------|-----|--------|
| `audio_analysis_results` | Essentia analysis storage | ✅ | ✅ Active |
| `amapianorization_results` | Enhancement results | ✅ | ✅ Active |
| `generated_samples` | Synthetic sample history | ✅ | ✅ Active |
| `musical_vectors` | Vector embeddings (pgvector) | ✅ | ⚠️ Minimal use |
| `ai_model_usage` | AI model tracking | ✅ | ✅ Active |

#### Research Tables
| Table | Purpose | RLS | Status |
|-------|---------|-----|--------|
| `user_study_responses` | A/B test responses | ✅ | ✅ Active |

### Storage Buckets

| Bucket | Purpose | Public | Status |
|--------|---------|--------|--------|
| `samples` | Audio file storage | ✅ Yes | ✅ Active |

### Edge Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `ai-chat` | Lyrics generation via Lovable AI | ✅ Functional |
| `stem-separation` | Demucs via Replicate | ✅ Functional |
| `generate-song-with-vocals` | ElevenLabs TTS | ⚠️ Requires paid API |
| `zip-stems` | Bundle stems for download | ✅ Functional |
| `amapianorize-audio` | Enhancement processing | ✅ Functional |
| `essentia-deep-analysis` | Deep audio analysis | ✅ Functional |
| `music-analysis` | Music feature extraction | ✅ Functional |
| `aura-conductor-orchestration` | AI orchestration | ⚠️ Mock/heuristic |
| `rag-knowledge-search` | Vector search | ⚠️ Basic implementation |

---

## Gaps & Limitations

### Critical Gaps

| Gap | Description | Workaround |
|-----|-------------|------------|
| **No Real Audio Generation** | Cannot generate original audio from scratch | Use ElevenLabs for vocals, rely on stem manipulation |
| **No Multimodal AI** | AI cannot analyze audio and respond intelligently | Use Essentia for analysis, manual integration |
| **Vocal Synthesis Paywall** | ElevenLabs requires paid subscription | No workaround (essential for Suno-style workflow) |
| **No Model Training** | Cannot train custom models | Use pre-trained models, rule-based systems |
| **Limited Real-Time Processing** | WebAudio latency (~15-20ms) not suitable for live performance | Acceptable for production, not live use |

### Feature Gaps

| Feature | Expected | Actual | Gap |
|---------|----------|--------|-----|
| Recording | Record audio input | UI only | ❌ Not implemented |
| VST/Plugin Support | Load external plugins | Not possible in browser | ❌ Platform limitation |
| 96kHz/24-bit Audio | Professional quality | 44.1kHz/16-bit | ⚠️ Quality ceiling |
| Recommendation Algorithm | Personalized feed | Chronological only | ❌ Not implemented |
| Creator Payments | Real money transactions | Mock only | ❌ Not implemented |

### Data Gaps

| Data Type | Status |
|-----------|--------|
| Sample Content | Limited (synthetic samples available) |
| User Content | None (no real users) |
| Training Data | Not integrated |
| Vector Embeddings | Table exists, minimal population |

---

## Production Readiness Assessment

### Ready for Production ✅

| Component | Notes |
|-----------|-------|
| Authentication | Full Supabase Auth integration |
| DAW Core (Timeline/Mixer) | Functional multi-track editing |
| Lyrics Generation | Reliable LLM-powered generation |
| Stem Separation | Fully functional via Replicate |
| Amapianorization Engine | Real WebAudio processing |
| Audio Analysis (Essentia) | Client-side, no API dependency |
| User Study Infrastructure | Complete research tooling |
| Sample/Pattern Libraries | Functional with limited content |

### Demo/Partial ⚠️

| Component | Blocker |
|-----------|---------|
| Vocal Synthesis | Requires ElevenLabs paid plan |
| Social Feed | No recommendation algorithm |
| Creator Economy | No payment integration |
| AURA Orchestration | Mock responses only |
| AI Hub Generation | No real generation models |
| Admin Dashboard | Limited to monitoring |

### Not Production Ready ❌

| Component | Reason |
|-----------|--------|
| Recording | Not implemented |
| VST Support | Browser limitation |
| Model Training | No infrastructure |
| Custom Audio Generation | No models |
| Live Performance | Latency issues |

---

## Summary

### What Works (Production Ready)
1. DAW timeline and mixing
2. Lyrics generation in African languages
3. Stem separation (Demucs)
4. Amapianorization with real audio processing
5. Audio analysis (Essentia.js)
6. User study infrastructure
7. Sample/pattern browsing
8. User authentication

### What's Demo Only
1. Social feed (no algorithm)
2. Creator economy (no payments)
3. AURA orchestration (mock)
4. AI music generation (no models)
5. RAG/vector search (minimal)

### Critical Dependencies
1. **ElevenLabs** - Vocal synthesis (paid)
2. **Replicate** - Stem separation (paid per use)
3. **Lovable AI** - LLM gateway (usage limits)
4. **Supabase** - All backend services

### Recommended Next Steps
1. Complete user study with 20-30 participants
2. Train authenticity weights from study data
3. Evaluate ElevenLabs alternatives or secure funding
4. Implement basic recommendation algorithm for feed
5. Add more sample/pattern content

---

*This documentation reflects the platform state as of December 2024. For PhD research purposes, components should be honestly categorized as "implemented," "partial," or "proposed" in academic materials.*
