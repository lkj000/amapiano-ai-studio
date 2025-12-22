import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Database, Cpu, Zap, Shield, Music, Mic, Brain, Globe, Server, Lock, LucideIcon } from 'lucide-react';

interface Subsection {
  title: string;
  items: string[];
}

interface Section {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  subsections: Subsection[];
}

const AuraXArchitecture = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const sections: Section[] = [
    {
      id: 'data',
      title: 'Phase 1: Data Acquisition & Curation (Months 0-6)',
      icon: Database,
      color: 'bg-blue-500',
      subsections: [
        {
          title: 'Amapiano Production Corpus',
          items: [
            '2,000+ professional Amapiano tracks (licensed/partnered)',
            'Multitrack stems from SA studios (Piano Hub, Blaq Boy Music partnerships)',
            'Sub-genre categorization: Private School, Deep Amapiano, 3-Step',
            'Metadata: BPM, key, arrangement markers, cultural context'
          ]
        },
        {
          title: 'Voice & Vocal Training Data',
          items: [
            'Isolated vocal stems from licensed tracks (10,000+ hours)',
            'Artist-specific voice models: Kabza De Small, Focalistic, MFR Souls, etc.',
            'Duet/harmony pairs: training on multi-voice interactions',
            'Per-artist consent agreements & IP licensing framework',
            'Voice characteristic annotations: timbre, vibrato, articulation styles'
          ]
        },
        {
          title: 'Linguistic Corpus (12 SA Languages)',
          items: [
            'Transcribed vocals with language labels (Zulu, Xhosa, Afrikaans, etc.)',
            'Code-switching examples (English/Zulu, Afrikaans/Setswana mixtures)',
            'Dialectal variations: Johannesburg vs KZN Zulu, Cape vs Pretoria Afrikaans',
            'Phonetic annotations for click consonants (Xhosa, Zulu)',
            'Cultural context: slang, idioms, poetic devices in SA hip-hop/Amapiano'
          ]
        },
        {
          title: 'Lyrics & Lyrical Patterns',
          items: [
            'Lyrics corpus: 50,000+ Amapiano/SA hip-hop songs',
            'Thematic categorization: celebration, struggle, love, township life',
            'Rhyme scheme analysis per language (different patterns for agglutinative languages)',
            'Cultural reference database: SA locations, personalities, events',
            'Offensive/sensitive content flagging (cultural appropriateness)'
          ]
        }
      ]
    },
    {
      id: 'infra',
      title: 'Phase 2: Infrastructure Layer (Months 3-9)',
      icon: Server,
      color: 'bg-purple-500',
      subsections: [
        {
          title: 'Sovereign Compute Architecture',
          items: [
            'Primary: AWS Cape Town region (low latency for SA)',
            'Secondary: Azure South Africa (redundancy)',
            'Tertiary: Liquid Intelligent Technologies (local sovereignty)',
            'Modal.com for elastic GPU orchestration (A100/H100 clusters)',
            'NUNCHAKU optimization: 4-bit quantization for 8x cost reduction',
            'SIGE optimization: segmented inference with caching'
          ]
        },
        {
          title: 'Durable State Management',
          items: [
            'Temporal.io workflows for production sessions',
            'PostgreSQL (Neon) for production metadata & user projects',
            'Redis for real-time session state & collaboration',
            'S3-compatible storage (Wasabi/Backblaze) for stems & renders',
            'Vector database (Pinecone/Qdrant) for semantic audio search'
          ]
        },
        {
          title: 'Security & IP Protection',
          items: [
            'Post-Quantum Cryptography (Kyber/Dilithium) for model weights',
            'Voice model DRM: lattice-based encryption for artist IP',
            'Blockchain provenance tracking (optional): SA music IP registry',
            'Watermarking: embedded signatures in AI-generated vocals',
            'Rate limiting & abuse prevention for voice cloning'
          ]
        }
      ]
    },
    {
      id: 'models',
      title: 'Phase 3: Model Training Pipeline (Months 6-18)',
      icon: Brain,
      color: 'bg-green-500',
      subsections: [
        {
          title: 'Stem Separation (Demucs v4 Fine-tuning)',
          items: [
            'Base: Hybrid Transformer Demucs v4',
            'Fine-tune on Amapiano-specific instruments: log drums, bass, piano, vocals',
            'Add new stem classes: shakers, hi-hats, FX (Amapiano-specific)',
            'Training: 2000 multitrack sessions, 4x A100 80GB, 2-3 weeks',
            'Target: >95% separation quality on Amapiano (vs 85% generic)'
          ]
        },
        {
          title: 'Music Generation (MusicGen Fine-tuning)',
          items: [
            'Base: MusicGen Large (3.3B parameters)',
            'Fine-tune on Amapiano corpus: log drum patterns, basslines, piano voicings',
            'Conditional generation: tempo, key, sub-genre, "vibe" descriptors',
            'Training: 2000 tracks, 8x A100 80GB, 4-6 weeks',
            'NUNCHAKU quantization post-training: 4-bit for production inference'
          ]
        },
        {
          title: 'Voice Synthesis (Custom TTS Architecture)',
          items: [
            'Base architecture: VITS2 or Tortoise-TTS (proven multi-speaker capability)',
            'Multi-speaker training: 50+ SA artist voices (with consent)',
            'Per-artist fine-tuning: 5-10 hours isolated vocals per artist',
            'Prosody modeling: emotion, energy, rhythmic timing for Amapiano flow',
            'Duet/harmony synthesis: train on multi-voice interactions',
            'Training: 10,000 hours vocals, 4x A100 80GB, 6-8 weeks'
          ]
        },
        {
          title: 'Lyric Generation (GPT-style Language Model)',
          items: [
            'Base: Multilingual LLM (mT5 or custom GPT-3 class model)',
            'Fine-tune on 50,000 Amapiano/SA hip-hop lyrics',
            'Per-language modeling: separate LoRA adapters for each of 12 languages',
            'Code-switching capability: probabilistic language mixing',
            'Rhyme constraint satisfaction: language-specific rhyme schemes',
            'Cultural validation: flagging inappropriate/offensive content',
            'Training: 50k songs, 2x A100 80GB, 3-4 weeks'
          ]
        },
        {
          title: 'Mixing & Mastering (Neural DSP)',
          items: [
            'Base: DDSP (Differentiable Digital Signal Processing)',
            'Train on professional Amapiano mixes: EQ curves, compression ratios',
            'Genre-specific chains: log drum processing, bass treatment, piano space',
            'Mastering pipeline: loudness, stereo imaging, final polish',
            'Training: 1000 professional mixes (stems → final), 2x A100, 2 weeks'
          ]
        }
      ]
    },
    {
      id: 'neuro',
      title: 'Phase 4: Neuro-Symbolic Integration (Months 12-24)',
      icon: Zap,
      color: 'bg-yellow-500',
      subsections: [
        {
          title: 'Symbolic Rules Engine',
          items: [
            'Tempo constraints: 108-115 BPM enforcement for Amapiano',
            'Arrangement templates: intro/verse/chorus structures',
            'Harmonic rules: key consistency, chord progression validation',
            'Rhythmic constraints: log drum pattern grammar',
            'Cultural rules: language appropriateness, sampling ethics'
          ]
        },
        {
          title: 'Agentic Workflow Orchestration (Temporal)',
          items: [
            'Production agent: coordinates generation → mixing → mastering',
            'Quality gates: automated checks at each stage',
            'Human-in-loop: approval points for creative decisions',
            'Retry logic: re-generate if quality thresholds not met',
            'State persistence: resume interrupted sessions seamlessly'
          ]
        },
        {
          title: 'Real-time Audio Engine (WASM)',
          items: [
            'Web Audio API: low-latency preview & manipulation',
            'Physical modeling: real-time DSP for parameter tweaking',
            'Stem player: synchronized multi-track playback',
            'Export pipeline: render to WAV/MP3 with proper metadata'
          ]
        }
      ]
    },
    {
      id: 'interface',
      title: 'Phase 5: User Interface & Experience (Months 18-30)',
      icon: Music,
      color: 'bg-pink-500',
      subsections: [
        {
          title: 'Production Studio Interface',
          items: [
            'Text-to-production: "Create a Private School Amapiano track, 112 BPM, with Kabza-style vocals in Zulu"',
            'Stem editor: drag-drop arrangement, visual waveform editing',
            'Voice selector: choose from licensed artist voice models',
            'Lyric editor: generate/edit lyrics with language selection',
            'Mix desk: AI-suggested or manual DSP chain editing',
            'Collaboration: real-time multi-user sessions (Yjs/CRDT)'
          ]
        },
        {
          title: 'Cultural Context Features',
          items: [
            'Language selector: switch between 12 SA languages mid-production',
            'Vibe library: pre-curated Amapiano moods ("late night", "weekend", "reflective")',
            'Sample browser: culturally appropriate loops & one-shots',
            'Reference tracks: A/B against professional Amapiano productions',
            'Cultural advisor: warnings for potentially insensitive content'
          ]
        },
        {
          title: 'Mobile Experience (React Native)',
          items: [
            'On-the-go production: create beats on mobile (lighter inference)',
            'Voice recording: capture ideas, convert to artist voice',
            'Collaboration: approve/reject stems from collaborators',
            'Offline mode: cache projects, sync when online'
          ]
        }
      ]
    },
    {
      id: 'business',
      title: 'Phase 6: Business Model & Partnerships (Months 24-36)',
      icon: Globe,
      color: 'bg-red-500',
      subsections: [
        {
          title: 'Licensing & Rights Management',
          items: [
            'Artist voice licensing: revenue share per generation using their voice',
            'Label partnerships: Piano Hub, Blaq Boy Music (training data + distribution)',
            'Songwriter splits: automatic metadata for streaming platforms',
            'Sample clearance: built-in Tracklib/Splice integration',
            'Blockchain registry (optional): SA music IP provenance tracking'
          ]
        },
        {
          title: 'Monetization Tiers',
          items: [
            'Free tier: 10 generations/month, watermarked, limited voices',
            'Creator tier ($29/mo): 100 generations, full voice library, commercial use',
            'Studio tier ($99/mo): unlimited, priority GPU, collaboration features',
            'Enterprise: custom voice training, white-label, API access',
            'Per-voice premium: pay extra for specific high-demand artist voices'
          ]
        },
        {
          title: 'Distribution Integration',
          items: [
            'Direct upload: DistroKid, TuneCore, Ditto Music',
            'Stem distribution: allow stems for remixes (with DRM)',
            'DJ tools: export to Serato, Rekordbox with metadata',
            'Social platforms: one-click to Instagram Reels, TikTok with attribution'
          ]
        },
        {
          title: 'Community & Education',
          items: [
            'Production courses: "Level 5 Amapiano Production with AURA X"',
            'Community challenges: monthly production competitions',
            'Livestreams: SA producers creating live with AURA X',
            'University partnerships: SA music technology programs',
            'Cultural advisory board: ongoing feedback & validation'
          ]
        }
      ]
    },
    {
      id: 'expansion',
      title: 'Phase 7: Genre Expansion (Months 30+)',
      icon: Mic,
      color: 'bg-indigo-500',
      subsections: [
        {
          title: 'Gqom Expansion (Year 3)',
          items: [
            'New training corpus: 1,000 Gqom tracks (darker, minimal)',
            'Different rhythmic patterns: broken beat, syncopated',
            'Voice models: Gqom-specific artists (Distruction Boyz, etc.)',
            'Mixing aesthetics: rawer, more industrial sound'
          ]
        },
        {
          title: 'Afrobeats Expansion (Year 3-4)',
          items: [
            'Pan-African corpus: Nigerian, Ghanaian, Kenyan variants',
            'Faster tempo range: 100-130 BPM',
            'Different drum patterns: less piano-centric, more percussion',
            'West African languages: Yoruba, Igbo, Pidgin English',
            'Regional partnerships: Nigerian labels & studios'
          ]
        },
        {
          title: 'Cross-Genre Fusion',
          items: [
            'Amapiano × Gqom hybrid generation',
            'Afrobeats × Amapiano (already happening organically)',
            'Cultural exchange: enable pan-African collaboration',
            'Style transfer: convert Gqom track to Amapiano arrangement'
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            AURA X: Complete Architecture
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Level 5 Autonomous Producer for Amapiano & SA Music
          </p>
          <p className="text-sm text-gray-400">
            End-to-End System Design: From Data to Deployment
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id];
            
            return (
              <div key={section.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`${section.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-left">{section.title}</h2>
                  </div>
                  {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </button>
                
                {isExpanded && (
                  <div className="p-6 pt-0 space-y-6">
                    {section.subsections.map((subsection, idx) => (
                      <div key={idx} className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-3 text-purple-300">
                          {subsection.title}
                        </h3>
                        <ul className="space-y-2">
                          {subsection.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex gap-3 text-gray-300 text-sm">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-8 border border-purple-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <Lock className="w-6 h-6" />
            Critical Success Factors
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-purple-200">Cultural Authenticity</h3>
              <p className="text-sm text-gray-300">SA producers must validate every output. This is infrastructure <em>for</em> SA music, not just <em>about</em> it.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-purple-200">Artist Partnerships</h3>
              <p className="text-sm text-gray-300">Voice licensing must be transparent, fair, and revenue-sharing. Artists should want their voices in AURA X.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-purple-200">Compute Economics</h3>
              <p className="text-sm text-gray-300">NUNCHAKU/SIGE optimization is non-negotiable. Without 8x cost reduction, production scale is impossible.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-purple-200">Regional Infrastructure</h3>
              <p className="text-sm text-gray-300">AWS Cape Town + local partnerships. Sovereignty isn't marketing—it's architectural reality.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Estimated Timeline: 30-36 months from inception to full production</p>
          <p>Estimated Investment: $8-12M for data, compute, partnerships, team</p>
        </div>
      </div>
    </div>
  );
};

export default AuraXArchitecture;
