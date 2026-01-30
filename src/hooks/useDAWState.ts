/**
 * useDAWState - Centralized DAW UI state management
 * Extracts 50+ useState hooks from DAW.tsx into a single store
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { MidiNote, DragState } from '@/types/daw';
import type { InstrumentSpec } from '@/components/instruments';

interface DAWUIState {
  // Track & Selection
  selectedTrackId: string | null;
  selectedNotes: MidiNote[];
  selectedRegion: string;
  selectedInstruments: InstrumentSpec[];

  // Panel Visibility
  showPianoRoll: boolean;
  showMixer: boolean;
  showEffects: boolean;
  showAutomation: boolean;
  showAudioRecording: boolean;
  showCommunity: boolean;
  showVSTPlugins: boolean;
  showMIDIController: boolean;
  showAIAssistant: boolean;
  showVoiceToMusic: boolean;
  showAdvancedPatterns: boolean;
  showArtistStyleTransfer: boolean;
  showVirtualInstruments: boolean;
  showRealtimeAI: boolean;
  showAIModelRouter: boolean;
  showVoiceAIGuide: boolean;
  showRAGKnowledge: boolean;
  showRealTimeCollab: boolean;
  showAIMarketplace: boolean;
  showMusicAnalysis: boolean;
  showUnifiedAnalysis: boolean;
  showAuraSidebar: boolean;
  showPluginSidebar: boolean;
  showHighSpeedEngine: boolean;
  showGhostProducer: boolean;
  showTutorials: boolean;
  showMastering: boolean;
  showCursorTracking: boolean;
  isAuraSidebarMinimized: boolean;

  // Recording & Playback
  isRecording: boolean;
  pianoRollIsPlaying: boolean;
  pianoRollTime: number;
  audioGateVisible: boolean;

  // Modals
  isSettingsOpen: boolean;
  isOpenProjectOpen: boolean;

  // Zoom & View
  zoom: number[];

  // AI
  aiPrompt: string;
  importAudioUrl: string | null;

  // Drag State
  dragState: DragState;

  // Actions
  setSelectedTrackId: (id: string | null) => void;
  setSelectedNotes: (notes: MidiNote[]) => void;
  setSelectedRegion: (region: string) => void;
  setSelectedInstruments: (instruments: InstrumentSpec[]) => void;
  togglePanel: (panel: keyof DAWUIState) => void;
  setPanel: (panel: keyof DAWUIState, value: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  setPianoRollIsPlaying: (playing: boolean) => void;
  setPianoRollTime: (time: number) => void;
  setAudioGateVisible: (visible: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsOpenProjectOpen: (open: boolean) => void;
  setZoom: (zoom: number[]) => void;
  setAiPrompt: (prompt: string) => void;
  setImportAudioUrl: (url: string | null) => void;
  setDragState: (state: DragState) => void;
  resetDragState: () => void;
}

const defaultDragState: DragState = {
  isDragging: false,
  dragType: null,
  clipId: null,
  trackId: null,
  startX: 0,
  startTime: 0,
};

export const useDAWState = create<DAWUIState>()(
  immer((set) => ({
    // Track & Selection
    selectedTrackId: null,
    selectedNotes: [],
    selectedRegion: 'johannesburg',
    selectedInstruments: [],

    // Panel Visibility - defaults
    showPianoRoll: false,
    showMixer: false,
    showEffects: false,
    showAutomation: false,
    showAudioRecording: false,
    showCommunity: false,
    showVSTPlugins: false,
    showMIDIController: false,
    showAIAssistant: true,
    showVoiceToMusic: false,
    showAdvancedPatterns: false,
    showArtistStyleTransfer: false,
    showVirtualInstruments: false,
    showRealtimeAI: false,
    showAIModelRouter: false,
    showVoiceAIGuide: false,
    showRAGKnowledge: false,
    showRealTimeCollab: false,
    showAIMarketplace: false,
    showMusicAnalysis: false,
    showUnifiedAnalysis: false,
    showAuraSidebar: true,
    showPluginSidebar: false,
    showHighSpeedEngine: true,
    showGhostProducer: false,
    showTutorials: false,
    showMastering: false,
    showCursorTracking: true,
    isAuraSidebarMinimized: false,

    // Recording & Playback
    isRecording: false,
    pianoRollIsPlaying: false,
    pianoRollTime: 0,
    audioGateVisible: true,

    // Modals
    isSettingsOpen: false,
    isOpenProjectOpen: false,

    // Zoom & View
    zoom: [100],

    // AI
    aiPrompt: '',
    importAudioUrl: null,

    // Drag State
    dragState: defaultDragState,

    // Actions
    setSelectedTrackId: (id) => set((state) => { state.selectedTrackId = id; }),
    setSelectedNotes: (notes) => set((state) => { state.selectedNotes = notes; }),
    setSelectedRegion: (region) => set((state) => { state.selectedRegion = region; }),
    setSelectedInstruments: (instruments) => set((state) => { state.selectedInstruments = instruments; }),
    
    togglePanel: (panel) => set((state) => {
      const current = state[panel];
      if (typeof current === 'boolean') {
        (state as any)[panel] = !current;
      }
    }),
    
    setPanel: (panel, value) => set((state) => {
      if (typeof state[panel] === 'boolean') {
        (state as any)[panel] = value;
      }
    }),
    
    setIsRecording: (recording) => set((state) => { state.isRecording = recording; }),
    setPianoRollIsPlaying: (playing) => set((state) => { state.pianoRollIsPlaying = playing; }),
    setPianoRollTime: (time) => set((state) => { state.pianoRollTime = time; }),
    setAudioGateVisible: (visible) => set((state) => { state.audioGateVisible = visible; }),
    setIsSettingsOpen: (open) => set((state) => { state.isSettingsOpen = open; }),
    setIsOpenProjectOpen: (open) => set((state) => { state.isOpenProjectOpen = open; }),
    setZoom: (zoom) => set((state) => { state.zoom = zoom; }),
    setAiPrompt: (prompt) => set((state) => { state.aiPrompt = prompt; }),
    setImportAudioUrl: (url) => set((state) => { state.importAudioUrl = url; }),
    setDragState: (dragState) => set((state) => { state.dragState = dragState; }),
    resetDragState: () => set((state) => { state.dragState = defaultDragState; }),
  }))
);

export default useDAWState;
