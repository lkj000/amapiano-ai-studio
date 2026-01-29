/**
 * DAW Store - Centralized state management with Zustand
 * Replaces 80+ useState hooks scattered across components
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============ TYPES ============

export type ModalType = 
  | 'welcome'
  | 'export'
  | 'projects'
  | 'settings'
  | 'browser'
  | 'mixer'
  | 'pianoRoll'
  | 'playlist'
  | 'effects'
  | 'vstRack'
  | 'producerDna'
  | 'logDrum'
  | 'groove'
  | 'soundLibrary'
  | 'syntheticIntelligence'
  | 'collaboration'
  | 'cloudBackup'
  | 'training'
  | 'analytics'
  | 'feedback'
  | null;

export type WorkspaceType = 'compose' | 'mix' | 'master' | 'learn';

export type ViewType = 'playlist' | 'pianoroll' | 'mixer';

export type SnapType = 'none' | 'step' | 'beat' | 'bar';

export interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  isPaused: boolean;
  currentStep: number;
  currentBar: number;
  bpm: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
}

export interface UIState {
  activeModal: ModalType;
  modalContext: Record<string, any>;
  modalHistory: ModalType[];
  activeWorkspace: WorkspaceType;
  activeView: ViewType;
  showBrowser: boolean;
  showVSTRack: boolean;
  showAdvancedPanels: boolean;
  snap: SnapType;
  zoom: number;
  isMobile: boolean;
  sidebarCollapsed: boolean;
}

export interface ProjectState {
  id: string;
  name: string;
  bpm: number;
  key: string;
  scale: string;
  timeSignature: { numerator: number; denominator: number };
  masterVolume: number;
  isDirty: boolean;
  lastSaved: Date | null;
}

export interface TrackState {
  selectedPatternId: string | null;
  selectedChannelId: string | null;
  selectedClipId: string | null;
  selectedNoteIds: string[];
}

export interface DAWStore {
  // Transport
  transport: TransportState;
  setTransport: (updates: Partial<TransportState>) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleRecord: () => void;
  setBPM: (bpm: number) => void;
  setCurrentPosition: (step: number, bar: number) => void;
  toggleLoop: () => void;
  setLoopPoints: (start: number, end: number) => void;

  // UI
  ui: UIState;
  openModal: (modal: ModalType, context?: Record<string, any>) => void;
  closeModal: () => void;
  goBackModal: () => void;
  setActiveWorkspace: (workspace: WorkspaceType) => void;
  setActiveView: (view: ViewType) => void;
  toggleBrowser: () => void;
  toggleVSTRack: () => void;
  toggleAdvancedPanels: () => void;
  setSnap: (snap: SnapType) => void;
  setZoom: (zoom: number) => void;
  setIsMobile: (isMobile: boolean) => void;
  toggleSidebar: () => void;

  // Project
  project: ProjectState;
  setProject: (updates: Partial<ProjectState>) => void;
  markDirty: () => void;
  markSaved: () => void;

  // Track Selection
  selection: TrackState;
  selectPattern: (patternId: string | null) => void;
  selectChannel: (channelId: string | null) => void;
  selectClip: (clipId: string | null) => void;
  selectNotes: (noteIds: string[]) => void;
  addNoteToSelection: (noteId: string) => void;
  clearSelection: () => void;

  // Reset
  reset: () => void;
}

// ============ INITIAL STATE ============

const initialTransport: TransportState = {
  isPlaying: false,
  isRecording: false,
  isPaused: false,
  currentStep: 0,
  currentBar: 0,
  bpm: 113,
  loopEnabled: true,
  loopStart: 0,
  loopEnd: 4,
};

const initialUI: UIState = {
  activeModal: null,
  modalContext: {},
  modalHistory: [],
  activeWorkspace: 'compose',
  activeView: 'playlist',
  showBrowser: true,
  showVSTRack: false,
  showAdvancedPanels: true,
  snap: 'step',
  zoom: 1,
  isMobile: false,
  sidebarCollapsed: false,
};

const initialProject: ProjectState = {
  id: 'default',
  name: 'Untitled Project',
  bpm: 113,
  key: 'C',
  scale: 'minor',
  timeSignature: { numerator: 4, denominator: 4 },
  masterVolume: 0.8,
  isDirty: false,
  lastSaved: null,
};

const initialSelection: TrackState = {
  selectedPatternId: 'pattern-1',
  selectedChannelId: null,
  selectedClipId: null,
  selectedNoteIds: [],
};

// ============ STORE ============

export const useDAWStore = create<DAWStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Transport State
        transport: initialTransport,
        
        setTransport: (updates) => set((state) => {
          Object.assign(state.transport, updates);
        }),
        
        play: () => set((state) => {
          state.transport.isPlaying = true;
          state.transport.isPaused = false;
        }),
        
        pause: () => set((state) => {
          state.transport.isPlaying = false;
          state.transport.isPaused = true;
        }),
        
        stop: () => set((state) => {
          state.transport.isPlaying = false;
          state.transport.isPaused = false;
          state.transport.isRecording = false;
          state.transport.currentStep = 0;
          state.transport.currentBar = 0;
        }),
        
        toggleRecord: () => set((state) => {
          state.transport.isRecording = !state.transport.isRecording;
        }),
        
        setBPM: (bpm) => set((state) => {
          state.transport.bpm = Math.max(40, Math.min(300, bpm));
          state.project.bpm = state.transport.bpm;
        }),
        
        setCurrentPosition: (step, bar) => set((state) => {
          state.transport.currentStep = step;
          state.transport.currentBar = bar;
        }),
        
        toggleLoop: () => set((state) => {
          state.transport.loopEnabled = !state.transport.loopEnabled;
        }),
        
        setLoopPoints: (start, end) => set((state) => {
          state.transport.loopStart = start;
          state.transport.loopEnd = end;
        }),

        // UI State
        ui: initialUI,
        
        openModal: (modal, context = {}) => set((state) => {
          if (state.ui.activeModal) {
            state.ui.modalHistory.push(state.ui.activeModal);
          }
          state.ui.activeModal = modal;
          state.ui.modalContext = context;
        }),
        
        closeModal: () => set((state) => {
          state.ui.activeModal = null;
          state.ui.modalContext = {};
          state.ui.modalHistory = [];
        }),
        
        goBackModal: () => set((state) => {
          const prevModal = state.ui.modalHistory.pop();
          state.ui.activeModal = prevModal || null;
        }),
        
        setActiveWorkspace: (workspace) => set((state) => {
          state.ui.activeWorkspace = workspace;
        }),
        
        setActiveView: (view) => set((state) => {
          state.ui.activeView = view;
        }),
        
        toggleBrowser: () => set((state) => {
          state.ui.showBrowser = !state.ui.showBrowser;
        }),
        
        toggleVSTRack: () => set((state) => {
          state.ui.showVSTRack = !state.ui.showVSTRack;
        }),
        
        toggleAdvancedPanels: () => set((state) => {
          state.ui.showAdvancedPanels = !state.ui.showAdvancedPanels;
        }),
        
        setSnap: (snap) => set((state) => {
          state.ui.snap = snap;
        }),
        
        setZoom: (zoom) => set((state) => {
          state.ui.zoom = Math.max(0.25, Math.min(4, zoom));
        }),
        
        setIsMobile: (isMobile) => set((state) => {
          state.ui.isMobile = isMobile;
          if (isMobile) {
            state.ui.showBrowser = false;
            state.ui.showVSTRack = false;
            state.ui.showAdvancedPanels = false;
          }
        }),
        
        toggleSidebar: () => set((state) => {
          state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
        }),

        // Project State
        project: initialProject,
        
        setProject: (updates) => set((state) => {
          Object.assign(state.project, updates);
          state.project.isDirty = true;
        }),
        
        markDirty: () => set((state) => {
          state.project.isDirty = true;
        }),
        
        markSaved: () => set((state) => {
          state.project.isDirty = false;
          state.project.lastSaved = new Date();
        }),

        // Selection State
        selection: initialSelection,
        
        selectPattern: (patternId) => set((state) => {
          state.selection.selectedPatternId = patternId;
        }),
        
        selectChannel: (channelId) => set((state) => {
          state.selection.selectedChannelId = channelId;
        }),
        
        selectClip: (clipId) => set((state) => {
          state.selection.selectedClipId = clipId;
        }),
        
        selectNotes: (noteIds) => set((state) => {
          state.selection.selectedNoteIds = noteIds;
        }),
        
        addNoteToSelection: (noteId) => set((state) => {
          if (!state.selection.selectedNoteIds.includes(noteId)) {
            state.selection.selectedNoteIds.push(noteId);
          }
        }),
        
        clearSelection: () => set((state) => {
          state.selection.selectedNoteIds = [];
          state.selection.selectedClipId = null;
        }),

        // Reset
        reset: () => set(() => ({
          transport: initialTransport,
          ui: initialUI,
          project: initialProject,
          selection: initialSelection,
        })),
      })),
      {
        name: 'daw-store',
        partialize: (state) => ({
          // Only persist UI preferences, not runtime state
          ui: {
            activeWorkspace: state.ui.activeWorkspace,
            showBrowser: state.ui.showBrowser,
            showAdvancedPanels: state.ui.showAdvancedPanels,
            snap: state.ui.snap,
            zoom: state.ui.zoom,
            sidebarCollapsed: state.ui.sidebarCollapsed,
          },
          project: {
            bpm: state.project.bpm,
            key: state.project.key,
            scale: state.project.scale,
          },
        }),
      }
    ),
    { name: 'DAWStore' }
  )
);

// ============ SELECTORS ============

// Memoized selectors for common queries
export const useTransport = () => useDAWStore((state) => state.transport);
export const useUI = () => useDAWStore((state) => state.ui);
export const useProject = () => useDAWStore((state) => state.project);
export const useSelection = () => useDAWStore((state) => state.selection);

export const useActiveModal = () => useDAWStore((state) => state.ui.activeModal);
export const useIsPlaying = () => useDAWStore((state) => state.transport.isPlaying);
export const useIsRecording = () => useDAWStore((state) => state.transport.isRecording);
export const useBPM = () => useDAWStore((state) => state.transport.bpm);
export const useCurrentPosition = () => useDAWStore((state) => ({
  step: state.transport.currentStep,
  bar: state.transport.currentBar,
}));

// Modal hook with open/close functions
export const useModal = (modalType: ModalType) => {
  const activeModal = useDAWStore((state) => state.ui.activeModal);
  const context = useDAWStore((state) => state.ui.modalContext);
  const openModal = useDAWStore((state) => state.openModal);
  const closeModal = useDAWStore((state) => state.closeModal);

  return {
    isOpen: activeModal === modalType,
    context,
    open: (ctx?: Record<string, any>) => openModal(modalType, ctx),
    close: closeModal,
  };
};
