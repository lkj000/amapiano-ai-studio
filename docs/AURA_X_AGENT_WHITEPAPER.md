# AURA-X: A Level 5 Autonomous Agent Architecture for Music Production

**Authors:** AURA-X Research Team  
**Version:** 1.0 | February 2025

---

## Executive Summary

This whitepaper presents AURA-X as a **Level 5 Autonomous Agent** platform for AI-powered music production, positioning it within the broader landscape of agentic AI systems. Following the framework established by Google's "Introduction to Agents" whitepaper and incorporating Temporal-inspired orchestration patterns, we demonstrate how AURA-X achieves true agent autonomy through the synthesis of reasoning, tool orchestration, durable execution, and continuous self-improvement.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [What is an Agent?](#2-what-is-an-agent)
3. [Agent Autonomy Levels](#3-agent-autonomy-levels)
4. [AURA-X Architecture](#4-aura-x-architecture)
5. [The Orchestration Layer](#5-the-orchestration-layer)
6. [Tools and Extensions](#6-tools-and-extensions)
7. [Reasoning and Acting: The ReAct Pattern](#7-reasoning-and-acting-the-react-pattern)
8. [Durable Execution and Ambient Agents](#8-durable-execution-and-ambient-agents)
9. [Multi-Agent Coordination](#9-multi-agent-coordination)
10. [Evaluation and Continuous Improvement](#10-evaluation-and-continuous-improvement)
11. [Critical Assessment](#11-critical-assessment)
12. [Conclusion](#12-conclusion)

---

## 1. Introduction

Artificial intelligence is transforming from passive, discrete task executors into autonomous problem-solvers capable of independent goal pursuit. This paradigm shift—from AI that merely predicts or generates content to AI that reasons, plans, and acts—defines the emergence of **AI Agents**.

AURA-X embodies this transformation in the domain of music production, specifically targeting authentic Amapiano music generation and transformation. Unlike single-task tools (Suno, Moises), AURA-X implements a complete agent architecture that:

- **Perceives** its environment through audio analysis and user intent understanding
- **Reasons** about goals using Chain-of-Thought (CoT) and ReAct patterns
- **Acts** through a coordinated set of specialized tools
- **Reflects** on outcomes and continuously improves its strategies
- **Operates autonomously** with minimal human intervention after goal specification

### What Changed: Temporal-Inspired Orchestration

The recent integration of **Temporal-inspired ambient agent orchestration** elevates AURA-X from a sophisticated workflow tool to a true autonomous agent system:

| Component | Before | After (Temporal-Inspired) |
|-----------|--------|---------------------------|
| Execution Model | User-triggered, synchronous | Always-on heartbeats, ambient |
| Communication | Direct function calls | Durable signal bus with priority queuing |
| State Management | Ephemeral | Workflow checkpoints, crash recovery |
| Quality Assurance | Post-hoc analysis | Continuous Judge Agent evaluation |
| Coordination | Sequential orchestration | Multi-agent signals and queries |
| Prompt Evolution | Static | LLM-as-Judge refinement loop |

---

## 2. What is an Agent?

Following the canonical definition from Google's Agents whitepaper:

> **An agent is an application engineered to achieve specific objectives by perceiving its environment and strategically acting upon it using the tools at its disposal.**

The fundamental principle of an agent lies in its **synthesis of reasoning, logic, and access to external information**, enabling it to perform tasks and make decisions beyond the inherent capabilities of the underlying model alone.

### The Agent Triad

```
┌─────────────────────────────────────────────────────────────┐
│                         AGENT                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  ORCHESTRATION LAYER                  │   │
│  │  ┌────────────┐  ┌──────────┐  ┌─────────────────┐   │   │
│  │  │  Memory    │  │ Reasoning│  │    Planning     │   │   │
│  │  │  & State   │  │  (CoT)   │  │  (Decompose)    │   │   │
│  │  └────────────┘  └──────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│           ┌────────────────┼────────────────┐               │
│           ▼                ▼                ▼               │
│      ┌─────────┐      ┌─────────┐      ┌─────────┐         │
│      │  MODEL  │      │  TOOLS  │      │  DATA   │         │
│      │ (LLM)   │      │         │      │ STORES  │         │
│      └─────────┘      └─────────┘      └─────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### AURA-X Agent Components

| Component | AURA-X Implementation |
|-----------|----------------------|
| **Model** | Lovable AI Gateway (Gemini 2.5 Flash), LLMReasoningEngine |
| **Tools** | Stem Separation, Voice Synthesis, Amapianorization, Audio Analysis, SVDQuant-Audio |
| **Orchestration** | AmbientAgentOrchestrator, ReActLoop, GoalDecomposer, ReflectionSystem |
| **Memory** | DurableAgentState, Supabase persistence, agent_memory table |
| **Communication** | AgentSignalBus with typed signals and queries |

---

## 3. Agent Autonomy Levels

Agents can be classified by their degree of autonomy, similar to the SAE levels for autonomous vehicles:

| Level | Description | Human Role | AURA-X Status |
|-------|-------------|------------|---------------|
| **Level 1** | Rule-based automation | Full control | ❌ Exceeded |
| **Level 2** | LLM-enhanced suggestions | Approves each step | ❌ Exceeded |
| **Level 3** | Semi-autonomous with oversight | Monitors and intervenes | ❌ Exceeded |
| **Level 4** | Autonomous with boundaries | Sets goals, reviews results | ⚠️ Partial |
| **Level 5** | Fully autonomous | Minimal involvement | ✅ **Target Architecture** |

### AURA-X Level 5 Capabilities

AURA-X targets Level 5 autonomy through:

1. **Goal-Directed Behavior**: User specifies high-level intent ("Create authentic Amapiano track"), agent autonomously decomposes, plans, and executes
2. **Self-Directed Planning**: GoalDecomposer breaks goals into subtasks with dependency graphs
3. **Autonomous Tool Selection**: Agent decides which tools to use based on reasoning
4. **Continuous Self-Improvement**: JudgeAgent evaluates performance and refines prompts
5. **Ambient Operation**: ScheduledAgentHeartbeat enables always-on proactive behavior
6. **Crash Recovery**: DurableAgentState survives failures through checkpointing

---

## 4. AURA-X Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    AURA-X AUTONOMOUS AGENT SYSTEM                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 AMBIENT AGENT ORCHESTRATOR                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │   Broker     │  │  Execution   │  │    Analyzer      │   │   │
│  │  │   Agent      │  │    Agent     │  │     Agent        │   │   │
│  │  │              │  │              │  │                  │   │   │
│  │  │ • User Intent│  │ • Tool Exec  │  │ • Audio Analysis │   │   │
│  │  │ • Workflow   │  │ • Decision   │  │ • Trend Detect   │   │   │
│  │  │   Routing    │  │   Making     │  │ • Quality Assess │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │   │
│  │                           │                                  │   │
│  │  ┌────────────────────────┴──────────────────────────────┐  │   │
│  │  │                 AGENT SIGNAL BUS                       │  │   │
│  │  │  [nudge] [update_prompt] [data] [evaluation] [refine] │  │   │
│  │  └────────────────────────┬──────────────────────────────┘  │   │
│  │                           │                                  │   │
│  │  ┌──────────────┐  ┌──────┴───────┐  ┌──────────────────┐   │   │
│  │  │   Judge      │  │   Durable    │  │   Scheduled      │   │   │
│  │  │   Agent      │  │    State     │  │   Heartbeat      │   │   │
│  │  │              │  │              │  │                  │   │   │
│  │  │ • Evaluate   │  │ • Checkpoint │  │ • 30s Nudges     │   │   │
│  │  │ • Refine     │  │ • Recovery   │  │ • 5m Evaluation  │   │   │
│  │  │ • Improve    │  │ • Replay     │  │ • 1h Memory      │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    AUTONOMOUS AGENT CORE                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐    │   │
│  │  │ Goal        │  │ ReAct       │  │ LLM Reasoning     │    │   │
│  │  │ Decomposer  │  │ Loop        │  │ Engine            │    │   │
│  │  └─────────────┘  └─────────────┘  └───────────────────┘    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐    │   │
│  │  │ Reflection  │  │ Tool Chain  │  │ Memory            │    │   │
│  │  │ System      │  │ Manager     │  │ Persistence       │    │   │
│  │  └─────────────┘  └─────────────┘  └───────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                       TOOL ECOSYSTEM                         │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐  │   │
│  │  │ Stem      │ │ Voice     │ │ Amapiano- │ │ Audio       │  │   │
│  │  │ Separation│ │ Synthesis │ │ rization  │ │ Analysis    │  │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────────┘  │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐  │   │
│  │  │ SVDQuant  │ │ Music     │ │ RAG       │ │ Vector      │  │   │
│  │  │ Audio     │ │ Generation│ │ Knowledge │ │ Embeddings  │  │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. The Orchestration Layer

The orchestration layer is the "brain" of the agent system, implementing **cyclical reasoning** that dictates how agents:
1. Assimilate information
2. Engage in internal reasoning
3. Use reasoning to inform subsequent actions

### 5.1 Chain-of-Thought Reasoning

Based on Wei et al. (arXiv:2201.11903), AURA-X implements CoT prompting to elicit step-by-step reasoning:

```typescript
// LLMReasoningEngine.ts
interface ReasoningOutput {
  thought: string;           // Current reasoning step
  suggested_actions: string[]; // Proposed next actions
  confidence: number;        // Certainty level
}

// Example reasoning chain for music production:
// Thought 1: "The user wants an authentic Amapiano track. I need to analyze the input audio first."
// Thought 2: "BPM is 113, which is typical for Amapiano. Now I should add log drums."
// Thought 3: "Log drum pattern applied. The authenticity score is 72%. Adding piano stabs could improve it."
```

### 5.2 Goal Decomposition

Complex user intents are decomposed into actionable subtasks with dependency management:

```typescript
// GoalDecomposer output structure
interface DecomposedGoal {
  mainGoal: string;
  subtasks: Subtask[];
  dependencies: DependencyGraph;
  estimatedDuration: number;
}

// Example decomposition:
// Goal: "Create authentic Amapiano track from uploaded audio"
// Subtasks:
//   1. Analyze source audio (no deps)
//   2. Separate stems (depends on 1)
//   3. Select regional elements (depends on 1)
//   4. Apply log drums (depends on 2, 3)
//   5. Add percussion layer (depends on 4)
//   6. Apply sidechain compression (depends on 5)
//   7. Calculate authenticity score (depends on 6)
```

---

## 6. Tools and Extensions

Following the Agents whitepaper framework, tools bridge the divide between the agent's internal capabilities and external systems.

### 6.1 AURA-X Tool Registry

| Tool | Category | Description | Input | Output |
|------|----------|-------------|-------|--------|
| `stemSeparationTool` | Audio Processing | Demucs-based stem extraction | Audio URL | 5 stem URLs |
| `voiceSynthesisTool` | Generation | ElevenLabs TTS integration | Text, voice params | Audio URL |
| `amapianorizationTool` | Transformation | Cultural element injection | Audio buffer, settings | Enhanced audio |
| `audioAnalysisTool` | Analysis | Essentia-based feature extraction | Audio URL | Musicality metrics |
| `musicGenerationTool` | Generation | Replicate-based music synthesis | Prompt, params | Audio URL |
| `svdQuantTool` | Optimization | Phase-aware model quantization | Model, bit depth | Quantized model |
| `ragKnowledgeTool` | Knowledge | Semantic document retrieval | Query | Relevant context |
| `authenticityScoreTool` | Evaluation | Regional authenticity assessment | Audio, region | Score 0-100 |

### 6.2 Tool Chain Manager

The ToolChainManager orchestrates sequential and parallel tool execution with:
- **Priority queuing**: Critical tools execute first
- **Fallback handling**: Graceful degradation on failure
- **Result propagation**: Outputs feed into subsequent tools

```typescript
// Tool execution flow
const chain = toolChainManager
  .addTool('audioAnalysis', { url: sourceAudio })
  .addTool('stemSeparation', { url: sourceAudio })
  .addParallel([
    { tool: 'selectLogDrums', config: { region: 'johannesburg' } },
    { tool: 'selectPercussion', config: { density: 0.7 } }
  ])
  .addTool('mixAudio', { inputs: ['$logDrums', '$percussion', '$stems.drums'] })
  .execute();
```

---

## 7. Reasoning and Acting: The ReAct Pattern

AURA-X implements the **ReAct** (Reasoning + Acting) paradigm, interleaving thought generation with action execution.

### 7.1 ReAct Loop Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     ReAct Loop                            │
│                                                          │
│   ┌─────────┐    ┌─────────┐    ┌─────────────┐         │
│   │  THINK  │───▶│   ACT   │───▶│   OBSERVE   │         │
│   │         │    │         │    │             │         │
│   │ Generate│    │ Execute │    │ Interpret   │         │
│   │ thought │    │  tool   │    │  result     │         │
│   └─────────┘    └─────────┘    └─────────────┘         │
│        ▲                              │                  │
│        │                              │                  │
│        └──────────────────────────────┘                  │
│                   Loop until goal achieved               │
│                    or max steps reached                  │
└──────────────────────────────────────────────────────────┘
```

### 7.2 Implementation

```typescript
// ReActLoop.ts - Core execution cycle
class ReActLoop {
  async run(): Promise<ReActState> {
    while (!this.state.isComplete && this.state.totalSteps < this.maxSteps) {
      // THINK: Generate next thought using LLM
      const thought = await this.think();
      
      // ACT: Execute the proposed action
      if (thought.nextAction) {
        const result = await this.act(thought);
        
        // OBSERVE: Interpret results and decide continuation
        const observation = this.observe(result);
        
        if (!observation.shouldContinue) {
          this.state.isComplete = true;
        }
      }
    }
    return this.state;
  }
}
```

---

## 8. Durable Execution and Ambient Agents

The Temporal-inspired architecture introduces **durability** and **ambient operation** to AURA-X.

### 8.1 Durable Agent State

Workflows survive crashes and restarts through persistent checkpointing:

```typescript
// DurableAgentState.ts
interface WorkflowState {
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  checkpoints: WorkflowCheckpoint[];  // Recovery points
  context: Record<string, any>;       // Preserved state
}

// Recovery capability:
// 1. Workflow starts, checkpoint at step 3
// 2. System crashes
// 3. On restart, load checkpoint, resume from step 3
// 4. No re-execution of completed steps
```

### 8.2 Scheduled Heartbeats (Ambient Agents)

Agents operate continuously without explicit user triggers:

```typescript
// ScheduledAgentHeartbeat.ts - Always-on operation
const AURA_X_SCHEDULES = [
  {
    name: 'Execution Nudge',
    targetAgent: 'execution-agent',
    signalType: 'nudge',
    intervalMs: 30000,        // Every 30 seconds
    payload: { action: 'analyze_and_act' }
  },
  {
    name: 'Performance Evaluation',
    targetAgent: 'judge-agent',
    signalType: 'nudge',
    intervalMs: 300000,       // Every 5 minutes
    payload: { action: 'evaluate_performance' }
  },
  {
    name: 'Memory Consolidation',
    targetAgent: 'broker-agent',
    signalType: 'nudge',
    intervalMs: 3600000,      // Every hour
    payload: { action: 'consolidate_memory' }
  }
];
```

### 8.3 Signal Bus (Durable Communication)

Inter-agent messaging with guaranteed delivery and priority ordering:

```typescript
// AgentSignalBus.ts
type SignalType = 
  | 'nudge'           // Wake up and process
  | 'update_prompt'   // Prompt refinement
  | 'evaluation'      // Performance feedback
  | 'refinement';     // Strategy update

// Priority-ordered queue ensures critical signals processed first
await signalBus.signal(
  'judge-agent',      // source
  'execution-agent',  // target
  'refinement',       // type
  { newStrategy: updatedConfig },
  'high'              // priority
);
```

---

## 9. Multi-Agent Coordination

AURA-X implements a **hierarchical multi-agent architecture** with specialized roles:

### 9.1 Agent Roles

| Agent | Role | Responsibilities |
|-------|------|------------------|
| **Broker Agent** | Entry Point | User intent parsing, workflow routing, memory consolidation |
| **Execution Agent** | Worker | Tool execution, decision making, task completion |
| **Analyzer Agent** | Observer | Audio analysis, trend detection, quality assessment |
| **Judge Agent** | Supervisor | Performance evaluation, prompt refinement, strategy improvement |

### 9.2 Coordination Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                  MULTI-AGENT COORDINATION                        │
│                                                                  │
│     USER GOAL                                                    │
│         │                                                        │
│         ▼                                                        │
│   ┌───────────────┐     Query status      ┌───────────────┐     │
│   │   BROKER      │◄────────────────────►│   ANALYZER    │     │
│   │   AGENT       │                       │   AGENT       │     │
│   └───────┬───────┘                       └───────────────┘     │
│           │                                       ▲              │
│           │ Delegate execution                    │              │
│           ▼                                       │              │
│   ┌───────────────┐     Report results           │              │
│   │  EXECUTION    │──────────────────────────────┘              │
│   │   AGENT       │                                              │
│   └───────┬───────┘                                              │
│           │                                                      │
│           │ Execution data                                       │
│           ▼                                                      │
│   ┌───────────────┐                                              │
│   │    JUDGE      │───────► Refinement signals to all agents    │
│   │    AGENT      │                                              │
│   └───────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Evaluation and Continuous Improvement

### 10.1 LLM-as-Judge Pattern

The JudgeAgent implements continuous performance evaluation:

```typescript
// JudgeAgent.ts
interface PerformanceMetrics {
  successRate: number;           // Task completion rate
  averageExecutionTime: number;  // Efficiency
  errorRate: number;             // Failure frequency
  taskCompletionRate: number;    // Subtask success
  qualityScore: number;          // Output quality
  authenticityScore?: number;    // Cultural accuracy (domain-specific)
}

// Assessment levels
type Assessment = 'excellent' | 'good' | 'needs_improvement' | 'poor';

// Automatic prompt refinement for underperforming agents
if (assessment === 'needs_improvement' || assessment === 'poor') {
  const refinedPrompt = await this.generatePromptRefinements(agentId, metrics);
  await signalBus.signal(this.agentId, agentId, 'update_prompt', { 
    newPrompt: refinedPrompt 
  });
}
```

### 10.2 Evaluation Metrics

| Metric | Threshold | Action on Failure |
|--------|-----------|-------------------|
| Success Rate | < 70% | Increase error handling |
| Execution Time | > 30s | Optimize parallelization |
| Task Completion | < 80% | Review goal decomposition |
| Quality Score | < 60% | Enhance validation |
| Authenticity Score | < 70% | Adjust regional element selection |

---

## 11. Critical Assessment

### 11.1 Level 5 Compliance Analysis

| Criterion | Status | Evidence | Gap |
|-----------|--------|----------|-----|
| **Autonomous Goal Pursuit** | ✅ | GoalDecomposer + ReActLoop | None |
| **Self-Directed Planning** | ✅ | Dependency graph generation | None |
| **Tool Selection** | ✅ | LLM-based reasoning | None |
| **Self-Improvement** | ✅ | JudgeAgent + prompt refinement | Weights still partially heuristic |
| **Ambient Operation** | ✅ | ScheduledAgentHeartbeat | Requires always-on infrastructure |
| **Durable Execution** | ✅ | DurableAgentState + checkpoints | Full replay not implemented |
| **Multi-Agent Coordination** | ✅ | AgentSignalBus + queries | Limited concurrent agent count |
| **Zero Human Intervention** | ⚠️ | Most operations autonomous | User study validation still manual |

### 11.2 Strengths

1. **Complete Agent Architecture**: All three pillars (Model, Tools, Orchestration) fully implemented
2. **Temporal Patterns**: Durability, signals, and heartbeats exceed typical agent systems
3. **Domain Specialization**: Amapianorization engine provides unique cultural authenticity
4. **Continuous Learning**: JudgeAgent enables live prompt and strategy evolution
5. **Production-Grade Infrastructure**: Supabase persistence, edge functions, real audio processing

### 11.3 Weaknesses and Gaps

1. **SVDQuant-Audio Naming**: Component name implies SVD but implementation uses low-rank approximation
2. **Authenticity Scoring**: Still partially heuristic; requires more user study data for learned weights
3. **Vector Embeddings**: Uses deterministic projection rather than true semantic alignment
4. **Vocal Synthesis**: Relies on external ElevenLabs API; no local voice model
5. **4-bit Quantization**: Fails quality thresholds; requires enhanced phase-aware techniques

### 11.4 Comparison with Reference Systems

| Feature | AURA-X | Suno | Moises | Temporal.io |
|---------|--------|------|--------|-------------|
| Multi-step reasoning | ✅ ReAct | ❌ Single-shot | ❌ Single-shot | ✅ Workflows |
| Tool orchestration | ✅ 8+ tools | ❌ Internal only | ✅ Stem separation | ✅ Activities |
| Self-improvement | ✅ JudgeAgent | ❌ | ❌ | ❌ |
| Durable execution | ✅ Checkpoints | ❌ | ❌ | ✅ Event sourcing |
| Ambient operation | ✅ Heartbeats | ❌ | ❌ | ✅ Schedules |
| Domain specialization | ✅ Amapiano | ✅ General music | ✅ Stem separation | ❌ Generic |

---

## 12. Conclusion

AURA-X represents a **Level 5 Autonomous Agent architecture** for music production, implementing the complete agent stack:

- **Model Layer**: LLM reasoning via Lovable AI Gateway with Chain-of-Thought
- **Tool Layer**: 8+ specialized audio processing and generation tools
- **Orchestration Layer**: ReAct loop, goal decomposition, durable state, ambient operation
- **Evaluation Layer**: Continuous JudgeAgent assessment with prompt refinement

The Temporal-inspired enhancements—durable workflows, signal bus communication, scheduled heartbeats, and LLM-as-Judge patterns—elevate AURA-X beyond workflow automation into true autonomous agent territory.

### Future Directions

1. **Enhanced 4-bit Quantization**: Achieve <25% FAD degradation through improved phase-aware techniques
2. **Learned Authenticity Weights**: Derive regional weights from user study data
3. **Local Voice Model**: Reduce ElevenLabs dependency with on-device synthesis
4. **Multi-Agent Scaling**: Support concurrent agent execution for complex productions
5. **Full Event Replay**: Complete implementation of workflow replay for debugging

---

## References

1. Wei, J., et al. (2022). "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." arXiv:2201.11903
2. Google. (2024). "Introduction to Agents." Kaggle Whitepaper Series
3. Google. (2024). "Agents Companion." Kaggle Whitepaper Series
4. Temporal Technologies. (2024). "Durable Execution Patterns"
5. Yao, S., et al. (2022). "ReAct: Synergizing Reasoning and Acting in Language Models." arXiv:2210.03629

---

## Appendix A: Code References

| Component | File Path |
|-----------|-----------|
| AutonomousAgent | `src/lib/agents/AutonomousAgent.ts` |
| ReActLoop | `src/lib/agents/ReActLoop.ts` |
| GoalDecomposer | `src/lib/agents/GoalDecomposer.ts` |
| ToolChainManager | `src/lib/agents/ToolChainManager.ts` |
| AmbientAgentOrchestrator | `src/lib/agents/AmbientAgentOrchestrator.ts` |
| AgentSignalBus | `src/lib/agents/AgentSignalBus.ts` |
| ScheduledAgentHeartbeat | `src/lib/agents/ScheduledAgentHeartbeat.ts` |
| JudgeAgent | `src/lib/agents/JudgeAgent.ts` |
| DurableAgentState | `src/lib/agents/DurableAgentState.ts` |
| LLMReasoningEngine | `src/lib/agents/LLMReasoningEngine.ts` |
| RealToolDefinitions | `src/lib/agents/RealToolDefinitions.ts` |

---

*Document Version: 1.0 | Last Updated: February 2025*
