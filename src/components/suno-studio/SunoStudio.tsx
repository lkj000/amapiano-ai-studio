import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useSunoStudioState } from './hooks/useSunoStudioState';
import { StudioTimeline } from './components/StudioTimeline';
import { GenerationPanel } from './components/GenerationPanel';
import { ClipInspector } from './components/ClipInspector';
import { HistoryPanel } from './components/HistoryPanel';
import { TransportControls } from './components/TransportControls';
import { LoopUploadPanel, BeatBuildOptions } from './components/LoopUploadPanel';
import { PersonaVoiceSelector } from './components/PersonaVoiceSelector';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Wand2, History, FileAudio, Upload, Mic2, Settings, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { StemTrack } from './SunoStudioTypes';

interface SunoStudioProps {
  user: User | null;
}

interface UploadedLoop {
  id: string;
  file: File;
  audioUrl: string;
  name: string;
  duration: number;
  type: 'loop' | 'sample' | 'vocal';
  isActive: boolean;
}

export function SunoStudio({ user }: SunoStudioProps) {
  const {
    project, setProject, isPlaying, play, pause, seekTo, setZoom,
    generationProgress, generationMode, setGenerationMode,
    selectedClipId, setSelectedClipId, history,
    generateSong, separateStems, extendSong, buildBeatAroundLoop, audioRef
  } = useSunoStudioState();

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'generate' | 'upload' | 'voices'>('generate');
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'history'>('inspector');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>('nkosazana-daughter');
  const [voicePitch, setVoicePitch] = useState(0);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [isBuildingBeat, setIsBuildingBeat] = useState(false);

  const selectedClip = project.clips.find(c => c.id === selectedClipId) || null;

  // Create and update audio element for playback
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    
    // Update audio source when selected clip changes
    if (selectedClip?.audioUrl) {
      audio.src = selectedClip.audioUrl;
      audio.load();
    }
    
    // Apply volume and mute
    audio.volume = isMuted ? 0 : volume;
    audio.loop = isLooping;
    
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [selectedClip?.audioUrl, volume, isMuted, isLooping, audioRef]);

  const handleTrackUpdate = (trackId: string, updates: any) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, ...updates } : t)
    }));
  };

  const handleDownload = async (clipId: string, format: 'mp3' | 'wav' | 'stems') => {
    const clip = project.clips.find(c => c.id === clipId);
    if (!clip) return;

    if (format === 'stems' && clip.stems) {
      const zip = new JSZip();
      for (const [type, url] of Object.entries(clip.stems)) {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          zip.file(`${type}.wav`, blob);
        } catch (e) { console.warn('Failed to download stem:', type); }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${clip.title}-stems.zip`;
      a.click();
    } else {
      const a = document.createElement('a');
      a.href = clip.audioUrl;
      a.download = `${clip.title}.${format}`;
      a.click();
    }
    toast.success(`Downloaded ${clip.title}`);
  };

  const handleDeleteClip = (clipId: string) => {
    setProject(prev => ({
      ...prev,
      clips: prev.clips.filter(c => c.id !== clipId)
    }));
    if (selectedClipId === clipId) setSelectedClipId(null);
    toast.success('Clip deleted');
  };

  const handleDuplicateClip = (clipId: string) => {
    const clip = project.clips.find(c => c.id === clipId);
    if (!clip) return;

    const newClip = {
      ...clip,
      id: crypto.randomUUID(),
      title: `${clip.title} (Copy)`,
      createdAt: new Date()
    };

    setProject(prev => ({
      ...prev,
      clips: [...prev.clips, newClip]
    }));
    setSelectedClipId(newClip.id);
    toast.success('Clip duplicated');
  };

  const handleBuildBeat = async (loops: UploadedLoop[], options: BeatBuildOptions) => {
    setIsBuildingBeat(true);
    
    try {
      // Call the actual API - it handles progress via generationProgress
      await buildBeatAroundLoop(loops, options);
    } catch (error) {
      console.error('Beat build error:', error);
    } finally {
      setTimeout(() => {
        setIsBuildingBeat(false);
      }, 2000);
    }
  };

  // Handle playing a clip from history
  const handlePlayClip = (clipId: string) => {
    const clip = project.clips.find(c => c.id === clipId) || history.find(c => c.id === clipId);
    if (clip && audioRef.current) {
      audioRef.current.src = clip.audioUrl;
      audioRef.current.load();
      audioRef.current.play();
      setSelectedClipId(clipId);
    }
  };

  // Add a new track to the timeline
  const handleAddTrack = () => {
    const newTrack = {
      id: crypto.randomUUID(),
      type: 'other' as const,
      name: `Track ${project.tracks.length + 1}`,
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'][project.tracks.length % 7],
      regions: [],
    };
    
    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));
    toast.success('Track added');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              Suno Studio
              <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">v5</span>
            </h1>
            <p className="text-xs text-muted-foreground">{project.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Generation / Upload / Voices */}
          <ResizablePanel defaultSize={28} minSize={22} maxSize={40}>
            <Tabs value={leftPanelTab} onValueChange={(v) => setLeftPanelTab(v as any)} className="h-full flex flex-col">
              <TabsList className="mx-3 mt-3 grid grid-cols-3 h-9">
                <TabsTrigger value="generate" className="text-xs gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" /> Create
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Loop
                </TabsTrigger>
                <TabsTrigger value="voices" className="text-xs gap-1.5">
                  <Mic2 className="h-3.5 w-3.5" /> Voice
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-hidden p-3">
                <TabsContent value="generate" className="h-full m-0">
                  <GenerationPanel
                    mode={generationMode}
                    onModeChange={setGenerationMode}
                    onGenerate={generateSong}
                    progress={generationProgress}
                    selectedClipId={selectedClipId}
                  />
                </TabsContent>
                <TabsContent value="upload" className="h-full m-0">
                  <LoopUploadPanel
                    onBuildBeat={handleBuildBeat}
                    isProcessing={isBuildingBeat || (generationProgress?.status === 'generating' || generationProgress?.status === 'processing' || generationProgress?.status === 'starting')}
                    progress={generationProgress?.progress || 0}
                    progressMessage={generationProgress?.message}
                  />
                </TabsContent>
                <TabsContent value="voices" className="h-full m-0">
                  <PersonaVoiceSelector
                    selectedVoiceId={selectedVoiceId}
                    onSelectVoice={setSelectedVoiceId}
                    pitch={voicePitch}
                    onPitchChange={setVoicePitch}
                    speed={voiceSpeed}
                    onSpeedChange={setVoiceSpeed}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Timeline */}
          <ResizablePanel defaultSize={50} minSize={35}>
            <div className="h-full p-3">
              <StudioTimeline
                project={project}
                onSeek={seekTo}
                onZoomChange={setZoom}
                onTrackUpdate={handleTrackUpdate}
                onClipSelect={setSelectedClipId}
                selectedClipId={selectedClipId}
                isPlaying={isPlaying}
                onDeleteClip={handleDeleteClip}
                onDuplicateClip={handleDuplicateClip}
                onAddTrack={handleAddTrack}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Inspector / History */}
          <ResizablePanel defaultSize={22} minSize={18} maxSize={35}>
            <Tabs value={rightPanelTab} onValueChange={(v) => setRightPanelTab(v as any)} className="h-full flex flex-col">
              <TabsList className="mx-3 mt-3 grid grid-cols-2 h-9">
                <TabsTrigger value="inspector" className="text-xs gap-1.5">
                  <FileAudio className="h-3.5 w-3.5" /> Clip
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs gap-1.5">
                  <History className="h-3.5 w-3.5" /> History
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-hidden p-3">
                <TabsContent value="inspector" className="h-full m-0">
                  <ClipInspector
                    clip={selectedClip}
                    onSeparateStems={separateStems}
                    onExtend={(id, dir) => extendSong(id, dir)}
                    onCreateVariation={(id) => toast.info('Creating variation...')}
                    onDownload={handleDownload}
                    onDelete={handleDeleteClip}
                  />
                </TabsContent>
                <TabsContent value="history" className="h-full m-0">
                  <HistoryPanel
                    history={history}
                    selectedClipId={selectedClipId}
                    onSelectClip={setSelectedClipId}
                    onDeleteClip={handleDeleteClip}
                    onPlayClip={handlePlayClip}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Transport Controls */}
      <TransportControls
        isPlaying={isPlaying}
        currentTime={project.playheadPosition}
        duration={project.duration || 180}
        bpm={project.bpm}
        volume={volume}
        isMuted={isMuted}
        isLooping={isLooping}
        onPlay={play}
        onPause={pause}
        onStop={() => { pause(); seekTo(0); }}
        onSeek={seekTo}
        onVolumeChange={setVolume}
        onMuteToggle={() => setIsMuted(!isMuted)}
        onLoopToggle={() => setIsLooping(!isLooping)}
        onSave={() => toast.success('Project saved')}
        onOpenProject={() => toast.info('Open project')}
        onSettings={() => toast.info('Settings')}
      />
    </div>
  );
}

export default SunoStudio;
