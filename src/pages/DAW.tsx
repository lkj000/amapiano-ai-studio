import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDawProjects } from '@/hooks/useDawProjects';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useVSTPluginSystem } from '@/hooks/useVSTPluginSystem';
import { usePluginSystem } from '@/hooks/usePluginSystem';
import { Track, DragState } from '@/types/daw';
import Navigation from '@/components/Navigation';
import { OptimizedTimeline } from '@/components/OptimizedTimeline';
import MixerPanel from '@/components/MixerPanel';
import AutomationLanesPanel from '@/components/AutomationLanesPanel';
import AudioRecordingPanel from '@/components/AudioRecordingPanel';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function DAW() {
  const [sidebarPanel, setSidebarPanel] = useState<'effects' | 'plugins' | 'automation' | 'recording' | 'settings'>('effects');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    clipId: null,
    trackId: null,
    startX: 0,
    startTime: 0
  });

  // Load projects from database
  const { data: projects, isLoading } = useDawProjects();
  
  // For now, use the first project or create a mock one
  const projectData = projects?.[0]?.project_data || {
    bpm: 120,
    keySignature: 'C',
    tracks: [],
    masterVolume: 0.8
  };

  // Initialize audio engine
  const audioEngine = useAudioEngine(projectData);
  
  // Initialize plugin systems with proper audio context
  const vstPluginSystem = useVSTPluginSystem(audioEngine?.getAudioContext?.() || null);
  const pluginSystem = usePluginSystem(audioEngine?.getAudioContext?.() || null);

  // Timeline handlers
  const handleTrackSelect = useCallback((trackId: string) => {
    setSelectedTrackId(trackId);
  }, []);

  const handleClipUpdate = useCallback((trackId: string, clipId: string, updates: { startTime?: number; duration?: number }) => {
    // TODO: Implement clip updates
    console.log('Clip update:', trackId, clipId, updates);
  }, []);

  const handleClipDuplicate = useCallback((clipId: string) => {
    // TODO: Implement clip duplication
    console.log('Duplicate clip:', clipId);
  }, []);

  const handleClipSplit = useCallback((clipId: string, position: number) => {
    // TODO: Implement clip splitting
    console.log('Split clip:', clipId, position);
  }, []);

  const handleClipDelete = useCallback((clipId: string) => {
    // TODO: Implement clip deletion
    console.log('Delete clip:', clipId);
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent, trackId: string, clipId: string) => {
    // TODO: Implement drag functionality
    console.log('Drag start:', trackId, clipId);
  }, []);

  // Track management functions
  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    if (!projectData?.tracks) return;
    // TODO: Update project data
    if (audioEngine?.setTrackVolume) {
      audioEngine.setTrackVolume(trackId, volume);
    }
  }, [projectData, audioEngine]);

  const handleMuteChange = useCallback((trackId: string) => {
    if (!projectData?.tracks) return;
    // TODO: Update project data
    toast.success(`Track mute toggled`);
  }, [projectData]);

  const handleSoloChange = useCallback((trackId: string) => {
    if (!projectData?.tracks) return;
    // TODO: Update project data
    toast.success(`Track solo toggled`);
  }, [projectData]);

  const handleMasterVolumeChange = useCallback((volume: number) => {
    if (audioEngine?.setMasterVolume) {
      audioEngine.setMasterVolume(volume);
    }
  }, [audioEngine]);

  const toggleTrackArm = useCallback((trackId: string) => {
    if (!projectData?.tracks) return;
    // TODO: Update project data
    toast.success(`Track arm toggled`);
  }, [projectData]);

  const handleRecordingComplete = useCallback((audioData: Blob, trackId: string) => {
    // Handle the recorded audio - in a real implementation, this would
    // convert the blob to an audio clip and add it to the track
    console.log('Recording complete for track:', trackId, audioData);
    toast.success('Recording saved to track');
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading DAW...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Header Section */}
      <Navigation />
      
      <div className="flex h-[calc(100vh-60px)]">
        {/* Main DAW Interface */}
        <div className="flex-1 flex flex-col">
          {/* Timeline and Main Content Area */}
          <div className="flex-1 relative">
            <OptimizedTimeline 
              tracks={projectData?.tracks || []}
              zoom={zoom}
              currentTime={audioEngine?.currentTime || 0}
              dragState={dragState}
              onTrackSelect={handleTrackSelect}
              onClipUpdate={handleClipUpdate}
              onClipDuplicate={handleClipDuplicate}
              onClipSplit={handleClipSplit}
              onClipDelete={handleClipDelete}
              onDragStart={handleDragStart}
              selectedTrackId={selectedTrackId}
            />
          </div>
          
          {/* Mixer Panel */}
          <div className="h-48 border-t border-border bg-background/50">
            <MixerPanel 
              tracks={projectData?.tracks || []} 
              onVolumeChange={handleVolumeChange}
              onMuteChange={handleMuteChange}
              onSoloChange={handleSoloChange}
              onTrackArmChange={toggleTrackArm}
              masterVolume={projectData?.masterVolume || 0.8}
              onMasterVolumeChange={handleMasterVolumeChange}
            />
          </div>
        </div>

        {/* Right Sidebar - Panels */}
        <div className="w-80 border-l border-border bg-background/50">
          {sidebarPanel === 'effects' && (
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Effects</h3>
              <p className="text-sm text-muted-foreground">Effects panel coming soon...</p>
            </div>
          )}
          
          {sidebarPanel === 'plugins' && (
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Plugins</h3>
              <p className="text-sm text-muted-foreground">Plugin panel coming soon...</p>
            </div>
          )}
          
          {sidebarPanel === 'automation' && (
            <AutomationLanesPanel 
              tracks={projectData?.tracks || []}
              onAutomationChange={(trackId, parameter, value) => {
                console.log('Automation change:', trackId, parameter, value);
                // In a real implementation, this would update the automation data
              }}
            />
          )}
          
          {sidebarPanel === 'recording' && (
            <AudioRecordingPanel 
              tracks={projectData?.tracks || []}
              selectedTrackId={projectData?.tracks?.find(t => t.isArmed)?.id}
              onTrackSelect={toggleTrackArm}
              onRecordingComplete={handleRecordingComplete}
            />
          )}
          
          <Tabs defaultValue={sidebarPanel} className="h-full flex flex-col">
            <TabsList className="w-full flex justify-center">
              <TabsTrigger value="effects" onClick={() => setSidebarPanel('effects')}>Effects</TabsTrigger>
              <TabsTrigger value="plugins" onClick={() => setSidebarPanel('plugins')}>Plugins</TabsTrigger>
              <TabsTrigger value="automation" onClick={() => setSidebarPanel('automation')}>Automation</TabsTrigger>
              <TabsTrigger value="recording" onClick={() => setSidebarPanel('recording')}>Recording</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}