/**
 * Level 5 Autonomous Agent Type Definitions
 * 
 * This module defines the core types for a production-grade autonomous
 * AI music generation system that exceeds Suno, Moises, and similar platforms.
 */

// ============================================================================
// TRAINING DATA TYPES
// ============================================================================

export interface AudioSample {
  id: string;
  url: string;
  duration: number;
  sampleRate: number;
  channels: number;
  format: 'wav' | 'mp3' | 'flac';
  size: number;
  uploadedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'labeled' | 'validated' | 'error';
}

export interface AudioFeatures {
  // Core Features (Essentia-extracted)
  bpm: number;
  bpmConfidence: number;
  key: string;
  keyConfidence: number;
  scale: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'other';
  
  // Spectral Features
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  spectralContrast: number[];
  mfcc: number[];
  chromagram: number[];
  
  // Rhythm Features
  onsetRate: number;
  beatPositions: number[];
  downbeatPositions: number[];
  swingRatio: number;
  microTimingDeviation: number; // Key for Amapiano groove
  
  // Energy Features
  rms: number;
  dynamicRange: number;
  loudness: number;
  
  // Harmonic Features
  harmonicRatio: number;
  chordProgression: ChordEvent[];
  
  // Log Drum Specific
  logDrumPresence: number;
  logDrumFrequency: number;
  logDrumDecay: number;
  logDrumTimbre: 'hard' | 'mellow' | 'distorted' | 'clean';
}

export interface ChordEvent {
  time: number;
  duration: number;
  chord: string;
  confidence: number;
}

export interface TrainingLabel {
  // Genre Classification
  genre: 'amapiano' | 'private-school' | '3-step' | 'bacardi' | 'soulful' | 'tech';
  genreConfidence: number;
  subgenre?: string;
  
  // Regional Style
  region: 'johannesburg' | 'pretoria' | 'durban' | 'cape-town' | 'unknown';
  regionConfidence: number;
  
  // Mood/Energy
  mood: string[];
  energy: number; // 0-1
  danceability: number; // 0-1
  
  // Instrument Presence
  instruments: {
    logDrum: number;
    piano: number;
    bass: number;
    shaker: number;
    hihat: number;
    kick: number;
    snare: number;
    synth: number;
    vocals: number;
  };
  
  // Quality Metrics
  productionQuality: number; // 0-1
  mixClarity: number; // 0-1
  authenticityScore: number; // 0-100
  
  // Annotation Source
  labelSource: 'essentia' | 'manual' | 'expert' | 'user-study';
  labeledBy?: string;
  labeledAt: Date;
  validatedBy?: string[];
}

export interface TrainingDataset {
  id: string;
  name: string;
  description: string;
  version: string;
  samples: TrainingSample[];
  stats: DatasetStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingSample {
  audio: AudioSample;
  features: AudioFeatures;
  labels: TrainingLabel;
  embedding?: number[]; // 512-dim learned embedding
  stems?: StemSeparation;
}

export interface StemSeparation {
  vocals?: string;
  drums?: string;
  bass?: string;
  piano?: string;
  other?: string;
  logDrum?: string; // Amapiano-specific stem
}

export interface DatasetStats {
  totalSamples: number;
  totalDuration: number; // seconds
  genreDistribution: Record<string, number>;
  regionDistribution: Record<string, number>;
  bpmRange: { min: number; max: number; mean: number };
  keyDistribution: Record<string, number>;
  qualityDistribution: { low: number; medium: number; high: number };
}

// ============================================================================
// MULTI-AGENT TYPES
// ============================================================================

export type AgentRole = 
  | 'groove'      // Rhythm, drums, log drums
  | 'harmony'     // Chords, piano, pads
  | 'bass'        // Basslines, sub
  | 'arrangement' // Structure, transitions
  | 'mixing'      // Levels, EQ, compression
  | 'mastering'   // Final polish
  | 'conductor';  // Orchestrates all agents

export interface AgentState {
  id: string;
  role: AgentRole;
  status: 'idle' | 'thinking' | 'generating' | 'evaluating' | 'complete' | 'error';
  currentTask?: string;
  progress: number;
  memory: AgentMemory;
  lastAction?: AgentAction;
}

export interface AgentMemory {
  shortTerm: Map<string, unknown>; // Current session context
  longTerm: Map<string, unknown>;  // Learned preferences
  episodic: AgentAction[];         // Recent action history
  semantic: LearnedConcept[];      // Learned musical concepts
}

export interface LearnedConcept {
  name: string;
  embedding: number[];
  examples: string[];
  confidence: number;
  lastUpdated: Date;
}

export interface AgentAction {
  id: string;
  agentRole: AgentRole;
  actionType: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  reward?: number;
  timestamp: Date;
}

export interface AgentMessage {
  from: AgentRole;
  to: AgentRole | 'broadcast';
  type: 'request' | 'response' | 'event' | 'feedback';
  payload: unknown;
  priority: number;
  timestamp: Date;
}

// ============================================================================
// GENERATION PIPELINE TYPES
// ============================================================================

export interface GenerationRequest {
  id: string;
  prompt: string;
  genre: 'amapiano' | 'private-school' | '3-step';
  region?: string;
  
  // Musical Parameters
  bpm?: number;
  key?: string;
  duration?: number;
  
  // Style Parameters
  mood?: string[];
  energy?: number;
  referenceTrackId?: string;
  
  // Quality Settings
  qualityTarget: number; // 0-100 minimum acceptable
  maxAttempts: number;
  
  // Advanced
  useFineTunedModel?: boolean;
  modelVersion?: string;
}

export interface GenerationResult {
  id: string;
  requestId: string;
  audioUrl: string;
  duration: number;
  
  // Quality Metrics
  qualityScore: number;
  authenticityScore: number;
  passedThreshold: boolean;
  
  // Analysis
  features: AudioFeatures;
  labels: Partial<TrainingLabel>;
  
  // Generation Details
  model: string;
  promptUsed: string;
  attempts: number;
  totalTime: number;
  
  // Agent Reports
  agentContributions: AgentContribution[];
}

export interface AgentContribution {
  agent: AgentRole;
  actions: AgentAction[];
  improvements: string[];
  qualityDelta: number;
}

// ============================================================================
// DISCRIMINATOR / QUALITY TYPES
// ============================================================================

export interface QualityAssessment {
  overallScore: number;
  
  // Component Scores
  components: {
    rhythmicAccuracy: number;
    harmonicRichness: number;
    soundDesignQuality: number;
    mixBalance: number;
    genreAuthenticity: number;
    productionPolish: number;
  };
  
  // Discriminator Outputs
  discriminatorScores: {
    isReal: number;           // 0-1 probability of being real
    genreMatch: number;       // Genre alignment
    qualityEstimate: number;  // Learned quality
    fadScore?: number;        // Fréchet Audio Distance
  };
  
  // Actionable Feedback
  issues: QualityIssue[];
  improvements: string[];
}

export interface QualityIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  fixSuggestion: string;
  affectedTimeRange?: [number, number];
}

// ============================================================================
// FINE-TUNING TYPES
// ============================================================================

export interface FineTuningConfig {
  id: string;
  baseModel: string;
  datasetId: string;
  
  // Training Hyperparameters
  epochs: number;
  batchSize: number;
  learningRate: number;
  warmupSteps: number;
  gradientAccumulationSteps: number;
  
  // Audio Processing
  sampleRate: number;
  chunkDuration: number; // seconds
  overlapRatio: number;
  
  // Genre-Specific
  genreWeights: Record<string, number>;
  regionWeights: Record<string, number>;
  
  // Checkpointing
  saveEveryNSteps: number;
  maxCheckpoints: number;
  
  // Validation
  validationSplit: number;
  evalEveryNSteps: number;
  earlyStoppingPatience: number;
}

export interface FineTuningJob {
  id: string;
  config: FineTuningConfig;
  status: 'queued' | 'preparing' | 'training' | 'validating' | 'complete' | 'failed';
  
  // Progress
  currentEpoch: number;
  currentStep: number;
  totalSteps: number;
  
  // Metrics
  trainingLoss: number[];
  validationLoss: number[];
  qualityMetrics: {
    step: number;
    fadScore: number;
    genreAccuracy: number;
    authenticityScore: number;
  }[];
  
  // Checkpoints
  checkpoints: Checkpoint[];
  bestCheckpoint?: string;
  
  // Timing
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
}

export interface Checkpoint {
  id: string;
  step: number;
  epoch: number;
  loss: number;
  metrics: Record<string, number>;
  path: string;
  createdAt: Date;
}

// ============================================================================
// SELF-IMPROVEMENT TYPES
// ============================================================================

export interface FeedbackSignal {
  type: 'explicit' | 'implicit';
  source: 'user' | 'discriminator' | 'expert' | 'a-b-test';
  
  // What was evaluated
  generationId: string;
  
  // The signal
  rating?: number;        // 1-5 or 0-100
  preference?: string;    // Which variant preferred
  annotations?: string[]; // Specific comments
  
  timestamp: Date;
}

export interface LearningUpdate {
  id: string;
  type: 'weight-update' | 'prompt-refinement' | 'parameter-adjustment';
  
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  
  triggeringSignals: FeedbackSignal[];
  expectedImprovement: number;
  actualImprovement?: number;
  
  appliedAt: Date;
  rolledBack?: boolean;
}

export interface SelfImprovementMetrics {
  totalFeedbackReceived: number;
  averageQualityImprovement: number;
  successfulUpdates: number;
  rolledBackUpdates: number;
  currentModelVersion: string;
  lastUpdate: Date;
}
