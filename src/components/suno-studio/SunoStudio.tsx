import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useSunoStudioState } from './hooks/useSunoStudioState';
import { StudioTimeline } from './components/StudioTimeline';
import { GenerationPanel } from './components/GenerationPanel';
import { ClipInspector } from './components/ClipInspector';
import { HistoryPanel } from './components/HistoryPanel';
import { TransportControls } from './components/TransportControls';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Wand2, History, FileAudio } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface SunoStudioProps {
  user: User | null;
}

export function SunoStudio({ user }: SunoStudioProps) {
  const {
    project, setProject, isPlaying, play, pause, seekTo, setZoom,
    generationProgress, generationMode, setGenerationMode,
    selectedClipId, setSelectedClipId, history,
    generateSong, separateStems, extendSong
  } = useSunoStudioState();

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'generate' | 'inspector' | 'history'>('generate');

  const selectedClip = project.clips.find(c => c.id === selectedClipId) || null;

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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Suno Studio</h1>
            <p className="text-xs text-muted-foreground">{project.name}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Generation */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <Tabs value={rightPanelTab} onValueChange={(v) => setRightPanelTab(v as any)} className="h-full flex flex-col">
              <TabsList className="mx-4 mt-4 grid grid-cols-3">
                <TabsTrigger value="generate" className="text-xs gap-1">
                  <Wand2 className="h-3 w-3" /> Create
                </TabsTrigger>
                <TabsTrigger value="inspector" className="text-xs gap-1">
                  <FileAudio className="h-3 w-3" /> Clip
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs gap-1">
                  <History className="h-3 w-3" /> History
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-hidden p-4">
                <TabsContent value="generate" className="h-full m-0">
                  <GenerationPanel
                    mode={generationMode}
                    onModeChange={setGenerationMode}
                    onGenerate={generateSong}
                    progress={generationProgress}
                    selectedClipId={selectedClipId}
                  />
                </TabsContent>
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
                    onPlayClip={(id) => { setSelectedClipId(id); play(); }}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Timeline */}
          <ResizablePanel defaultSize={70}>
            <div className="h-full p-4">
              <StudioTimeline
                project={project}
                onSeek={seekTo}
                onZoomChange={setZoom}
                onTrackUpdate={handleTrackUpdate}
                onClipSelect={setSelectedClipId}
                selectedClipId={selectedClipId}
                isPlaying={isPlaying}
              />
            </div>
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
