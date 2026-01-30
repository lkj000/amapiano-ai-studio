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
  
  // Individual panel setters (for direct access)
  setShowPianoRoll: (value: boolean) => void;
  setShowMixer: (value: boolean) => void;
  setShowEffects: (value: boolean) => void;
  setShowAutomation: (value: boolean) => void;
  setShowAudioRecording: (value: boolean) => void;
  setShowCommunity: (value: boolean) => void;
  setShowVSTPlugins: (value: boolean) => void;
  setShowMIDIController: (value: boolean) => void;
  setShowAIAssistant: (value: boolean) => void;
  setShowVoiceToMusic: (value: boolean) => void;
  setShowAdvancedPatterns: (value: boolean) => void;
  setShowArtistStyleTransfer: (value: boolean) => void;
  setShowVirtualInstruments: (value: boolean) => void;
  setShowRealtimeAI: (value: boolean) => void;
  setShowAIModelRouter: (value: boolean) => void;
  setShowVoiceAIGuide: (value: boolean) => void;
  setShowRAGKnowledge: (value: boolean) => void;
  setShowRealTimeCollab: (value: boolean) => void;
  setShowAIMarketplace: (value: boolean) => void;
  setShowMusicAnalysis: (value: boolean) => void;
  setShowUnifiedAnalysis: (value: boolean) => void;
  setShowAuraSidebar: (value: boolean) => void;
  setShowPluginSidebar: (value: boolean) => void;
  setShowHighSpeedEngine: (value: boolean) => void;
  setShowGhostProducer: (value: boolean) => void;
  setShowTutorials: (value: boolean) => void;
  setShowMastering: (value: boolean) => void;
  setShowCursorTracking: (value: boolean) => void;
  setIsAuraSidebarMinimized: (value: boolean) => void;
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
    
    // Individual panel setters
    setShowPianoRoll: (value) => set((state) => { state.showPianoRoll = value; }),
    setShowMixer: (value) => set((state) => { state.showMixer = value; }),
    setShowEffects: (value) => set((state) => { state.showEffects = value; }),
    setShowAutomation: (value) => set((state) => { state.showAutomation = value; }),
    setShowAudioRecording: (value) => set((state) => { state.showAudioRecording = value; }),
    setShowCommunity: (value) => set((state) => { state.showCommunity = value; }),
    setShowVSTPlugins: (value) => set((state) => { state.showVSTPlugins = value; }),
    setShowMIDIController: (value) => set((state) => { state.showMIDIController = value; }),
    setShowAIAssistant: (value) => set((state) => { state.showAIAssistant = value; }),
    setShowVoiceToMusic: (value) => set((state) => { state.showVoiceToMusic = value; }),
    setShowAdvancedPatterns: (value) => set((state) => { state.showAdvancedPatterns = value; }),
    setShowArtistStyleTransfer: (value) => set((state) => { state.showArtistStyleTransfer = value; }),
    setShowVirtualInstruments: (value) => set((state) => { state.showVirtualInstruments = value; }),
    setShowRealtimeAI: (value) => set((state) => { state.showRealtimeAI = value; }),
    setShowAIModelRouter: (value) => set((state) => { state.showAIModelRouter = value; }),
    setShowVoiceAIGuide: (value) => set((state) => { state.showVoiceAIGuide = value; }),
    setShowRAGKnowledge: (value) => set((state) => { state.showRAGKnowledge = value; }),
    setShowRealTimeCollab: (value) => set((state) => { state.showRealTimeCollab = value; }),
    setShowAIMarketplace: (value) => set((state) => { state.showAIMarketplace = value; }),
    setShowMusicAnalysis: (value) => set((state) => { state.showMusicAnalysis = value; }),
    setShowUnifiedAnalysis: (value) => set((state) => { state.showUnifiedAnalysis = value; }),
    setShowAuraSidebar: (value) => set((state) => { state.showAuraSidebar = value; }),
    setShowPluginSidebar: (value) => set((state) => { state.showPluginSidebar = value; }),
    setShowHighSpeedEngine: (value) => set((state) => { state.showHighSpeedEngine = value; }),
    setShowGhostProducer: (value) => set((state) => { state.showGhostProducer = value; }),
    setShowTutorials: (value) => set((state) => { state.showTutorials = value; }),
    setShowMastering: (value) => set((state) => { state.showMastering = value; }),
    setShowCursorTracking: (value) => set((state) => { state.showCursorTracking = value; }),
    setIsAuraSidebarMinimized: (value) => set((state) => { state.isAuraSidebarMinimized = value; }),
  }))
);

export default useDAWState;
