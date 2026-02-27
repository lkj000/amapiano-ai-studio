/**
 * Tests for the ReActLoop class.
 *
 * These tests verify that:
 * 1. The loop starts with isComplete=false and 0 steps
 * 2. The loop completes when nextAction is null
 * 3. Registered tools are called when nextAction matches
 * 4. maxSteps is respected even if completion never fires
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReActLoop } from "../ReActLoop";

describe("ReActLoop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with isComplete=false and 0 steps", () => {
    const loop = new ReActLoop(
      "compose music",
      new Map(),
      async (_ctx) => ({
        thought: "thinking",
        reasoning: "test",
        confidence: 0.9,
        nextAction: null,
      }),
      5
    );
    const state = loop.getState();
    expect(state.isComplete).toBe(false);
    expect(state.totalSteps).toBe(0);
    expect(state.goal).toBe("compose music");
  });

  it("completes when nextAction is null", async () => {
    const loop = new ReActLoop(
      "finish task",
      new Map(),
      async () => ({
        thought: "done",
        reasoning: "complete",
        confidence: 1.0,
        nextAction: null,
      }),
      5
    );
    const result = await loop.run();
    expect(result.isComplete).toBe(true);
  });

  it("calls the correct tool when nextAction matches a registered tool", async () => {
    const toolCalled = vi.fn().mockResolvedValue({ output: "tool result" });
    let callCount = 0;

    const loop = new ReActLoop(
      "use tool",
      new Map([["analyze_audio", toolCalled]]),
      async () => {
        callCount++;
        return {
          thought: "using tool",
          reasoning: "need analysis",
          confidence: 0.8,
          nextAction: callCount === 1 ? "analyze_audio" : null,
        };
      },
      5
    );

    await loop.run();
    expect(toolCalled).toHaveBeenCalledOnce();
  });

  it("stops at maxSteps even if not complete", async () => {
    const loop = new ReActLoop(
      "infinite loop",
      new Map(),
      async () => ({
        thought: "still going",
        reasoning: "continue",
        confidence: 0.5,
        nextAction: "unknown_tool",
      }),
      3
    );
    const result = await loop.run();
    expect(result.totalSteps).toBeLessThanOrEqual(3);
  });

  it("records thoughts in state during run", async () => {
    let step = 0;
    const loop = new ReActLoop(
      "record thoughts",
      new Map(),
      async () => {
        step++;
        return {
          thought: `thought-${step}`,
          reasoning: "reasoning",
          confidence: 0.7,
          nextAction: step < 2 ? "missing_tool" : null,
        };
      },
      5
    );

    await loop.run();
    const state = loop.getState();
    expect(state.thoughts.length).toBeGreaterThan(0);
    expect(state.thoughts[0].thought).toBe("thought-1");
  });

  it("marks state as complete when a 'complete' tool is used", async () => {
    const completeTool = vi
      .fn()
      .mockResolvedValue({ complete: true, summary: "done" });
    let called = false;

    const loop = new ReActLoop(
      "finish with complete tool",
      new Map([["complete", completeTool]]),
      async () => {
        const action = called ? null : "complete";
        called = true;
        return {
          thought: "finishing",
          reasoning: "use complete tool",
          confidence: 1.0,
          nextAction: action,
        };
      },
      5
    );

    const result = await loop.run();
    expect(result.isComplete).toBe(true);
    expect(completeTool).toHaveBeenCalledOnce();
  });

  it("handles tool errors gracefully without throwing", async () => {
    const failingTool = vi.fn().mockRejectedValue(new Error("Tool exploded"));
    let callCount = 0;

    const loop = new ReActLoop(
      "handle errors",
      new Map([["broken_tool", failingTool]]),
      async () => {
        callCount++;
        return {
          thought: "trying tool",
          reasoning: "test error handling",
          confidence: 0.6,
          nextAction: callCount === 1 ? "broken_tool" : null,
        };
      },
      5
    );

    // Should not throw
    const result = await loop.run();
    expect(result).toBeDefined();
    // The failed action should be recorded
    const failedActions = result.actions.filter((a) => !a.success);
    expect(failedActions.length).toBeGreaterThan(0);
  });

  it("tool not found results in a failed observation (not a throw)", async () => {
    // When the tool is not found, act() returns a failure result (but does NOT push
    // it to state.actions). The observation is still recorded and shouldContinue
    // reflects the missing-tool failure. The loop must not throw.
    const loop = new ReActLoop(
      "use nonexistent tool",
      new Map(), // empty tool registry
      async (_ctx) => {
        const ctx = JSON.parse(_ctx);
        return {
          thought: "trying nonexistent",
          reasoning: "test",
          confidence: 0.5,
          // step is already incremented before think(), so it starts at 1
          nextAction: ctx.step <= 1 ? "nonexistent_tool" : null,
        };
      },
      3
    );

    const result = await loop.run();
    // Should not throw; loop completes within maxSteps
    expect(result.totalSteps).toBeGreaterThan(0);
    expect(result.totalSteps).toBeLessThanOrEqual(3);
    // At least one observation should mention the missing tool
    const failObservations = result.observations.filter((o) =>
      o.interpretation.includes("nonexistent_tool")
    );
    expect(failObservations.length).toBeGreaterThan(0);
  });

  it("maxSteps=1 allows exactly 1 step before stopping", async () => {
    const loop = new ReActLoop(
      "single step",
      new Map(),
      async () => ({
        thought: "one step",
        reasoning: "keep going",
        confidence: 0.5,
        nextAction: "unknown_tool",
      }),
      1
    );

    const result = await loop.run();
    expect(result.totalSteps).toBe(1);
  });
});
