# PhD Research Roadmap: Amapiano-AI-Studio

## Research Title
**Full-Stack Algorithm-System Co-Design for Efficient Audio and Music Generation**

MIT EECS Doctoral Research | Green AI for Audio Generation

---

## Current Status: Year 1 Implementation Complete ✅

### Completed Milestones

| Component | Status | Validation |
|-----------|--------|------------|
| WebAudio Signal Processing | ✅ Complete | Real audio output verified |
| Log Drum Library (53 samples, 4 regions) | ✅ Complete | Regional authenticity weights applied |
| Intelligent Element Selector | ✅ Complete | BPM/key/complexity matching functional |
| Learned Authenticity Scoring | ✅ Complete | Region-specific weights implemented |
| Percussion Library | ✅ Complete | Density-based selection working |
| SVDQuant-Audio (4/8/16-bit) | ✅ Complete | 95.5% stereo imaging, 99.8% transient preservation |
| Suno-Style Workflow | ✅ Complete | End-to-end validated with real outputs |
| User Study Infrastructure | ✅ Complete | A/B blind testing interface deployed |
| Study Recruitment Tools | ✅ Complete | Multi-channel sharing enabled |
| Analytics Dashboard | ✅ Complete | JSON/CSV export functional |

---

## Next Steps: User Study Validation Phase

### Immediate Actions (Next 2-4 Weeks)

#### 1. Participant Recruitment
- **Target**: 20-30 music producers
- **Demographics**: Amapiano DJs, South African producers, electronic music producers
- **Channels**:
  - Direct outreach via email/WhatsApp
  - Music production forums and Discord servers
  - Twitter/X music producer communities
  - South African music production groups

#### 2. Study Execution
- Share study link: `/user-study`
- Monitor responses via `/study-analytics`
- Target completion: 2-3 weeks from recruitment start

#### 3. Data Analysis
- Export collected data (JSON/CSV)
- Statistical analysis of authenticity ratings
- Preference breakdown by experience level
- Regional authenticity weight refinement

---

## User Study Protocol

### Study Design
- **Type**: A/B Blind Listening Test
- **Duration**: ~10 minutes per participant
- **Pairs**: 3 audio pairs (baseline vs. Amapianorized)

### Metrics Collected
1. **Authenticity Rating** (1-10 scale) for each track
2. **Preference Selection** (Track A vs. Track B)
3. **Confidence Level** (1-5 scale)
4. **Open-ended Feedback** on authenticity elements

### Demographic Data
- Age range
- Country of residence
- Primary DAW used
- Years listening to Amapiano
- Experience level (Beginner/Intermediate/Advanced/Professional)
- Amapiano familiarity (Casual/Regular/Expert)

### Success Criteria
- **Primary**: Statistically significant preference for Amapianorized tracks (p < 0.05)
- **Secondary**: Higher mean authenticity rating for Amapianorized tracks
- **Exploratory**: Regional weight validation from expert feedback

---

## Research Contributions (Year 1)

### 1. SVDQuant-Audio: Phase-Aware Quantization
- **Innovation**: Preserves stereo imaging and transients in aggressive quantization
- **Results**: 
  - 4-bit: 95.5% stereo imaging, 99.8% transient preservation, 8x compression
  - 8-bit: 97%+ quality metrics, 4x compression
- **Techniques**: Mid/Side processing, TPDF dithering, noise shaping, adaptive transient detection

### 2. Amapianorization Engine
- **Innovation**: Knowledge-driven cultural transformation (vs. black-box neural style transfer)
- **Components**: 
  - Regional log drum library (53 samples)
  - Intelligent element selector
  - Learned authenticity scoring
- **Differentiator**: Interpretable, controllable, region-aware

### 3. Musicality Benchmarking Suite
- **Metrics**: Beat Consistency Score, Key Stability Index, Transient Smearing Ratio
- **Implementation**: Real-time analysis via Essentia.js
- **Database**: Persistent storage for reproducible research

---

## Technical Architecture

### Core DSP Modules
```
src/lib/dsp/
├── eq.ts              # Parametric EQ
├── compressor.ts      # Dynamic compression
├── gate.ts            # Noise gate
├── reverb.ts          # Algorithmic reverb
├── delay.ts           # Delay effects
├── distortion.ts      # Saturation/distortion
├── multiband.ts       # Multiband processing
├── limiter.ts         # Brick-wall limiter
├── chorus.ts          # Chorus modulation
├── phaser.ts          # Phaser effect
├── flanger.ts         # Flanger effect
├── tremolo.ts         # Amplitude modulation
├── autopan.ts         # Auto-panning
├── vocoder.ts         # Vocoder synthesis
└── ringmod.ts         # Ring modulation
```

### Audio Processing
```
src/lib/audio/
├── audioProcessor.ts      # WebAudio signal processing
├── sampleLoader.ts        # Sample caching system
├── sampleGenerator.ts     # Synthetic sample generation
├── svdQuantAudio.ts       # Phase-aware quantization
└── authenticityScoring.ts # Learned regional weights
```

### Research Infrastructure
```
src/pages/
├── UserStudy.tsx          # A/B blind listening test
├── StudyRecruitment.tsx   # Participant recruitment
├── StudyAnalytics.tsx     # Results dashboard
├── AudioTestLab.tsx       # Quantization testing
└── Research.tsx           # Research overview
```

### Database Schema (Supabase)
- `audio_analysis_results` - Essentia/musicality analysis
- `amapianorization_results` - Enhancement metadata
- `generated_samples` - Sample generation history
- `user_study_responses` - A/B test ratings and feedback

---

## Timeline: Year 1-4

### Year 1 (Current) - Foundation
- [x] SVDQuant-Audio implementation
- [x] Amapianorization Engine
- [x] Musicality benchmarking
- [ ] **User study validation** ← CURRENT PHASE
- [ ] Learned weights refinement from study data

### Year 2 - Interactive Layer
- [ ] SIGE-Audio sparse inference for DAW editing
- [ ] Temporal caching for real-time regeneration
- [ ] Expanded sample library (200+ samples)

### Year 3 - Decision Point
- [ ] Efficient attention mechanisms (if Year 2 successful)
- [ ] Distributed inference optimization
- [ ] Deep evaluation and expert studies
- [ ] Publication preparation

### Year 4 - Democratization
- [ ] Open-source library packaging
- [ ] Thesis writing and defense
- [ ] Community tooling release

---

## Risk Mitigation

### If User Study Shows No Significant Improvement
- **Pivot**: Focus on quantization contribution alone
- **Alternative**: Expand regional analysis to identify where improvements exist
- **Contingency**: Reframe as "controllable transformation" vs. "authenticity improvement"

### If Quantization Quality Degrades Further
- **Fallback**: Structured pruning instead of quantization
- **Alternative**: Hybrid quantization (critical paths at higher precision)

---

## URLs and Access

| Resource | URL |
|----------|-----|
| User Study | `/user-study` |
| Study Recruitment | `/study-recruitment` |
| Study Analytics | `/study-analytics` |
| Audio Test Lab | `/audio-test-lab` |
| Research Overview | `/research` |
| DAW | `/daw` |
| Generate (Suno Workflow) | `/generate` |

---

## Contact & Collaboration

For research collaboration or study participation inquiries, use the recruitment page tools to share the study link via:
- Email (pre-formatted invitation)
- WhatsApp (shareable message)
- Twitter/X (tweet template)

---

*Last Updated: December 2024*
*Research Phase: User Study Validation*
