import { useState, useCallback, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Disc3, Brain, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DJTrackPool from '@/components/dj-agent/DJTrackPool';
import DJSetConfig from '@/components/dj-agent/DJSetConfig';
import DJAgentPanel from '@/components/dj-agent/DJAgentPanel';
import DJSetPreview from '@/components/dj-agent/DJSetPreview';
import { analyzeTrackReal } from '@/components/dj-agent/DJAudioAnalyzer';
import { planSets } from '@/components/dj-agent/DJSetPlanner';
import {
  DJTrack, SetConfig, AgentPhase, GeneratedSet
} from '@/components/dj-agent/DJAgentTypes';

const DJ_STATE_KEY = 'dj-agent-state';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(DJ_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function persistState(tracks: DJTrack[], generatedSets: GeneratedSet[], config: SetConfig, phase: AgentPhase, aiNarrative: string) {
  try {
    // Only persist tracks that have blob URLs still valid, plus completed results
    localStorage.setItem(DJ_STATE_KEY, JSON.stringify({
      tracks, generatedSets, config,
      phase: phase === 'complete' ? 'complete' : 'idle',
      aiNarrative,
    }));
  } catch { /* quota exceeded — ignore */ }
}

interface DJAgentProps {
  user?: User | null;
}

export default function DJAgent({ user }: DJAgentProps) {
  const navigate = useNavigate();
  const saved = useRef(loadPersistedState()).current;
  const [tracks, setTracks] = useState<DJTrack[]>(saved?.tracks ?? []);
  const [config, setConfig] = useState<SetConfig>(saved?.config ?? {
    duration: 60,
    preset: 'private_school_3am_peak',
    risk: 0.35,
    allowVocalOverlay: true,
    harmonicStrictness: 0.75,
    maxBpmDelta: 3,
  });
  const [phase, setPhase] = useState<AgentPhase>(saved?.phase ?? 'idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(saved?.phase === 'complete' ? 'Restored previous session. Generated sets ready.' : '');
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>(saved?.generatedSets ?? []);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [aiNarrative, setAiNarrative] = useState(saved?.aiNarrative ?? '');
  const [isStreamingAI, setIsStreamingAI] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Persist state on meaningful changes
  useEffect(() => {
    persistState(tracks, generatedSets, config, phase, aiNarrative);
  }, [tracks, generatedSets, config, phase, aiNarrative]);

  const handleAddTracks = useCallback((newTracks: DJTrack[]) => {
    setTracks(prev => [...prev, ...newTracks]);
  }, []);

  const handleRemoveTrack = useCallback((id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * Stream AI DJ brain narrative
   */
  const streamAINarrative = useCallback(async (analyzedTracks: DJTrack[], setScores: any) => {
    setIsStreamingAI(true);
    setAiNarrative('');
    
    const trackData = analyzedTracks.map(t => ({
      title: t.title,
      artist: t.artist,
      bpm: t.features?.bpm,
      key: t.features?.key,
      camelot: t.features?.camelot,
      avgEnergy: t.features ? t.features.energyCurve.reduce((a, b) => a + b, 0) / t.features.energyCurve.length : 0,
      lufs: t.features?.lufsIntegrated,
      durationSec: t.durationSec,
    }));

    try {
      abortRef.current = new AbortController();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dj-agent-brain`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ tracks: trackData, config, planScores: setScores }),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errMsg = errData.error || `AI error (${resp.status})`;
        toast.error(errMsg);
        setIsStreamingAI(false);
        return;
      }

      if (!resp.body) {
        setIsStreamingAI(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let narrative = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              narrative += content;
              setAiNarrative(narrative);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('AI narrative error:', err);
      }
    } finally {
      setIsStreamingAI(false);
    }
  }, [config]);

  const handleGenerate = useCallback(async () => {
    if (tracks.length < 3) {
      toast.error('Add at least 3 tracks to generate a DJ set');
      return;
    }

    try {
      // Phase 1: Real audio analysis using Web Audio API
      setPhase('analyzing');
      setMessage('Decoding audio and extracting BPM, key, energy, segments via Web Audio API...');
      const analyzed: DJTrack[] = [];
      for (let i = 0; i < tracks.length; i++) {
        setProgress(((i + 0.5) / tracks.length) * 30);
        setMessage(`Analyzing track ${i + 1}/${tracks.length}: "${tracks[i].title}" — BPM detection, Krumhansl-Schmuckler key, RMS energy...`);
        try {
          const result = await analyzeTrackReal(tracks[i]);
          analyzed.push(result);
        } catch (err) {
          console.error(`Failed to analyze "${tracks[i].title}":`, err);
          toast.error(`Failed to analyze "${tracks[i].title}" — skipping`);
        }
        setProgress(((i + 1) / tracks.length) * 30);
      }
      
      if (analyzed.length < 3) {
        throw new Error('Need at least 3 successfully analyzed tracks');
      }
      
      setTracks(analyzed);
      setProgress(30);

      // Phase 2: Real beam search planning with Camelot compatibility
      setPhase('planning');
      setMessage('Running beam search (width=20) with Camelot wheel compatibility, BPM proximity, and energy arc scoring...');
      setProgress(40);

      // Phase 3: Generate 3 real variations using beam search with different risk offsets
      setPhase('generating_variants');
      setMessage('Generating Safe, Balanced, and Wild variations via beam search with different risk parameters...');
      setProgress(55);
      
      const sets = planSets(analyzed, config);
      setProgress(75);

      // Phase 4: AI DJ brain narrative (streams in background)
      setPhase('rendering');
      setMessage('Querying AI DJ brain for narrative arc, transition notes, and Extend/Mashup recommendations...');
      setProgress(85);
      
      // Start AI streaming in background (non-blocking)
      const bestScores = sets.reduce((best, s) => s.scores.overall > best.overall ? s.scores : best, sets[0].scores);
      streamAINarrative(analyzed, bestScores);
      
      setProgress(100);
      setGeneratedSets(sets);
      setActiveSetIndex(0);
      setPhase('complete');
      setMessage(`Generated ${sets.length} variations using real audio analysis + beam search. AI narrative streaming below.`);
      toast.success('DJ set generated with real analysis!');
    } catch (err) {
      setPhase('error');
      setMessage(err instanceof Error ? err.message : 'Generation failed');
      toast.error('Failed to generate DJ set');
    }
  }, [tracks, config, streamAINarrative]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setPhase('idle');
    setProgress(0);
    setMessage('');
    setGeneratedSets([]);
    setActiveSetIndex(0);
    setAiNarrative('');
    setIsStreamingAI(false);
    localStorage.removeItem(DJ_STATE_KEY);
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
            <p className="text-xs text-muted-foreground">Level-5 Autonomous Music Performance Intelligence — Real Analysis, No Mocks</p>
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

          {/* Right: Preview + AI Narrative */}
          <div className="lg:col-span-5 space-y-4">
            <DJSetPreview
              sets={generatedSets}
              activeSetIndex={activeSetIndex}
              onSelectSet={setActiveSetIndex}
              tracks={tracks.map(t => ({ id: t.id, fileUrl: t.fileUrl }))}
            />

            {/* AI DJ Brain Narrative */}
            {(aiNarrative || isStreamingAI) && (
              <Card className="border-accent/30 bg-gradient-to-br from-card to-accent/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent" />
                    AI DJ Brain — Performance Direction
                    {isStreamingAI && (
                      <span className="ml-auto text-xs text-accent animate-pulse flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Streaming...
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {aiNarrative || 'Waiting for AI response...'}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
