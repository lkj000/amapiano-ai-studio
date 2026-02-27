/**
 * Tests for the AutonomousAgent class.
 *
 * These tests verify that:
 * 1. The agent initializes with idle status and 0 progress
 * 2. Status events are fired during execution
 * 3. Long-term memory is populated after execution
 * 4. maxIterations config is respected
 *
 * Mocking strategy:
 * - supabase is mocked to avoid real network calls
 * - GoalDecomposer.decompose is mocked to return a minimal single-subtask goal
 * - ReflectionSystem is mocked to prevent infinite loops
 * - ToolChainManager.executeChain is mocked to return a fast success result
 * - RealToolDefinitions dynamic import is mocked to avoid real tool loading
 *
 * Note: vi.mock factories are hoisted to the top of the file by Vitest's transform,
 * so all shared mock functions are defined using vi.hoisted() to ensure they are
 * initialized before the factory closures run.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── vi.hoisted: define shared mocks BEFORE vi.mock hoisting ──────────────────
const {
  mockDecompose,
  mockReason,
  mockReflect,
  mockGetHistory,
  mockExecuteChain,
} = vi.hoisted(() => {
  const mockDecompose = vi.fn().mockReturnValue({
    originalGoal: "compose amapiano track",
    interpretation: "Compose an Amapiano track",
    subtasks: [
      {
        id: "task-1",
        name: "Generate Content",
        description: "Create content",
        toolRequired: "lyrics_generation",
        inputSchema: {},
        dependencies: [],
        priority: 1,
        estimatedDuration: 1000,
        status: "pending",
      },
    ],
    executionOrder: ["task-1"],
    estimatedTotalDuration: 1000,
    complexity: "simple",
  });

  const mockReason = vi.fn().mockResolvedValue({
    thought: "I should complete the task",
    reasoning: "Task is straightforward",
    confidence: 0.9,
    nextAction: null,
  });

  const mockReflect = vi.fn().mockReturnValue({
    assessment: "success",
    confidence: 0.9,
    insights: ["Completed successfully"],
    shouldRetry: false,
    shouldProceed: false,
    learnings: [],
  });

  const mockGetHistory = vi.fn().mockReturnValue({
    reflections: [],
    learnings: [],
    successRate: 0,
    commonFailures: new Map(),
  });

  const mockExecuteChain = vi.fn().mockResolvedValue({
    success: true,
    outputs: { "task-1": { text: "Generated lyrics" } },
    errors: {},
    executionTime: 100,
    tasksCompleted: 1,
    totalTasks: 1,
    reflections: [],
  });

  return {
    mockDecompose,
    mockReason,
    mockReflect,
    mockGetHistory,
    mockExecuteChain,
  };
});

// ── Supabase mock ─────────────────────────────────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: "test-user-agent" } } })
      ),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// ── GoalDecomposer mock ───────────────────────────────────────────────────────
vi.mock("@/lib/agents/GoalDecomposer", () => ({
  GoalDecomposer: vi.fn(function (this: any) {
    this.decompose = mockDecompose;
  }),
}));

// ── ReflectionSystem mock ─────────────────────────────────────────────────────
vi.mock("@/lib/agents/ReflectionSystem", () => ({
  ReflectionSystem: vi.fn(function (this: any) {
    this.reflect = mockReflect;
    this.getHistory = mockGetHistory;
  }),
}));

// ── ToolChainManager mock ─────────────────────────────────────────────────────
vi.mock("@/lib/agents/ToolChainManager", () => ({
  ToolChainManager: vi.fn(function (this: any) {
    this.getAvailableTools = vi.fn().mockReturnValue(["lyrics_generation"]);
    this.registerTools = vi.fn();
    this.executeChain = mockExecuteChain;
  }),
}));

// ── LLMReasoningEngine mock ───────────────────────────────────────────────────
vi.mock("@/lib/agents/LLMReasoningEngine", () => ({
  getLLMReasoningEngine: vi.fn().mockReturnValue({
    reason: mockReason,
    wasFallbackUsed: vi.fn().mockReturnValue(false),
    getLastError: vi.fn().mockReturnValue(null),
  }),
  LLMReasoningEngine: vi.fn(function (this: any) {}),
}));

// ── NeuralReflectionSystem mock ───────────────────────────────────────────────
vi.mock("@/lib/ml/NeuralReflectionSystem", () => ({
  NeuralReflectionSystem: vi.fn(function (this: any) {
    this.reflect = vi.fn().mockReturnValue({
      assessment: "success",
      confidence: 0.9,
      insights: ["Neural assessment successful"],
      shouldRetry: false,
      shouldProceed: false,
      learnings: [],
    });
  }),
}));

// ── RealToolDefinitions dynamic import mock ───────────────────────────────────
vi.mock("@/lib/agents/RealToolDefinitions", () => ({
  getAllRealTools: vi.fn().mockReturnValue([]),
  getRealToolByName: vi.fn().mockReturnValue(null),
}));

import { AutonomousAgent } from "../AutonomousAgent";

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("AutonomousAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish default mock implementations after clearAllMocks
    mockDecompose.mockReturnValue({
      originalGoal: "compose amapiano track",
      interpretation: "Compose an Amapiano track",
      subtasks: [
        {
          id: "task-1",
          name: "Generate Content",
          description: "Create content",
          toolRequired: "lyrics_generation",
          inputSchema: {},
          dependencies: [],
          priority: 1,
          estimatedDuration: 1000,
          status: "pending",
        },
      ],
      executionOrder: ["task-1"],
      estimatedTotalDuration: 1000,
      complexity: "simple",
    });

    mockReason.mockResolvedValue({
      thought: "I should complete the task",
      reasoning: "Task is straightforward",
      confidence: 0.9,
      nextAction: null,
    });

    mockReflect.mockReturnValue({
      assessment: "success",
      confidence: 0.9,
      insights: ["Completed successfully"],
      shouldRetry: false,
      shouldProceed: false,
      learnings: [],
    });

    mockGetHistory.mockReturnValue({
      reflections: [],
      learnings: [],
      successRate: 0,
      commonFailures: new Map(),
    });

    mockExecuteChain.mockResolvedValue({
      success: true,
      outputs: { "task-1": { text: "Generated lyrics" } },
      errors: {},
      executionTime: 100,
      tasksCompleted: 1,
      totalTasks: 1,
      reflections: [],
    });
  });

  it("initializes with idle status", () => {
    const agent = new AutonomousAgent();
    const status = agent.getStatus();
    expect(status.state).toBe("idle");
    expect(status.progress).toBe(0);
  });

  it("fires status events during execution", async () => {
    const agent = new AutonomousAgent({ maxIterations: 2 });
    const events: string[] = [];
    agent.addEventListener((event) => events.push(event.type));

    await agent.execute("compose amapiano track");

    expect(events).toContain("status");
  });

  it("stores learnings in long-term memory after execution", async () => {
    const agent = new AutonomousAgent({
      maxIterations: 1,
      reflectionEnabled: false,
    });

    await agent.execute("compose amapiano track");

    const memory = agent.getMemory();
    expect(memory.longTerm.length).toBeGreaterThan(0);
  });

  it("respects maxIterations config", async () => {
    // Override mockReason to always return a nextAction (non-completing) so
    // the loop would run forever if maxIterations wasn't respected.
    let callCount = 0;
    mockReason.mockImplementation(async () => {
      callCount++;
      return {
        thought: "still going",
        reasoning: "continue",
        confidence: 0.5,
        nextAction: "unknown_tool",
      };
    });

    const maxIter = 2;
    const agent = new AutonomousAgent({
      maxIterations: maxIter,
      reflectionEnabled: false,
    });

    const result = await agent.execute("compose amapiano track");

    // The agent should have completed without running more than maxIterations steps
    expect(result).toBeDefined();
    // callCount should not exceed maxIterations significantly (ReActLoop caps at maxSteps)
    expect(callCount).toBeLessThanOrEqual(maxIter + 1);
  });

  it("returns success=false on error and fires an error event", async () => {
    // Make decompose throw to simulate a fatal error during execution
    mockDecompose.mockImplementationOnce(() => {
      throw new Error("Decomposition failed");
    });

    const agent = new AutonomousAgent({ maxIterations: 1 });
    const events: string[] = [];
    agent.addEventListener((e) => events.push(e.type));

    const result = await agent.execute("failing goal");

    expect(result.success).toBe(false);
    expect(events).toContain("error");
  });

  it("exposes getMemory with correct shape", () => {
    const agent = new AutonomousAgent();
    const memory = agent.getMemory();
    expect(memory).toHaveProperty("shortTerm");
    expect(memory).toHaveProperty("longTerm");
    expect(memory).toHaveProperty("workingContext");
    expect(Array.isArray(memory.longTerm)).toBe(true);
  });

  it("isReady returns true after tools are registered", async () => {
    const agent = new AutonomousAgent();
    await agent.waitForTools();
    expect(agent.isReady()).toBe(true);
  });
});
