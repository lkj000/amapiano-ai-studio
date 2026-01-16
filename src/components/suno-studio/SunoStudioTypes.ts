/**
 * Suno Studio Types
 * Complete type definitions for the Suno Studio component
 */

export type GenerationMode = 'create' | 'extend' | 'remix' | 'cover' | 'inpaint';
export type TrackStatus = 'idle' | 'generating' | 'processing' | 'ready' | 'error';
export type StemType = 'vocals' | 'drums' | 'bass' | 'other' | 'piano' | 'guitar' | 'strings';

export interface TimeRange {
  start: number; // seconds
  end: number;   // seconds
}

export interface AudioRegion {
  id: string;
  start: number;
  end: number;
  type: 'generated' | 'uploaded' | 'inpainted';
  audioUrl?: string;
  waveformData?: number[];
  isSelected?: boolean;
  isLocked?: boolean;
}

export interface StemTrack {
  id: string;
  type: StemType;
  name: string;
  audioUrl?: string;
  waveformData?: number[];
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
  regions: AudioRegion[];
}

export interface LyricLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'hook' | 'pre-chorus';
}

export interface GeneratedClip {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  duration: number;
  createdAt: Date;
  prompt?: string;
  style?: string;
  lyrics?: string;
  stems?: Record<StemType, string>;
  isVariation?: boolean;
  parentClipId?: string;
  metadata: ClipMetadata;
}

export interface ClipMetadata {
  bpm: number;
  key?: string;
  genre: string;
  mood?: string;
  modelVersion: string;
  quality?: 'draft' | 'standard' | 'high';
  hasVocals: boolean;
  isInstrumental: boolean;
}

export interface StudioProject {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  tracks: StemTrack[];
  clips: GeneratedClip[];
  lyrics: LyricLine[];
  bpm: number;
  key?: string;
  timeSignature: string;
  duration: number; // total duration in seconds
  playheadPosition: number;
  zoom: number;
  selectedRegionId?: string;
}

export interface GenerationRequest {
  mode: GenerationMode;
  prompt: string;
  lyrics?: string;
  style?: string;
  bpm?: number;
  key?: string;
  duration?: number;
  instrumental?: boolean;
  referenceAudioUrl?: string;
  continueFrom?: number; // timestamp to extend from
  inpaintRange?: TimeRange;
  variations?: number;
}

export interface GenerationProgress {
  status: 'queued' | 'starting' | 'generating' | 'processing' | 'succeeded' | 'failed';
  progress: number; // 0-100
  message?: string;
  estimatedTimeRemaining?: number;
  currentStep?: string;
}

export interface StudioSettings {
  autoSave: boolean;
  snapToGrid: boolean;
  gridSize: number; // in beats
  showWaveforms: boolean;
  showLyrics: boolean;
  theme: 'dark' | 'light';
  outputFormat: 'mp3' | 'wav' | 'flac';
  outputQuality: 'standard' | 'high' | 'lossless';
}

export interface CoverOptions {
  sourceAudioUrl: string;
  voiceStyle: string;
  pitch: number; // -12 to +12 semitones
  preserveInstrumental: boolean;
  language?: string;
}

export interface ExtendOptions {
  fromTimestamp: number;
  direction: 'forward' | 'backward';
  duration: number;
  seamless: boolean;
  matchStyle: boolean;
}

export interface RemixOptions {
  sourceAudioUrl: string;
  targetStyle: string;
  preserveVocals: boolean;
  preserveMelody: boolean;
  intensity: number; // 0-100, how much to change
}

export interface InpaintOptions {
  range: TimeRange;
  prompt?: string;
  regenerateVocals: boolean;
  regenerateInstrumental: boolean;
  crossfadeDuration: number;
}

export interface ExportOptions {
  format: 'mp3' | 'wav' | 'flac' | 'stems';
  quality: 'standard' | 'high' | 'lossless';
  includeLyrics: boolean;
  includeMetadata: boolean;
  normalizeAudio: boolean;
  fadeOut?: number;
}
