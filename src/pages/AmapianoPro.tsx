/**
 * AmapianoPro - Full-featured DAW for Amapiano Production
 * With real audio synthesis via Tone.js
 */

import React, { useState, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { DAWToolbar } from '@/components/daw-pro/DAWToolbar';
import { ChannelRack } from '@/components/daw-pro/ChannelRack';
import { PianoRoll } from '@/components/daw-pro/PianoRoll';
import { Playlist } from '@/components/daw-pro/Playlist';
import { Mixer } from '@/components/daw-pro/Mixer';
import { Browser } from '@/components/daw-pro/Browser';
import { VSTRack } from '@/components/daw-pro/VSTRack';
import { TransportBar } from '@/components/daw-pro/TransportBar';
import { ProducerDNAPanel } from '@/components/daw-pro/ProducerDNAPanel';
import { FMLogDrumPanel } from '@/components/daw-pro/FMLogDrumPanel';
import { GrooveEnginePanel } from '@/components/daw-pro/GrooveEnginePanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealAudioDAW } from '@/hooks/useRealAudioDAW';

export interface DAWPattern {
  id: string;
  name: string;
  color: string;
  channels: DAWChannel[];
  length: number;
}

export interface DAWChannel {
  id: string;
  name: string;
  type: 'sampler' | 'synth' | 'audio';
  instrument?: string;
  steps: boolean[];
  notes: DAWNote[];
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
}

export interface DAWNote {
  id: string;
  pitch: number;
  startStep: number;
  duration: number;
  velocity: number;
}

export interface PlaylistClip {
  id: string;
  patternId: string;
  trackIndex: number;
  startBar: number;
  length: number;
  color: string;
  name: string;
}

export interface MixerChannel {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: string[];
  sends: { id: string; amount: number }[];
  color: string;
}

export interface DAWProject {
  id: string;
  name: string;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  key: string;
  scale: string;
  patterns: DAWPattern[];
  playlist: PlaylistClip[];
  mixerChannels: MixerChannel[];
  masterVolume: number;
}

interface AmapianoproProps {
  user: User | null;
}

const DEFAULT_COLORS = [
  '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const createDefaultPattern = (id: string, name: string): DAWPattern => ({
  id,
  name,
  color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
  channels: [
    { 
      id: 'kick', name: 'Kick', type: 'sampler', 
      steps: Array(16).fill(false).map((_, i) => i % 4 === 0), 
      notes: [], volume: 0.8, pan: 0, muted: false, solo: false, color: '#EF4444' 
    },
    { 
      id: 'snare', name: 'Snare', type: 'sampler', 
      steps: Array(16).fill(false).map((_, i) => i % 8 === 4), 
      notes: [], volume: 0.75, pan: 0, muted: false, solo: false, color: '#F59E0B' 
    },
    { 
      id: 'hihat', name: 'HiHat', type: 'sampler', 
      steps: Array(16).fill(false).map((_, i) => i % 2 === 0), 
      notes: [], volume: 0.6, pan: 0.2, muted: false, solo: false, color: '#10B981' 
    },
    { 
      id: 'perc', name: 'Percussion', type: 'sampler', 
      steps: Array(16).fill(false), 
      notes: [], volume: 0.65, pan: -0.15, muted: false, solo: false, color: '#3B82F6' 
    },
    { 
      id: 'logdrum', name: 'Log Drum', type: 'synth', instrument: 'logdrum',
      steps: Array(16).fill(false).map((_, i) => [0, 3, 6, 10, 12].includes(i)), 
      notes: [], volume: 0.85, pan: 0, muted: false, solo: false, color: '#8B5CF6' 
    },
    { 
      id: 'pad', name: 'Pad', type: 'synth', instrument: 'purity',
      steps: Array(16).fill(false), 
      notes: [], volume: 0.5, pan: 0, muted: false, solo: false, color: '#EC4899' 
    },
    { 
      id: 'lead', name: 'Lead', type: 'synth', instrument: 'dexed',
      steps: Array(16).fill(false), 
      notes: [], volume: 0.55, pan: 0.1, muted: false, solo: false, color: '#06B6D4' 
    },
    { 
      id: 'shaker', name: 'Shaker', type: 'sampler',
      steps: Array(16).fill(false).map((_, i) => i % 2 === 1), 
      notes: [], volume: 0.4, pan: 0.3, muted: false, solo: false, color: '#84CC16' 
    },
  ],
  length: 16,
});

const createDefaultMixerChannels = (): MixerChannel[] => [
  { id: 'master', name: 'Master', volume: 0.8, pan: 0, muted: false, solo: false, effects: ['Limiter'], sends: [], color: '#F59E0B' },
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `insert-${i + 1}`,
    name: `Insert ${i + 1}`,
    volume: 0.75,
    pan: 0,
    muted: false,
    solo: false,
    effects: [],
    sends: [],
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  })),
];

const AmapianoPro: React.FC<AmapianoproProps> = ({ user }) => {
  // Real Audio Engine Hook
  const audioDAW = useRealAudioDAW();
  
  // Project State
  const [project, setProject] = useState<DAWProject>({
    id: 'default',
    name: 'Untitled Project',
    bpm: 113,
    timeSignature: { numerator: 4, denominator: 4 },
    key: 'C',
    scale: 'minor',
    patterns: [createDefaultPattern('pattern-1', 'Pattern 1')],
    playlist: [],
    mixerChannels: createDefaultMixerChannels(),
    masterVolume: 0.8,
  });

  // UI State
  const [activeView, setActiveView] = useState<'playlist' | 'pianoroll' | 'mixer'>('playlist');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('pattern-1');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(4);
  const [showBrowser, setShowBrowser] = useState(true);
  const [showVSTRack, setShowVSTRack] = useState(false);
  const [showAdvancedPanels, setShowAdvancedPanels] = useState(true);
  const [snap, setSnap] = useState<'none' | 'step' | 'beat' | 'bar'>('step');
  const [zoom, setZoom] = useState(1);

  const selectedPattern = project.patterns.find(p => p.id === selectedPatternId);
  const selectedChannel = selectedPattern?.channels.find(c => c.id === selectedChannelId);

  // Sync BPM with audio engine
  useEffect(() => {
    if (audioDAW.bpm !== project.bpm) {
      audioDAW.setBPM(project.bpm);
    }
  }, [project.bpm, audioDAW]);

  // Transport Controls - Now using real audio
  const handlePlay = useCallback(() => {
    audioDAW.play();
  }, [audioDAW]);

  const handlePause = useCallback(() => {
    audioDAW.pause();
  }, [audioDAW]);

  const handleStop = useCallback(() => {
    audioDAW.stop();
  }, [audioDAW]);

  // Pattern Management
  const handleAddPattern = useCallback(() => {
    const newId = `pattern-${project.patterns.length + 1}`;
    const newPattern = createDefaultPattern(newId, `Pattern ${project.patterns.length + 1}`);
    setProject(prev => ({
      ...prev,
      patterns: [...prev.patterns, newPattern],
    }));
    setSelectedPatternId(newId);
  }, [project.patterns.length]);

  const handleUpdatePattern = useCallback((patternId: string, updates: Partial<DAWPattern>) => {
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => 
        p.id === patternId ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  // Channel Management
  const handleAddChannel = useCallback((type: 'sampler' | 'synth') => {
    if (!selectedPatternId) return;
    
    const newChannel: DAWChannel = {
      id: `channel-${Date.now()}`,
      name: type === 'sampler' ? 'New Sampler' : 'New Synth',
      type,
      steps: Array(16).fill(false),
      notes: [],
      volume: 0.75,
      pan: 0,
      muted: false,
      solo: false,
      color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
    };

    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => 
        p.id === selectedPatternId 
          ? { ...p, channels: [...p.channels, newChannel] }
          : p
      ),
    }));
  }, [selectedPatternId]);

  const handleUpdateChannel = useCallback((channelId: string, updates: Partial<DAWChannel>) => {
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => 
        p.id === selectedPatternId 
          ? {
              ...p,
              channels: p.channels.map(c => 
                c.id === channelId ? { ...c, ...updates } : c
              ),
            }
          : p
      ),
    }));
  }, [selectedPatternId]);

  const handleToggleStep = useCallback((channelId: string, stepIndex: number) => {
    // Update visual state
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => 
        p.id === selectedPatternId 
          ? {
              ...p,
              channels: p.channels.map(c => 
                c.id === channelId 
                  ? { ...c, steps: c.steps.map((s, i) => i === stepIndex ? !s : s) }
                  : c
              ),
            }
          : p
      ),
    }));
    
    // Toggle step in audio engine
    audioDAW.toggleStep(channelId, stepIndex);
  }, [selectedPatternId, audioDAW]);

  // Piano Roll Note Management
  const handleAddNote = useCallback((pitch: number, startStep: number, duration: number = 1) => {
    if (!selectedChannelId) return;
    
    const newNote: DAWNote = {
      id: `note-${Date.now()}`,
      pitch,
      startStep,
      duration,
      velocity: 0.8,
    };

    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => 
        p.id === selectedPatternId 
          ? {
              ...p,
              channels: p.channels.map(c => 
                c.id === selectedChannelId 
                  ? { ...c, notes: [...c.notes, newNote] }
                  : c
              ),
            }
          : p
      ),
    }));
  }, [selectedPatternId, selectedChannelId]);

  const handleUpdateNote = useCallback((noteId: string, updates: Partial<DAWNote>) => {
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => 
        p.id === selectedPatternId 
          ? {
              ...p,
              channels: p.channels.map(c => 
                c.id === selectedChannelId 
                  ? {
                      ...c,
                      notes: c.notes.map(n => 
                        n.id === noteId ? { ...n, ...updates } : n
                      ),
                    }
                  : c
              ),
            }
          : p
      ),
    }));
  }, [selectedPatternId, selectedChannelId]);

  const handleDeleteNote = useCallback((noteId: string) => {
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => 
        p.id === selectedPatternId 
          ? {
              ...p,
              channels: p.channels.map(c => 
                c.id === selectedChannelId 
                  ? { ...c, notes: c.notes.filter(n => n.id !== noteId) }
                  : c
              ),
            }
          : p
      ),
    }));
  }, [selectedPatternId, selectedChannelId]);

  // Playlist Management
  const handleAddClip = useCallback((patternId: string, trackIndex: number, startBar: number) => {
    const pattern = project.patterns.find(p => p.id === patternId);
    if (!pattern) return;

    const newClip: PlaylistClip = {
      id: `clip-${Date.now()}`,
      patternId,
      trackIndex,
      startBar,
      length: pattern.length / 16,
      color: pattern.color,
      name: pattern.name,
    };

    setProject(prev => ({
      ...prev,
      playlist: [...prev.playlist, newClip],
    }));
  }, [project.patterns]);

  const handleUpdateClip = useCallback((clipId: string, updates: Partial<PlaylistClip>) => {
    setProject(prev => ({
      ...prev,
      playlist: prev.playlist.map(c => 
        c.id === clipId ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const handleDeleteClip = useCallback((clipId: string) => {
    setProject(prev => ({
      ...prev,
      playlist: prev.playlist.filter(c => c.id !== clipId),
    }));
  }, []);

  // Mixer Management
  const handleUpdateMixerChannel = useCallback((channelId: string, updates: Partial<MixerChannel>) => {
    setProject(prev => ({
      ...prev,
      mixerChannels: prev.mixerChannels.map(c => 
        c.id === channelId ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  // Project Settings
  const handleUpdateProject = useCallback((updates: Partial<DAWProject>) => {
    setProject(prev => ({ ...prev, ...updates }));
  }, []);

  const handleTranspose = useCallback((semitones: number) => {
    setProject(prev => ({
      ...prev,
      patterns: prev.patterns.map(p => ({
        ...p,
        channels: p.channels.map(c => ({
          ...c,
          notes: c.notes.map(n => ({
            ...n,
            pitch: n.pitch + semitones,
          })),
        })),
      })),
    }));
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Toolbar */}
      <DAWToolbar
        project={project}
        onUpdateProject={handleUpdateProject}
        activeView={activeView}
        onViewChange={setActiveView}
        onToggleBrowser={() => setShowBrowser(!showBrowser)}
        onToggleVSTRack={() => setShowVSTRack(!showVSTRack)}
        showBrowser={showBrowser}
        showVSTRack={showVSTRack}
        onTranspose={handleTranspose}
        snap={snap}
        onSnapChange={setSnap}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Browser Panel */}
          {showBrowser && (
            <>
              <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
                <Browser
                  onSelectSample={(sample) => console.log('Selected sample:', sample)}
                  onLoadInstrument={(instrument) => console.log('Load instrument:', instrument)}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Center Content */}
          <ResizablePanel defaultSize={showBrowser && showVSTRack ? 60 : showBrowser || showVSTRack ? 75 : 100}>
            <ResizablePanelGroup direction="vertical">
              {/* Advanced Panels (Producer DNA, FM Synth, Groove Engine) */}
              {showAdvancedPanels && (
                <>
                  <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                    <div className="h-full border-b border-border">
                      <Tabs defaultValue="producer-dna" className="h-full flex flex-col">
                        <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/30 px-2">
                          <TabsTrigger value="producer-dna" className="text-xs">Producer DNA</TabsTrigger>
                          <TabsTrigger value="fm-logdrum" className="text-xs">FM Log Drum</TabsTrigger>
                          <TabsTrigger value="groove" className="text-xs">Groove Engine</TabsTrigger>
                        </TabsList>
                        <div className="flex-1 overflow-hidden">
                        <TabsContent value="producer-dna" className="h-full m-0">
                            <ProducerDNAPanel 
                              selectedProfileId={audioDAW.producerProfile.id}
                              onProfileChange={audioDAW.setProducerProfile}
                            />
                          </TabsContent>
                          <TabsContent value="fm-logdrum" className="h-full m-0">
                            <FMLogDrumPanel onPatchChange={(patch) => console.log('Patch:', patch)} />
                          </TabsContent>
                          <TabsContent value="groove" className="h-full m-0">
                            <GrooveEnginePanel bpm={project.bpm} />
                          </TabsContent>
                        </div>
                      </Tabs>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                </>
              )}
              
              {/* Channel Rack */}
              <ResizablePanel defaultSize={showAdvancedPanels ? 25 : 35} minSize={15} maxSize={50}>
                <ChannelRack
                  pattern={selectedPattern}
                  patterns={project.patterns}
                  selectedPatternId={selectedPatternId}
                  selectedChannelId={selectedChannelId}
                  currentStep={audioDAW.currentStep}
                  isPlaying={audioDAW.isPlaying}
                  onSelectPattern={setSelectedPatternId}
                  onSelectChannel={setSelectedChannelId}
                  onAddPattern={handleAddPattern}
                  onUpdatePattern={handleUpdatePattern}
                  onAddChannel={handleAddChannel}
                  onUpdateChannel={handleUpdateChannel}
                  onToggleStep={handleToggleStep}
                />
              </ResizablePanel>
              
              <ResizableHandle withHandle />

              {/* Main View (Bottom) */}
              <ResizablePanel defaultSize={showAdvancedPanels ? 50 : 65}>
                {activeView === 'playlist' && (
                  <Playlist
                    project={project}
                    clips={project.playlist}
                    patterns={project.patterns}
                    currentBar={audioDAW.currentBar}
                    currentStep={audioDAW.currentStep}
                    isPlaying={audioDAW.isPlaying}
                    loopStart={loopStart}
                    loopEnd={loopEnd}
                    zoom={zoom}
                    bpm={project.bpm}
                    onAddClip={handleAddClip}
                    onUpdateClip={handleUpdateClip}
                    onDeleteClip={handleDeleteClip}
                    onLoopChange={(start, end) => { setLoopStart(start); setLoopEnd(end); }}
                    onSeek={audioDAW.seek}
                  />
                )}
                {activeView === 'pianoroll' && (
                  <PianoRoll
                    channel={selectedChannel}
                    pattern={selectedPattern}
                    currentStep={audioDAW.currentStep}
                    isPlaying={audioDAW.isPlaying}
                    snap={snap}
                    zoom={zoom}
                    rootNote={project.key}
                    scale={project.scale}
                    onAddNote={handleAddNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                  />
                )}
                {activeView === 'mixer' && (
                  <Mixer
                    channels={project.mixerChannels}
                    masterVolume={project.masterVolume}
                    onUpdateChannel={handleUpdateMixerChannel}
                    onUpdateMasterVolume={(vol) => handleUpdateProject({ masterVolume: vol })}
                  />
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* VST Rack Panel */}
          {showVSTRack && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <VSTRack
                  selectedChannel={selectedChannel}
                  onUpdateChannel={handleUpdateChannel}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Transport Bar */}
      <TransportBar
        isPlaying={audioDAW.isPlaying}
        currentStep={audioDAW.currentStep}
        currentBar={audioDAW.currentBar}
        bpm={project.bpm}
        timeSignature={project.timeSignature}
        loopEnabled={loopEnabled}
        loopStart={loopStart}
        loopEnd={loopEnd}
        meterLevel={audioDAW.meterLevel}
        isInitialized={audioDAW.isInitialized}
        producerProfile={audioDAW.producerProfile}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onBpmChange={(bpm) => handleUpdateProject({ bpm })}
        onLoopToggle={() => setLoopEnabled(!loopEnabled)}
        onSeek={audioDAW.seek}
        onToggleAdvanced={() => setShowAdvancedPanels(!showAdvancedPanels)}
        showAdvanced={showAdvancedPanels}
      />
    </div>
  );
};

export default AmapianoPro;
