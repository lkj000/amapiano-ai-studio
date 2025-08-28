// DAW Project Types
export interface MidiNote {
  id: string;
  pitch: number; // MIDI note number (0-127)
  velocity: number; // Note velocity (0-127)
  startTime: number; // Start time in beats
  duration: number; // Duration in beats
  pitchBend?: number; // Pitch bend value (-8192 to 8191)
}

export interface MidiClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  notes: MidiNote[];
}

export interface AudioClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  audioUrl: string;
}

export interface MidiTrack {
  id: string;
  type: 'midi';
  name: string;
  instrument: string;
  clips: MidiClip[];
  mixer: MixerChannel;
  isArmed: boolean;
  color: string;
}

export interface AudioTrack {
  id: string;
  type: 'audio';
  name: string;
  clips: AudioClip[];
  mixer: MixerChannel;
  isArmed: boolean;
  color: string;
}

export type DawTrack = MidiTrack | AudioTrack;
export type Track = DawTrack; // Alias for backward compatibility

export interface MixerChannel {
  volume: number;
  pan: number;
  isMuted: boolean;
  isSolo: boolean;
  effects: string[];
}

export interface DawProjectData {
  bpm: number;
  keySignature: string;
  timeSignature?: string;
  tracks: DawTrack[];
  masterVolume: number;
}

export interface DawProject {
  id: string;
  user_id: string;
  name: string;
  version: number;
  bpm: number;
  key_signature: string;
  time_signature: string;
  project_data: DawProjectData;
  created_at: string;
  updated_at: string;
}

export interface TrackData {
  id: number;
  name: string;
  type: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  color: string;
  effects: string[];
}

export interface InstrumentData {
  name: string;
  type: string;
  description: string;
  color?: string;
}

export interface EffectData {
  name: string;
  category: string;
  description: string;
}

export interface AudioLevels {
  left: number;
  right: number;
  peak: number;
}

export interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-left' | 'resize-right' | null;
  clipId: string | null;
  trackId: string | null;
  startX: number;
  startTime: number;
  startDuration?: number;
}

// Version 2.0 Types - Automation System
export interface AutomationPoint {
  time: number; // Time in beats
  value: number; // Parameter value (0-1 normalized)
  curve?: 'linear' | 'exponential' | 'logarithmic'; // Interpolation curve
}

export interface AutomationLane {
  id: string;
  projectId: string;
  trackId: string;
  parameterName: string; // 'volume', 'pan', 'effect_param'
  parameterType: string;
  effectId?: string; // For effect parameter automation
  points: AutomationPoint[];
  isEnabled: boolean;
  color: string;
}

// Version 2.0 Types - Sample Library
export interface Sample {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  fileUrl: string;
  category: 'drums' | 'bass' | 'piano' | 'synth' | 'vocal' | 'fx' | 'loop' | 'misc';
  bpm?: number;
  keySignature?: string;
  duration: number; // in seconds
  fileSize?: number;
  waveformData?: number[]; // Visualization data
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Version 2.0 Types - Audio Recording
export interface AudioRecording {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  waveformData?: number[];
  recordedAt: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  currentTime: number;
  inputLevel: number;
  recordedChunks: Blob[];
}

// Version 2.0 Types - Collaboration
export interface CollaborationSession {
  id: string;
  projectId: string;
  hostUserId: string;
  sessionName: string;
  isActive: boolean;
  participantLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationParticipant {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userColor: string;
  isActive: boolean;
  cursorPosition?: { x: number; y: number };
  currentTool?: string;
  permissions: {
    canEdit: boolean;
    canAddTracks: boolean;
    canDeleteTracks: boolean;
  };
  joinedAt: string;
  lastSeen: string;
}

export interface ProjectChange {
  id: string;
  projectId: string;
  userId: string;
  changeType: 'track_add' | 'track_delete' | 'track_update' | 'clip_add' | 'clip_delete' | 'clip_update' | 'note_edit' | 'automation_edit';
  changeData: any;
  timestamp: string;
}

// Extended track types with automation
export interface MidiTrackV2 extends MidiTrack {
  automationLanes: AutomationLane[];
}

export interface AudioTrackV2 extends AudioTrack {
  automationLanes: AutomationLane[];
  recordings?: AudioRecording[];
}

export type DawTrackV2 = MidiTrackV2 | AudioTrackV2;

export interface DawProjectDataV2 extends DawProjectData {
  tracks: DawTrackV2[];
  automationLanes: AutomationLane[];
  samples: Sample[];
  collaborationSession?: CollaborationSession;
}

// Waveform visualization
export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
}

// UI State for Version 2.0
export interface AutomationUIState {
  selectedLane: string | null;
  selectedPoints: string[];
  tool: 'select' | 'draw' | 'erase';
  showAutomation: boolean;
}

export interface SampleLibraryUIState {
  selectedCategory: string;
  searchQuery: string;
  selectedSample: Sample | null;
  isPlaying: boolean;
  previewTime: number;
}