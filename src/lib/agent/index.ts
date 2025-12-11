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

// Ambient Agent Components
export { AgentSignalBus } from './ambient/AgentSignalBus';
export { ScheduledAgentHeartbeat } from './ambient/ScheduledAgentHeartbeat';
export { JudgeAgent } from './ambient/JudgeAgent';
export { DurableAgentState } from './ambient/DurableAgentState';
export { WorkflowReplayEngine } from './ambient/WorkflowReplayEngine';
