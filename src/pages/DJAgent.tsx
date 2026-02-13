import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Disc3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DJTrackPool from '@/components/dj-agent/DJTrackPool';
import DJSetConfig from '@/components/dj-agent/DJSetConfig';
import DJAgentPanel from '@/components/dj-agent/DJAgentPanel';
import DJSetPreview from '@/components/dj-agent/DJSetPreview';
import {
  DJTrack, SetConfig, AgentPhase, GeneratedSet, 
  MixRole, TransitionType, PRESET_INFO
} from '@/components/dj-agent/DJAgentTypes';

interface DJAgentProps {
  user?: User | null;
}

// Simulated analysis — in production this calls your Python/Rust engine
const analyzeTrack = async (track: DJTrack): Promise<DJTrack> => {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
  const bpm = 108 + Math.random() * 18; // 108-126 for amapiano
  const keys = ['Am', 'Cm', 'Fm', 'Gm', 'Dm', 'Bbm', 'Ebm'];
  const camelots = ['8A', '5A', '4A', '6A', '7A', '3A', '2A'];
  const ki = Math.floor(Math.random() * keys.length);
  return {
    ...track,
    durationSec: 180 + Math.random() * 180,
    features: {
      bpm,
      bpmConfidence: 0.85 + Math.random() * 0.15,
      key: keys[ki],
      camelot: camelots[ki],
      lufsIntegrated: -14 + Math.random() * 6,
      energyCurve: Array.from({ length: 20 }, () => Math.random()),
      segments: [
        { type: 'intro', startSec: 0, endSec: 30, energy: 0.3 },
        { type: 'verse', startSec: 30, endSec: 90, energy: 0.5 },
        { type: 'drop', startSec: 90, endSec: 150, energy: 0.9 },
        { type: 'breakdown', startSec: 150, endSec: 200, energy: 0.4 },
        { type: 'outro', startSec: 200, endSec: 240, energy: 0.2 },
      ],
      vocalActivityCurve: Array.from({ length: 20 }, () => Math.random() * 0.7),
    }
  };
};

// Simulated planner — in production this is beam search + scoring
const generateSets = async (tracks: DJTrack[], config: SetConfig): Promise<GeneratedSet[]> => {
  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
  
  const targetSec = config.duration * 60;
  const risks = [0.2, config.risk, Math.min(config.risk + 0.3, 1)];
  const labels = ['Safe', 'Balanced', 'Wild'];

  return risks.map((risk, vi) => {
    // Shuffle tracks with some variation per version
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const selected: DJTrack[] = [];
    let totalDur = 0;
    for (const t of shuffled) {
      if (totalDur >= targetSec) break;
      selected.push(t);
      totalDur += (t.durationSec || 240);
    }

    const roles: MixRole[] = ['warmup', 'lift', 'peak', 'release', 'peak2', 'outro'];
    const transitions: TransitionType[] = [
      'phrase_crossfade_eq_swap', 'echo_out', 'stem_vocal_tease', 
      'loop_roll_build', 'clean_cut_on_phrase', 'filter_sweep'
    ];

    let time = 0;
    const items = selected.flatMap((track, i) => {
      const dur = track.durationSec || 240;
      const role = roles[Math.min(i, roles.length - 1)];
      const startTime = time;
      time += dur;
      
      const result: import('@/components/dj-agent/DJAgentTypes').PerformancePlanItem[] = [{
        itemId: crypto.randomUUID(),
        type: 'track',
        trackId: track.id,
        trackTitle: track.title,
        trackArtist: track.artist,
        mixRole: role,
        startTimeSec: startTime,
        durationSec: dur,
      }];

      if (i < selected.length - 1) {
        result.push({
          itemId: crypto.randomUUID(),
          type: 'transition',
          transitionType: transitions[Math.floor(Math.random() * transitions.length)],
          bars: [8, 16, 32][Math.floor(Math.random() * 3)],
          startTimeSec: startTime + dur - 16,
          durationSec: 16,
        });
      }
      return result;
    });

    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return {
      planId: crypto.randomUUID(),
      name: `${labels[vi]} Mix — ${PRESET_INFO[config.preset].label}`,
      preset: config.preset,
      durationSec: time,
      items,
      scores: {
        harmonicClash: 70 + Math.floor(Math.random() * 25),
        tempoJump: 75 + Math.floor(Math.random() * 20),
        vocalOverlapConflict: 80 + Math.floor(Math.random() * 15),
        energySmoothness: 65 + Math.floor(Math.random() * 30),
        transitionCleanliness: 70 + Math.floor(Math.random() * 25),
        novelty: 60 + Math.floor(Math.random() * 35),
        overall: 70 + Math.floor(Math.random() * 25),
      },
      energyCurve: Array.from({ length: 30 }, (_, i) => {
        const t = i / 29;
        // Shape based on preset
        const base = Math.sin(t * Math.PI) * 0.6 + 0.3;
        return Math.max(0.1, Math.min(1, base + (Math.random() - 0.5) * 0.2));
      }),
      tracklist: selected.map((t, i) => ({
        time: formatTime(items.filter(it => it.type === 'track')[i]?.startTimeSec || 0),
        title: t.title,
        artist: t.artist,
        bpm: Math.round(t.features?.bpm || 120),
        key: t.features?.key || 'Am',
      })),
    };
  });
};

export default function DJAgent({ user }: DJAgentProps) {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<DJTrack[]>([]);
  const [config, setConfig] = useState<SetConfig>({
    duration: 60,
    preset: 'private_school_3am_peak',
    risk: 0.35,
    allowVocalOverlay: true,
    harmonicStrictness: 0.75,
    maxBpmDelta: 3,
  });
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>([]);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  const handleAddTracks = useCallback((newTracks: DJTrack[]) => {
    setTracks(prev => [...prev, ...newTracks]);
  }, []);

  const handleRemoveTrack = useCallback((id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (tracks.length < 3) {
      toast.error('Add at least 3 tracks to generate a DJ set');
      return;
    }

    try {
      // Phase 1: Analyze
      setPhase('analyzing');
      setMessage('Analyzing BPM, key, energy, and segments for each track...');
      const analyzed: DJTrack[] = [];
      for (let i = 0; i < tracks.length; i++) {
        setProgress((i / tracks.length) * 30);
        const result = await analyzeTrack(tracks[i]);
        analyzed.push(result);
      }
      setTracks(analyzed);
      setProgress(30);

      // Phase 2: Plan
      setPhase('planning');
      setMessage('Building energy arc, checking key/BPM compatibility, selecting transitions...');
      setProgress(45);
      await new Promise(r => setTimeout(r, 800));
      setProgress(55);

      // Phase 3: Variants
      setPhase('generating_variants');
      setMessage('Creating 3 set variations: Safe, Balanced, and Wild...');
      setProgress(65);
      const sets = await generateSets(analyzed, config);
      setProgress(85);

      // Phase 4: Render
      setPhase('rendering');
      setMessage('Finalizing performance plans and scoring...');
      await new Promise(r => setTimeout(r, 1000));
      setProgress(100);

      setGeneratedSets(sets);
      setActiveSetIndex(0);
      setPhase('complete');
      setMessage(`Generated ${sets.length} set variations — select one to preview or export.`);
      toast.success('DJ set generated successfully!');
    } catch (err) {
      setPhase('error');
      setMessage(err instanceof Error ? err.message : 'Generation failed');
      toast.error('Failed to generate DJ set');
    }
  }, [tracks, config]);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setProgress(0);
    setMessage('');
    setGeneratedSets([]);
    setActiveSetIndex(0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Disc3 className="w-6 h-6 text-primary animate-spin" style={{ animationDuration: '3s' }} />
          <div>
            <h1 className="text-lg font-bold">AURA-X DJ Agent</h1>
            <p className="text-xs text-muted-foreground">Level-5 Autonomous Music Performance Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Track Pool */}
          <div className="lg:col-span-3">
            <DJTrackPool
              tracks={tracks}
              onAddTracks={handleAddTracks}
              onRemoveTrack={handleRemoveTrack}
              isAnalyzing={phase === 'analyzing'}
            />
          </div>

          {/* Center: Config + Agent */}
          <div className="lg:col-span-4 space-y-4">
            <DJAgentPanel
              phase={phase}
              progress={progress}
              message={message}
              trackCount={tracks.length}
              onGenerate={handleGenerate}
              onReset={handleReset}
              canGenerate={tracks.length >= 3}
            />
            <DJSetConfig config={config} onChange={setConfig} />
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-5">
            <DJSetPreview
              sets={generatedSets}
              activeSetIndex={activeSetIndex}
              onSelectSet={setActiveSetIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
