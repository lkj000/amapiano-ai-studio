import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, ListMusic, BarChart3, Clock, Music2, Copy, Play, Pause, SkipForward, SkipBack, Volume2, Loader2, Layers, ChevronDown, Repeat, PlusCircle } from 'lucide-react';
import { GeneratedSet, DJTrackStems } from './DJAgentTypes';
import { useCrossfadePlayer } from './useCrossfadePlayer';
import { useStemCrossfadePlayer } from './useStemCrossfadePlayer';
import { exportCueSheet, exportMixAsWav, exportMixAsMp3, exportMixAsMp4, copyTracklistToClipboard } from './djExportUtils';
import { detectLoopPoints, computeTrackExtension, scoreMixExtendCandidates, type MixExtendSuggestion, type TrackExtendResult } from '@/lib/audio/ExtendEngine';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DJSetPreviewProps {
  sets: GeneratedSet[];
  activeSetIndex: number;
  onSelectSet: (index: number) => void;
  tracks?: { id: string; fileUrl: string; title: string; artist?: string; stems?: DJTrackStems; features?: { bpm: number; camelot: string; energyCurve: number[]; vocalActivityCurve: number[]; segments: any[] } }[];
  onExtendMix?: (suggestions: MixExtendSuggestion[]) => void;
}

export default function DJSetPreview({ sets, activeSetIndex, onSelectSet, tracks = [], onExtendMix }: DJSetPreviewProps) {
  const activeSet = sets[activeSetIndex];
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [extendMode, setExtendMode] = useState<'idle' | 'track' | 'mix'>('idle');
  const [mixSuggestions, setMixSuggestions] = useState<MixExtendSuggestion[]>([]);
  const [trackExtendResult, setTrackExtendResult] = useState<TrackExtendResult | null>(null);
  const [extendingTrackIdx, setExtendingTrackIdx] = useState<number | null>(null);

  const isStemmedSet = activeSet?.isStemmed ?? false;

  // Standard crossfade player (for non-stemmed sets)
  const standardPlayer = useCrossfadePlayer(
    isStemmedSet ? undefined : activeSet,
    tracks.map(t => ({ id: t.id, fileUrl: t.fileUrl }))
  );

  // Stem crossfade player (for stemmed sets)
  const stemPlayer = useStemCrossfadePlayer(
    isStemmedSet ? activeSet : undefined,
    tracks
  );

  // Use whichever player is active
  const player = isStemmedSet ? stemPlayer : standardPlayer;

  const {
    isPlaying,
    playingIndex,
    currentTime,
    duration,
    volume,
    handlePlayPause,
    handleSkip,
    handleVolumeChange,
    handleSeek,
    playTrackAtIndex,
    trackItems,
  } = player;

  const formatTimestamp = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleExportMix = useCallback(async (format: 'wav' | 'mp3' | 'mp4') => {
    if (!activeSet || isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      if (format === 'mp3') {
        await exportMixAsMp3(activeSet, tracks, setExportProgress);
      } else if (format === 'mp4') {
        await exportMixAsMp4(activeSet, tracks, setExportProgress);
      } else {
        await exportMixAsWav(activeSet, tracks, setExportProgress);
      }
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [activeSet, tracks, isExporting]);

  const handleExportCueSheet = useCallback(() => {
    if (!activeSet) return;
    exportCueSheet(activeSet);
  }, [activeSet]);

  const handleCopyTracklist = useCallback(() => {
    if (!activeSet) return;
    copyTracklistToClipboard(activeSet);
  }, [activeSet]);

  // ─── Track Extend ────────────────────────────────────────────────────────
  const handleTrackExtend = useCallback((trackIdx: number) => {
    const trackItem = activeSet?.tracklist[trackIdx];
    const trackData = tracks.find(t => t.title === trackItem?.title);
    if (!trackData?.features) return;

    setExtendingTrackIdx(trackIdx);
    const loopPoints = detectLoopPoints(
      trackData.features.energyCurve,
      trackData.features.energyCurve.length * 1.5, // approximate duration
      trackData.features.bpm,
      trackData.features.segments
    );

    if (loopPoints.length > 0) {
      const result = computeTrackExtension(
        trackData.features.energyCurve.length * 1.5,
        trackData.features.energyCurve.length * 1.5 * 1.5, // extend by 50%
        loopPoints
      );
      setTrackExtendResult(result);
      setExtendMode('track');
    }
  }, [activeSet, tracks]);

  // ─── Mix Extend ──────────────────────────────────────────────────────────
  const handleMixExtend = useCallback(() => {
    if (!activeSet || tracks.length === 0) return;

    const lastTracklist = activeSet.tracklist[activeSet.tracklist.length - 1];
    if (!lastTracklist) return;
    // Match by title, or fallback to the last track with features
    let lastTrackData = tracks.find(t => t.title === lastTracklist.title);
    if (!lastTrackData?.features) {
      lastTrackData = tracks.find(t => t.title.includes(lastTracklist.title) || lastTracklist.title.includes(t.title));
    }
    if (!lastTrackData?.features) {
      // Ultimate fallback: use last track that has features
      lastTrackData = [...tracks].reverse().find(t => !!t.features);
    }
    if (!lastTrackData?.features) return;

    const usedIds = new Set(activeSet.tracklist.map(t => {
      const match = tracks.find(tr => tr.title === t.title);
      return match?.id || '';
    }));
    const usedArtists = new Set(activeSet.tracklist.map(t => t.artist).filter(Boolean) as string[]);

    const lastEnergy = lastTrackData.features.energyCurve;
    const avgEnergy = lastEnergy.reduce((a, b) => a + b, 0) / lastEnergy.length;

    const candidates = tracks
      .filter(t => t.features)
      .map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        bpm: t.features!.bpm,
        camelot: t.features!.camelot,
        energy: t.features!.energyCurve.reduce((a, b) => a + b, 0) / t.features!.energyCurve.length,
        vocalStart: t.features!.vocalActivityCurve[0] || 0,
      }));

    const suggestions = scoreMixExtendCandidates(
      { bpm: lastTrackData.features.bpm, camelot: lastTrackData.features.camelot, energy: avgEnergy, artist: lastTrackData.artist },
      candidates,
      usedIds,
      usedArtists,
      Math.max(0.2, avgEnergy - 0.1) // slight energy decrease for natural arc
    );

    setMixSuggestions(suggestions.slice(0, 5));
    setExtendMode('mix');
    onExtendMix?.(suggestions.slice(0, 5));
  }, [activeSet, tracks, onExtendMix]);


  if (sets.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full flex items-center justify-center">
        <div className="text-center p-8">
          <ListMusic className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Generated sets will appear here</p>
          <p className="text-xs text-muted-foreground/60 mt-1">The agent will produce 3 variations (Safe, Balanced, Wild) + optional Stemmed 4th</p>
        </div>
      </Card>
    );
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            Generated Sets
          </CardTitle>
          <div className="flex gap-1">
              {sets.map((set, i) => (
                <Button
                  key={set.planId}
                  variant={i === activeSetIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSelectSet(i)}
                  className={`text-xs px-3 ${set.isStemmed ? 'gap-1' : ''}`}
                >
                  {set.isStemmed && <Layers className="w-3 h-3" />}
                  {set.isStemmed ? 'Stemmed' : `v${i + 1}`}
                </Button>
              ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transport controls — crossfade mode */}
        {tracks.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSkip('prev')} disabled={playingIndex === null || playingIndex === 0}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSkip('next')} disabled={playingIndex === null || playingIndex >= trackItems.length - 1}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            
            {playingIndex !== null && (
              <>
                <div className="text-center text-xs text-muted-foreground">
                  Now: <span className="text-foreground font-medium">{trackItems[playingIndex]?.trackTitle}</span>
                  <Badge variant="outline" className="ml-2 text-[9px] px-1 py-0">
                    {isStemmedSet ? 'Per-Stem Mix' : 'Crossfade Mix'}
                  </Badge>
                </div>
                {/* Stem mute/solo controls for stemmed sets */}
                {isStemmedSet && 'toggleStemMute' in stemPlayer && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {['drums', 'bass', 'vocals', 'guitar', 'piano', 'other'].map(stemKey => {
                      const isMuted = stemPlayer.mutedStems.has(stemKey);
                      const isSoloed = stemPlayer.soloedStems.has(stemKey);
                      return (
                        <button
                          key={stemKey}
                          onClick={() => stemPlayer.toggleStemMute(stemKey)}
                          onDoubleClick={() => stemPlayer.toggleStemSolo(stemKey)}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                            isSoloed
                              ? 'border-primary bg-primary/20 text-primary'
                              : isMuted
                              ? 'border-border/20 text-muted-foreground/40 line-through'
                              : 'border-border/40 text-muted-foreground hover:border-primary/40'
                          }`}
                          title={`Click: mute/unmute ${stemKey} | Double-click: solo`}
                        >
                          {stemKey}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-10 text-right font-mono">{formatTimestamp(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 1}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />
                  <span className="w-10 font-mono">{formatTimestamp(duration)}</span>
                </div>
              </>
            )}
            
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-24" />
            </div>
          </div>
        )}

        {/* Scores */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={`text-xl font-bold ${scoreColor(activeSet.scores.overall)}`}>{activeSet.scores.overall}</p>
            <p className="text-[10px] text-muted-foreground">Overall</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={`text-xl font-bold ${scoreColor(activeSet.scores.energySmoothness)}`}>{activeSet.scores.energySmoothness}</p>
            <p className="text-[10px] text-muted-foreground">Energy Flow</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={`text-xl font-bold ${scoreColor(activeSet.scores.transitionCleanliness)}`}>{activeSet.scores.transitionCleanliness}</p>
            <p className="text-[10px] text-muted-foreground">Transitions</p>
          </div>
        </div>

        {/* Energy curve */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="w-3 h-3" /> Energy Arc
          </div>
          <div className="flex items-end gap-px h-12">
            {activeSet.energyCurve.map((val, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${val * 100}%`,
                  background: `hsl(${45 + (val * 225)}, 80%, ${50 + val * 20}%)`,
                }}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Tracklist */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Tracklist ({activeSet.tracklist.length} tracks)
          </p>
          <ScrollArea className="h-[200px]">
            <div className="space-y-0.5">
              {activeSet.tracklist.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 text-sm cursor-pointer ${
                    playingIndex === i ? 'bg-primary/10 border border-primary/30' : ''
                  }`}
                  onClick={() => tracks.length > 0 && playTrackAtIndex(i)}
                >
                  <span className="text-xs text-muted-foreground w-10 shrink-0 font-mono">{item.time}</span>
                  {playingIndex === i && isPlaying ? (
                    <Volume2 className="w-3 h-3 text-primary animate-pulse shrink-0" />
                  ) : (
                    <Music2 className="w-3 h-3 text-primary shrink-0" />
                  )}
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.artist && <span className="text-xs text-muted-foreground truncate max-w-[80px]">{item.artist}</span>}
                  <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">{item.bpm} BPM</Badge>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">{item.key}</Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTrackExtend(i); }}
                          className="text-muted-foreground/40 hover:text-primary transition-colors shrink-0"
                          title="Extend this track"
                        >
                          <Repeat className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left"><p className="text-xs">Extend track (loop detection)</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Extend controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleMixExtend} disabled={tracks.length === 0}>
            <PlusCircle className="w-4 h-4 mr-1" /> Extend Mix
          </Button>
          {extendMode !== 'idle' && (
            <Button variant="ghost" size="sm" onClick={() => { setExtendMode('idle'); setMixSuggestions([]); setTrackExtendResult(null); }}>
              Close
            </Button>
          )}
        </div>

        {/* Track Extend Result */}
        {extendMode === 'track' && trackExtendResult && (
          <div className="bg-muted/20 rounded-lg p-3 space-y-2 border border-primary/20">
            <p className="text-xs font-medium flex items-center gap-1">
              <Repeat className="w-3 h-3 text-primary" /> Track Loop Detected
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-bold text-primary">{trackExtendResult.selectedLoop.lengthBars} bars</p>
                <p className="text-[10px] text-muted-foreground">Loop length</p>
              </div>
              <div>
                <p className="text-sm font-bold text-primary">{Math.round(trackExtendResult.selectedLoop.confidence * 100)}%</p>
                <p className="text-[10px] text-muted-foreground">Confidence</p>
              </div>
              <div>
                <p className="text-sm font-bold text-primary">×{trackExtendResult.loopCount}</p>
                <p className="text-[10px] text-muted-foreground">Repeats</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {Math.round(trackExtendResult.originalDurationSec)}s → {Math.round(trackExtendResult.extendedDurationSec)}s
              ({trackExtendResult.crossfadeSec}s crossfade)
            </p>
          </div>
        )}

        {/* Mix Extend Suggestions */}
        {extendMode === 'mix' && mixSuggestions.length > 0 && (
          <div className="bg-muted/20 rounded-lg p-3 space-y-2 border border-accent/20">
            <p className="text-xs font-medium flex items-center gap-1">
              <PlusCircle className="w-3 h-3 text-accent" /> Mix Continuation Suggestions
            </p>
            <div className="space-y-1">
              {mixSuggestions.map((s, i) => (
                <div key={s.trackId} className="flex items-center gap-2 p-1.5 rounded bg-muted/20 hover:bg-muted/40 text-xs">
                  <span className="text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                  <span className="flex-1 truncate font-medium">{s.trackTitle}</span>
                  {s.trackArtist && <span className="text-muted-foreground truncate max-w-[60px]">{s.trackArtist}</span>}
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{s.harmonicMatch}% key</Badge>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">Δ{s.bpmDelta}</Badge>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 ${s.score >= 0.7 ? 'border-green-500/40 text-green-400' : ''}`}>
                    {Math.round(s.score * 100)}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Ranked by harmonic, BPM, energy fit, and novelty
            </p>
          </div>
        )}

        <Separator />

        {/* Export buttons — all functional */}
        <div className="flex gap-2">
          {isExporting ? (
            <Button variant="outline" size="sm" className="flex-1" disabled>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" /> {exportProgress}%
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-1" /> Export Mix <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportMix('wav')}>
                  WAV (Lossless)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportMix('mp3')}>
                  MP3 (192kbps)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportMix('mp4')}>
                  M4A / MP4 (AAC)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="sm" className="flex-1" onClick={handleExportCueSheet}>
            <FileText className="w-4 h-4 mr-1" /> Cue Sheet
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyTracklist} title="Copy tracklist to clipboard">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
