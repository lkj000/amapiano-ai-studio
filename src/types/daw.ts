// DAW Project Types
export interface MidiNote {
  pitch: number;
  velocity: number;
  startTime: number;
  duration: number;
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