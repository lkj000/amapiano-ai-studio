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
import DJSetComparison from '@/components/dj-agent/DJSetComparison';
import { analyzeTrackReal } from '@/components/dj-agent/DJAudioAnalyzer';
import { planSets } from '@/components/dj-agent/DJSetPlanner';
import { separateDJTracks } from '@/components/dj-agent/DJStemSeparator';
import { amapianorizerTransformer, type TransformationResult } from '@/lib/audio/amapianorizerTransformer';
import { recommendPreset } from '@/lib/audio/amapianorizerPresets';
import {
  DJTrack, SetConfig, AgentPhase, GeneratedSet
} from '@/components/dj-agent/DJAgentTypes';

const DJ_STATE_KEY = 'dj-agent-state';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(DJ_STATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    
    // Filter out tracks with blob URLs — they're invalid after reload
    if (state?.tracks) {
      const hasBlobTracks = state.tracks.some((t: any) => t.fileUrl?.startsWith('blob:'));
      if (hasBlobTracks) {
        // Tracks with blob URLs can't survive reload — clear them
        state.tracks = [];
        state.generatedSets = [];
        state.phase = 'idle';
        state.aiNarrative = '';
      }
    }
    
    return state;
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
    enableStemMode: false,
  });
  const [phase, setPhase] = useState<AgentPhase>(saved?.phase ?? 'idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(saved?.phase === 'complete' ? 'Restored previous session. Generated sets ready.' : '');
  const [generatedSets, setGeneratedSets] = useState<GeneratedSet[]>(saved?.generatedSets ?? []);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [aiNarrative, setAiNarrative] = useState(saved?.aiNarrative ?? '');
  const [isStreamingAI, setIsStreamingAI] = useState(false);
  const [amapianorizingTrackId, setAmapianorizingTrackId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persist state on meaningful changes
  useEffect(() => {
    persistState(tracks, generatedSets, config, phase, aiNarrative);
  }, [tracks, generatedSets, config, phase, aiNarrative]);

  const handleAddTracks = useCallback((newTracks: DJTrack[]) => {
    console.log(`[DJ Agent] 📁 Adding ${newTracks.length} track(s):`, newTracks.map(t => ({ title: t.title, artist: t.artist, duration: t.durationSec, fileUrl: t.fileUrl?.substring(0, 60) })));
    setTracks(prev => {
      const updated = [...prev, ...newTracks];
      console.log(`[DJ Agent] 📊 Track pool now has ${updated.length} total tracks`);
      return updated;
    });
  }, []);

  const handleRemoveTrack = useCallback((id: string) => {
    console.log(`[DJ Agent] 🗑️ Removing track: ${id}`);
    setTracks(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleAmapianorize = useCallback(async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track?.features) return;
    
    setAmapianorizingTrackId(trackId);
    const toastId = toast.loading(`Amapianorizing "${track.title}"...`, { description: 'Running real cultural transformation pipeline' });

    try {
      // Determine best preset from track characteristics
      const avgEnergy = track.features.energyCurve.reduce((a, b) => a + b, 0) / track.features.energyCurve.length;
      const vocalPresence = track.features.vocalActivityCurve
        ? track.features.vocalActivityCurve.reduce((a, b) => a + b, 0) / track.features.vocalActivityCurve.length
        : 0;

      const energyLevel: 'low' | 'medium' | 'high' = avgEnergy > 0.65 ? 'high' : avgEnergy > 0.35 ? 'medium' : 'low';
      const presetId = recommendPreset({
        hasSoulfulVocals: vocalPresence > 0.4,
        isPercussive: avgEnergy > 0.6,
        originalBPM: track.features.bpm,
        energy: energyLevel,
      });

      console.log(`[DJ Agent] 🎵 Amapianorizing "${track.title}" with preset: ${presetId}`);

      // Run real transformation
      amapianorizerTransformer.onProgress((progress) => {
        toast.loading(`Amapianorizing "${track.title}"`, {
          id: toastId,
          description: `${progress.phase}: ${progress.currentStep} (${Math.round(progress.progress)}%)`,
        });
      });

      const result: TransformationResult = await amapianorizerTransformer.transformTrack({
        sourceUrl: track.fileUrl,
        presetId,
        sourceCharacteristics: {
          bpm: track.features.bpm,
          key: track.features.key,
          hasSoulfulVocals: vocalPresence > 0.4,
          isPercussive: avgEnergy > 0.6,
        },
      });

      if (result.success && result.processedAudioUrl) {
        // Replace the track's fileUrl with the transformed audio
        setTracks(prev => prev.map(t =>
          t.id === trackId
            ? { ...t, fileUrl: result.processedAudioUrl!, amapianorized: true }
            : t
        ));
        toast.success(`"${track.title}" Amapianorized!`, {
          id: toastId,
          description: `Preset: ${result.preset.name} | Vibe: ${result.vibeScore ?? '—'}/100 | Authenticity: ${result.authenticityScore ?? '—'}%`,
        });
        console.log(`[DJ Agent] ✅ Amapianorized "${track.title}":`, {
          preset: result.preset.name,
          vibeScore: result.vibeScore,
          authenticityScore: result.authenticityScore,
        });
      } else {
        toast.error(`Amapianorization failed for "${track.title}"`, {
          id: toastId,
          description: result.error || 'Unknown error during transformation',
        });
      }
    } catch (err) {
      console.error(`[DJ Agent] ❌ Amapianorize failed for "${track.title}":`, err);
      toast.error(`Amapianorization failed for "${track.title}"`, {
        id: toastId,
        description: err instanceof Error ? err.message : 'Transformation pipeline error',
      });
    } finally {
      setAmapianorizingTrackId(null);
    }
  }, [tracks]);

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

    // Check for stale blob URLs before starting
    const staleTracks = tracks.filter(t => t.fileUrl?.startsWith('blob:'));
    if (staleTracks.length > 0) {
      try {
        const testResp = await fetch(staleTracks[0].fileUrl);
        if (!testResp.ok) throw new Error('stale');
      } catch {
        toast.error('Audio files expired after page reload. Please re-upload your tracks.');
        setTracks([]);
        setGeneratedSets([]);
        setPhase('idle');
        localStorage.removeItem(DJ_STATE_KEY);
        return;
      }
    }

    try {
      // Phase 1: Real audio analysis using Web Audio API
      console.log(`[DJ Agent] 🚀 Starting generation with ${tracks.length} tracks, config:`, config);
      setPhase('analyzing');
      setMessage('Decoding audio and extracting BPM, key, energy, segments via Web Audio API...');
      const analyzed: DJTrack[] = [];
      for (let i = 0; i < tracks.length; i++) {
        setProgress(((i + 0.5) / tracks.length) * 30);
        console.log(`[DJ Agent] 🔬 Analyzing track ${i + 1}/${tracks.length}: "${tracks[i].title}" (${tracks[i].fileUrl?.substring(0, 50)})`);
        setMessage(`Analyzing track ${i + 1}/${tracks.length}: "${tracks[i].title}" — BPM detection, Krumhansl-Schmuckler key, RMS energy...`);
        try {
          const analysisPromise = analyzeTrackReal(tracks[i]);
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Analysis timed out after 30s`)), 30000)
          );
          const result = await Promise.race([analysisPromise, timeoutPromise]);
          console.log(`[DJ Agent] ✅ Analysis complete for "${tracks[i].title}":`, { bpm: result.features?.bpm, key: result.features?.key, camelot: result.features?.camelot, lufs: result.features?.lufsIntegrated });
          analyzed.push(result);
        } catch (err) {
          console.error(`[DJ Agent] ❌ Failed to analyze "${tracks[i].title}":`, err);
          toast.error(`Failed to analyze "${tracks[i].title}" — skipping`);
        }
        setProgress(((i + 1) / tracks.length) * 30);
        // Brief yield to allow garbage collection between tracks
        await new Promise(r => setTimeout(r, 100));
      }
      console.log(`[DJ Agent] 📊 Analysis phase complete: ${analyzed.length}/${tracks.length} tracks analyzed successfully`);
      
      if (analyzed.length < 3) {
        throw new Error('Need at least 3 successfully analyzed tracks');
      }
      
      setTracks(analyzed);
      setProgress(30);

      // Phase 2: Stem separation (if enabled)
      let tracksForPlanning = analyzed;
      if (config.enableStemMode) {
        setPhase('analyzing');
        console.log('[DJ Agent] 🎛️ Phase 2: Stem separation via htdemucs_6s');
        setMessage('Separating stems for each track (vocals, drums, bass, guitar, piano, other)... This takes 2-4 min per track.');
        setProgress(32);

        tracksForPlanning = await separateDJTracks(analyzed, (completed, total, title) => {
          const stemProgress = 30 + (completed / total) * 20;
          setProgress(stemProgress);
          setMessage(`Separating stems ${completed + 1}/${total}: "${title}"...`);
        });

        const stemmedCount = tracksForPlanning.filter(t => t.stems).length;
        console.log(`[DJ Agent] ✅ Stem separation complete: ${stemmedCount}/${tracksForPlanning.length} tracks separated`);
        setProgress(50);
        setTracks(tracksForPlanning);
      }

      // Phase 3: Real beam search planning with Camelot compatibility
      setPhase('planning');
      console.log('[DJ Agent] 🗺️ Phase 3: Planning — beam search with Camelot compatibility');
      setMessage('Running beam search (width=20) with Camelot wheel compatibility, BPM proximity, and energy arc scoring...');
      setProgress(55);

      // Phase 4: Generate variations using beam search with different risk offsets
      setPhase('generating_variants');
      const variantCount = config.enableStemMode ? 'Safe/Balanced/Wild/Stemmed' : 'Safe/Balanced/Wild';
      console.log(`[DJ Agent] 🎛️ Phase 4: Generating ${variantCount} variations`);
      setMessage(`Generating ${variantCount} variations via beam search with different risk parameters...`);
      setProgress(60);
      
      const sets = planSets(tracksForPlanning, config);
      console.log(`[DJ Agent] ✅ Generated ${sets.length} set variations:`, sets.map(s => ({ name: s.name, scores: s.scores, stemmed: s.isStemmed })));
      setProgress(75);

      // Phase 5: AI DJ brain narrative (streams in background)
      setPhase('rendering');
      console.log('[DJ Agent] 🧠 Phase 5: Streaming AI DJ brain narrative');
      setMessage('Querying AI DJ brain for narrative arc, transition notes, and Extend/Mashup recommendations...');
      setProgress(85);
      
      // Start AI streaming in background (non-blocking)
      const bestScores = sets.reduce((best, s) => s.scores.overall > best.overall ? s.scores : best, sets[0].scores);
      streamAINarrative(tracksForPlanning, bestScores);
      
      setProgress(100);
      setGeneratedSets(sets);
      setActiveSetIndex(0);
      setPhase('complete');
      console.log('[DJ Agent] 🎉 Generation complete!');
      const stemNote = config.enableStemMode ? ' + stem-separated variation' : '';
      setMessage(`Generated ${sets.length} variations using real audio analysis + beam search${stemNote}. AI narrative streaming below.`);
      toast.success(`DJ set generated with ${sets.length} variations!`);
    } catch (err) {
      console.error('[DJ Agent] 💥 Generation failed:', err);
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
              onAmapianorize={handleAmapianorize}
              amapianorizingTrackId={amapianorizingTrackId}
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

          {/* Right: Preview + Comparison + AI Narrative */}
          <div className="lg:col-span-5 space-y-4">
            <DJSetPreview
              sets={generatedSets}
              activeSetIndex={activeSetIndex}
              onSelectSet={setActiveSetIndex}
              tracks={tracks.map(t => ({ id: t.id, fileUrl: t.fileUrl, title: t.title, artist: t.artist, stems: t.stems, features: t.features ? { bpm: t.features.bpm, camelot: t.features.camelot, energyCurve: t.features.energyCurve, vocalActivityCurve: t.features.vocalActivityCurve, segments: t.features.segments } : undefined }))}
            />

            {/* Comparison panel — shown when sets are generated */}
            {generatedSets.length > 1 && (
              <DJSetComparison
                sets={generatedSets}
                activeSetIndex={activeSetIndex}
                onSelectSet={setActiveSetIndex}
              />
            )}

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
