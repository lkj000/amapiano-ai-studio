# AURA-X Thread Gap Analysis & Implementation Roadmap

## Executive Summary

This document analyzes the comprehensive AURA-X design threads provided by the user and maps them against the current platform implementation to identify gaps and prioritize next steps.

---

## Core Vision from Threads

AURA-X should be a **Level 5 Autonomous AI Agent** that combines:
1. **Suno-style** text-to-song generation with vocals, lyrics assist, personas, covers, extend/replace
2. **Moises-style** hi-fi stem separation, chord/key detection, reference mastering
3. **Top 8 DAW capabilities** (Ableton, Logic, FL Studio, Cubase, Pro Tools, Studio One, Bitwig, Reaper)
4. **Lemon Slice-style real-time architecture** using Modal + Pipecat + Daily WebRTC

### Target Latency
- **2-3 seconds** prompt-to-first-audio (streamed)
- **Sub-second** transport jitter via WebRTC
- **3-6 seconds** end-to-end response (like Lemon Slice video)

---

## Current Implementation Status

### ✅ Implemented (Working)
| Component | Status | Notes |
|-----------|--------|-------|
| Modal FastAPI Backend | Scaffolded | `python-backend/modal_app/main.py` |
| Edge Function Proxies | Complete | `modal-analyze`, `modal-separate`, `modal-quantize` |
| LLM Gateway | Complete | Multi-provider routing (OpenAI, Anthropic, local) |
| Autonomous Agent Core | Complete | ReAct loop, goal decomposer, reflection system |
| WebAudio Processing | Complete | Real-time DSP, log drum generation |
| Amapianorization Engine | Complete | 7-component pipeline with regional authenticity |
| Suno-style Workflow | Complete | Lyrics → Voice → Generate → Stems → DAW |
| User Study Infrastructure | Complete | A/B testing, analytics dashboard |
| Database Persistence | Complete | 48+ tables with RLS policies |
| SVDQuant-Audio | Basic | 4-bit/8-bit quantization (needs enhancement) |

### ⚠️ Partially Implemented
| Component | Current State | Required State |
|-----------|--------------|----------------|
| Modal Deployment | Stopped/Not running | Always-on or warm-start |
| Real-time Streaming | HTTP request/response | WebRTC via Daily |
| Stem Separation | Mock/Edge proxy | Real Demucs on Modal GPU |
| Voice Synthesis | ElevenLabs API | Local + ElevenLabs hybrid |
| MusicGen Fine-tuning | Not implemented | LoRA-trained Amapiano model |

### ❌ Not Yet Implemented
| Component | Priority | Description |
|-----------|----------|-------------|
| Pipecat Integration | HIGH | Real-time orchestration pipeline |
| Daily WebRTC | HIGH | Sub-second audio streaming |
| ACE-Step / MusicGen | HIGH | Modal-hosted music generation |
| MCP Tool Server | MEDIUM | Stateless MCP for agent tools |
| Dora Trainer | MEDIUM | LoRA fine-tuning infrastructure |
| Session View (Clips) | MEDIUM | Ableton-style clip launcher |
| Comp Lanes | MEDIUM | Pro Tools-style take comping |
| Piano Roll | MEDIUM | FL Studio-style MIDI editing |
| EBU R128 Mastering | MEDIUM | Verified loudness + true-peak |
| Waveform Editor CC | LOW | Draggable region selection |

---

## Architecture Gap Analysis

### Current Architecture
```
Browser (React) → Supabase Edge Functions → Modal FastAPI (stopped)
                                          ↘ Lovable AI Gateway
```

### Target Architecture (from threads)
```
Browser (React/Daily SDK)
    ↓ WebRTC (duplex audio)
Pipecat Pipeline (Modal)
    ├── STT (Deepgram Nova)
    ├── LLM (Conductor Agent)
    ├── TTS (ElevenLabs streaming)
    └── Music Generation (ACE-Step/MusicGen)
          ├── Composer (chunked streaming)
          ├── Arranger (stem generation)
          ├── Mixer (real-time effects)
          └── Mastering (EBU R128)
    ↓ WebRTC
Browser (streamed audio)
```

---

## Priority Implementation Roadmap

### Phase 1: Modal Backend Activation (Week 1)
**Goal**: Get Modal backend running and accessible

- [ ] Fix Modal deployment (`modal deploy python-backend/modal_app/main.py`)
- [ ] Add health monitoring and keep-alive
- [ ] Implement real Demucs stem separation
- [ ] Implement basic MusicGen inference
- [ ] Test edge function → Modal communication

### Phase 2: Real-time Foundation (Weeks 2-3)
**Goal**: Enable real-time audio streaming

- [ ] Integrate Daily WebRTC client SDK
- [ ] Set up Pipecat pipeline on Modal
- [ ] Implement Deepgram STT integration
- [ ] Implement ElevenLabs streaming TTS
- [ ] Achieve <3s prompt-to-first-audio

### Phase 3: Music Generation (Weeks 4-6)
**Goal**: Suno-equivalent generation capabilities

- [ ] Deploy ACE-Step or MusicGen on Modal
- [ ] Implement chunked audio streaming
- [ ] Add lyrics assist with multilingual support
- [ ] Implement audio extend/replace/crop
- [ ] Create persona system for consistent timbres

### Phase 4: DAW Capabilities (Weeks 7-10)
**Goal**: Professional DAW feature parity

- [ ] Session View (clip launcher)
- [ ] Arrangement View (timeline)
- [ ] Comp Lanes (take recording/comping)
- [ ] Piano Roll (MIDI editing)
- [ ] Mixer (buses/sends/effects)
- [ ] EBU R128 Mastering

### Phase 5: Agent Intelligence (Weeks 11-12)
**Goal**: Full Level 5 autonomy

- [ ] MCP Tool Server on Modal
- [ ] LM-as-Judge evaluation pipeline
- [ ] Agent guardrails (policy, audit, approval)
- [ ] Chain-of-thought planning
- [ ] Multi-agent orchestration

---

## Key Technical Decisions

### 1. Music Generation Model
**Recommendation**: Start with ACE-Step (Modal has working example)
- Faster cold-start than MusicGen Large
- Good quality for prototyping
- Later: fine-tune MusicGen with Dora for Amapiano

### 2. Real-time Transport
**Recommendation**: Daily WebRTC + Pipecat
- Daily provides global low-latency infrastructure
- Pipecat orchestrates the pipeline
- Modal hosts the compute (co-located containers)

### 3. Stem Separation
**Recommendation**: Demucs v4 Hybrid Transformer
- Best quality (MUSDB HQ benchmark)
- 5-stem separation (vocals, drums, bass, other, piano)
- Run on Modal L40S GPU for speed

### 4. Mastering
**Recommendation**: Essentia EBU R128 + custom limiter
- Industry-standard loudness measurement
- True-peak limiting with oversampling
- Amapiano-specific presets

---

## Cost Optimization Strategy

### Modal GPU Selection
| Task | GPU | Cost/hr | Use Case |
|------|-----|---------|----------|
| Quick previews | L4/T4 | $0.35 | Draft generations |
| Stem separation | A10G | $0.61 | Batch processing |
| MusicGen inference | A100 | $2.50 | Final renders |
| Training | H100 | $3.50 | LoRA fine-tuning |

### Scaling Strategy
- Use memory snapshots for fast cold-start
- Co-locate containers with tunnels (like Lemon Slice)
- Warm pools for high-traffic periods
- Auto-scale based on session count

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Prompt-to-first-audio | N/A (Modal stopped) | <3 seconds |
| Generation quality | Mock audio | Radio-ready |
| Stem separation | Edge proxy (mock) | Real Demucs |
| DAW features | Basic timeline | Full session view |
| Agent autonomy | 95% Level 5 | 100% Level 5 |
| User study completion | 0 participants | 20-30 producers |

---

## Immediate Next Steps

1. **Deploy Modal backend** and verify it stays running
2. **Implement real Demucs** on Modal GPU
3. **Add ACE-Step** for basic music generation
4. **Integrate Daily SDK** for WebRTC
5. **Set up Pipecat** for pipeline orchestration

---

## References from Threads

- [Modal Generate Music Example](https://modal.com/docs/examples/generatemusic)
- [Modal MCP Server Example](https://modal.com/docs/examples/mcpserver_stateless)
- [Suno Case Study](https://modal.com/blog/suno-case-study)
- [Lemon Slice Case Study](https://modal.com/blog/lemon-slice-case-study)
- [Kaggle Agents Whitepapers](https://www.kaggle.com/whitepaper-introduction-to-agents)
- [ReAct Paper](https://arxiv.org/abs/2201.11903)
- [AudioCraft/MusicGen](https://github.com/facebookresearch/audiocraft)
- [Demucs v4](https://github.com/facebookresearch/demucs)
- [EBU R128 Loudness](https://tech.ebu.ch/docs/r/r128.pdf)

---

*Last Updated: December 2025*
*Based on user-provided thread documentation (10,201 lines)*
