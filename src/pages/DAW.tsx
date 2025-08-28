import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useProject } from '@/hooks/useProject';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useVSTPluginSystem } from '@/hooks/useVSTPluginSystem';
import { usePluginSystem } from '@/hooks/usePluginSystem';
import { Track } from '@/types/daw';
import { Header } from '@/components/Header';
import { Timeline } from '@/components/Timeline';
import { MixerPanel } from '@/components/MixerPanel';
import { EffectsPanel } from '@/components/EffectsPanel';
import { VSTPluginPanel } from '@/components/VSTPluginPanel';
import { PluginManagerPanel } from '@/components/PluginManagerPanel';
import { AutomationLanesPanel } from '@/components/AutomationLanesPanel';
import { AudioRecordingPanel } from '@/components/AudioRecordingPanel';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function DAW() {
  const [sidebarPanel, setSidebarPanel] = useState<'effects' | 'plugins' | 'automation' | 'recording' | 'settings'>('effects');
  const { 
    loadedProject, 
    createProject, 
    loadProject, 
    saveProject, 
    updateProject, 
    deleteProject 
  } = useProject();
  
  const projectData = loadedProject?.projectData;

  // Initialize audio engine
  const audioEngine = useAudioEngine(projectData?.tracks || []);
  
  // Initialize plugin systems with proper audio context
  const vstPluginSystem = useVSTPluginSystem(audioEngine.audioContext);
  const pluginSystem = usePluginSystem(audioEngine.audioContext);

  // Load project into audio engine
  useEffect(() => {
    if (projectData) {
      audioEngine.loadProject(projectData);
    }
  }, [projectData, audioEngine]);

  // Project management functions
  const handleNewProject = useCallback(() => {
    createProject();
  }, [createProject]);

  const handleLoadProject = useCallback((projectId: string) => {
    loadProject(projectId);
  }, [loadProject]);

  const handleSaveProject = useCallback(() => {
    if (loadedProject) {
      saveProject(loadedProject);
    }
  }, [loadedProject, saveProject]);

  const handleDeleteProject = useCallback(() => {
    if (loadedProject) {
      deleteProject(loadedProject.id);
    }
  }, [loadedProject, deleteProject]);

  // Track management functions
  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    if (!loadedProject?.projectData) return;

    const updatedTracks = loadedProject.projectData.tracks.map(track =>
      track.id === trackId ? { ...track, mixer: { ...track.mixer, volume } } : track
    );

    const updatedProject = {
      ...loadedProject,
      projectData: {
        ...loadedProject.projectData,
        tracks: updatedTracks
      }
    };

    updateProject(updatedProject);
    audioEngine.setTrackVolume(trackId, volume);
  }, [loadedProject, updateProject, audioEngine]);

  const handleMuteChange = useCallback((trackId: string) => {
    if (!loadedProject?.projectData) return;

    const updatedTracks = loadedProject.projectData.tracks.map(track => ({
      ...track,
      mixer: { ...track.mixer, isMuted: !track.mixer.isMuted }
    }));

    const updatedProject = {
      ...loadedProject,
      projectData: {
        ...loadedProject.projectData,
        tracks: updatedTracks
      }
    };

    updateProject(updatedProject);
    audioEngine.setTrackMute(trackId, updatedTracks.find(t => t.id === trackId)?.mixer.isMuted || false);
    toast.success(`Track ${updatedTracks.find(t => t.id === trackId)?.name} ${updatedTracks.find(t => t.id === trackId)?.mixer.isMuted ? 'muted' : 'unmuted'}`);
  }, [loadedProject, updateProject, audioEngine]);

  const handleSoloChange = useCallback((trackId: string) => {
    if (!loadedProject?.projectData) return;

    const updatedTracks = loadedProject.projectData.tracks.map(track => ({
      ...track,
      mixer: { ...track.mixer, isSolo: !track.mixer.isSolo }
    }));

    const updatedProject = {
      ...loadedProject,
      projectData: {
        ...loadedProject.projectData,
        tracks: updatedTracks
      }
    };

    updateProject(updatedProject);
    audioEngine.setTrackSolo(trackId, updatedTracks.find(t => t.id === trackId)?.mixer.isSolo || false);
    toast.success(`Track ${updatedTracks.find(t => t.id === trackId)?.name} ${updatedTracks.find(t => t.id === trackId)?.mixer.isSolo ? 'soloed' : 'unsoloed'}`);
  }, [loadedProject, updateProject, audioEngine]);

  const handleMasterVolumeChange = useCallback((volume: number) => {
    if (!loadedProject?.projectData) return;

    const updatedProject = {
      ...loadedProject,
      projectData: {
        ...loadedProject.projectData,
        masterVolume: volume
      }
    };

    updateProject(updatedProject);
    audioEngine.setMasterVolume(volume);
  }, [loadedProject, updateProject, audioEngine]);

  const toggleTrackArm = useCallback((trackId: string) => {
    if (!loadedProject?.projectData) return;

    const updatedTracks = loadedProject.projectData.tracks.map(track => ({
      ...track,
      isArmed: track.id === trackId ? !track.isArmed : false // Only one track can be armed at a time
    }));

    const updatedProject = {
      ...loadedProject,
      projectData: {
        ...loadedProject.projectData,
        tracks: updatedTracks
      }
    };

    updateProject(updatedProject);
    toast.success(`Track ${updatedTracks.find(t => t.id === trackId)?.name} ${updatedTracks.find(t => t.id === trackId)?.isArmed ? 'armed' : 'disarmed'}`);
  }, [loadedProject, updateProject]);

  const handleRecordingComplete = useCallback((audioData: Blob, trackId: string) => {
    // Handle the recorded audio - in a real implementation, this would
    // convert the blob to an audio clip and add it to the track
    console.log('Recording complete for track:', trackId, audioData);
    toast.success('Recording saved to track');
  }, []);

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Header Section */}
      <Header 
        projectName={projectData?.name || 'Untitled Project'}
        onNewProject={handleNewProject}
        onLoadProject={handleLoadProject}
        onSaveProject={handleSaveProject}
        onDeleteProject={handleDeleteProject}
      />
      
      <div className="flex h-[calc(100vh-60px)]">
        {/* Main DAW Interface */}
        <div className="flex-1 flex flex-col">
          {/* Timeline and Main Content Area */}
          <div className="flex-1 relative">
            <Timeline tracks={projectData?.tracks || []} />
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
            <EffectsPanel 
              tracks={projectData?.tracks || []}
              vstPlugins={vstPluginSystem.availablePlugins}
              onLoadVSTPlugin={(trackId, pluginId) => {
                vstPluginSystem.createVSTInstance(pluginId, trackId);
                toast.success('VST plugin loaded');
              }}
            />
          )}
          
          {sidebarPanel === 'plugins' && (
            <div className="h-full overflow-y-auto">
              <VSTPluginPanel 
                availablePlugins={vstPluginSystem.availablePlugins}
                installedPlugins={vstPluginSystem.installedPlugins}
                store={vstPluginSystem.store}
                onInstallPlugin={vstPluginSystem.downloadPlugin}
                onScanPlugins={vstPluginSystem.scanForVSTPlugins}
                isLoading={vstPluginSystem.isLoading}
              />
              
              <div className="border-t border-border mt-4">
                <PluginManagerPanel 
                  installedPlugins={pluginSystem.installedPlugins}
                  availablePlugins={pluginSystem.availablePlugins}
                  onInstallPlugin={pluginSystem.installPlugin}
                  onSearchPlugins={pluginSystem.searchMarketplace}
                  isLoading={pluginSystem.isLoading}
                />
              </div>
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
