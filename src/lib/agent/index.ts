/**
 * Agent Core Module Exports
 * Level 5 Autonomous Agent implementation
 */

export { ReActLoop, defaultTools } from './ReActLoop';
export type { ReActStep, ReActResult, Tool } from './ReActLoop';

export { GoalDecomposer } from './GoalDecomposer';
export type { Subtask, DecomposedGoal } from './GoalDecomposer';

export { ReflectionSystem } from './ReflectionSystem';
export type { ReflectionResult, ReflectionContext } from './ReflectionSystem';

export { ToolChainManager } from './ToolChainManager';
export type { ToolExecution, ExecutionResult, ToolChainConfig } from './ToolChainManager';

export { AutonomousAgent, autonomousAgent } from './AutonomousAgent';
export type { AgentStatus, AgentEvent, AgentConfig, ExecutionReport } from './AutonomousAgent';

export { EventEmitter } from './EventEmitter';

// Level 5 Agent with Full Music Production Capabilities + Human-in-the-Loop
export { Level5Agent, level5Agent, createSong, remixTrack, masterAndRelease, extractStems, createBeat } from './Level5Agent';
export type { 
  MusicProductionGoal, 
  Level5Result, 
  HITLCheckpoint, 
  HITLOption, 
  HITLResponse, 
  HITLCallback,
  HITLCheckpointType 
} from './Level5Agent';

// Music Production Tools (Suno + Moises + LANDR capabilities)
export { musicProductionTools } from './MusicProductionTools';

// Training Data Pipeline
export { TrainingDataPipeline, trainingPipeline, trainingTools } from './TrainingDataPipeline';
export type { TrainingDataSource, TrainingMetadata, AudioFeatures, TrainingDataset, TrainingConfig } from './TrainingDataPipeline';

// Reproducibility System
export { ReproducibilityManager, reproducibilityManager, reproducibilityTools } from './ReproducibilitySystem';
export type { 
  ReproducibleSeed, 
  GenerationState, 
  ReproducibilityConfig, 
  ReproductionResult,
  ReproducibilityMode,
  CreativeModeConfig,
  ProductionModeConfig
} from './ReproducibilitySystem';

// Ambient Agent Components
export { AgentSignalBus } from './ambient/AgentSignalBus';
export { ScheduledAgentHeartbeat } from './ambient/ScheduledAgentHeartbeat';
export { JudgeAgent } from './ambient/JudgeAgent';
export { DurableAgentState } from './ambient/DurableAgentState';
export { WorkflowReplayEngine } from './ambient/WorkflowReplayEngine';
