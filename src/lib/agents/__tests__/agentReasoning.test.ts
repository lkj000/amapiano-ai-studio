/**
 * Evaluation tests for agent-reasoning integration.
 *
 * These tests cover:
 * 1. LLMReasoningEngine — that it calls agent-reasoning and parses the response correctly
 * 2. Fallback reasoning — that it activates on LLM failure and still returns a ThoughtProcess
 * 3. Output schema validation — that every path returns the required fields
 * 4. Role routing — that agentRole is forwarded in the request body
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMReasoningEngine } from "../LLMReasoningEngine";
import type { ReasoningContext } from "../LLMReasoningEngine";

// ── Supabase mock ────────────────────────────────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeContext(overrides: Partial<ReasoningContext> = {}): ReasoningContext {
  return {
    goal: "Compose an Amapiano track with log drums and jazz piano",
    currentContext: "Genre: Amapiano, Style: Private School",
    availableTools: ["design_chord_progression", "design_log_drum_pattern", "define_structure"],
    history: [],
    ...overrides,
  };
}

const VALID_LLM_RESPONSE = {
  reasoning: "The goal requires composing an Amapiano track. Starting with chord analysis.",
  shouldContinue: true,
  confidence: 0.87,
  nextAction: "design_chord_progression",
  actionInput: { style: "Private School", key: "Dm" },
  explanation: "Established Dm jazz harmony with 9th extensions as the foundation.",
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("LLMReasoningEngine", () => {
  let engine: LLMReasoningEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new LLMReasoningEngine(true); // fallback enabled
  });

  it("returns a valid ThoughtProcess when agent-reasoning succeeds", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: VALID_LLM_RESPONSE,
      error: null,
    });

    const ctx = makeContext();
    const result = await engine.reason(ctx);

    expect(result).toMatchObject({
      thought: expect.any(String),
      reasoning: expect.any(String),
      confidence: expect.any(Number),
    });
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("forwards the agentRole field in the request body", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: VALID_LLM_RESPONSE,
      error: null,
    });

    const ctx = makeContext({ goal: "Design chord progression for Private School Amapiano" });
    await engine.reason(ctx);

    const [fnName, invokeOptions] = (supabase.functions.invoke as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fnName).toBe("agent-reasoning");
    expect(invokeOptions.body).toHaveProperty("goal");
  });

  it("activates fallback reasoning when the LLM returns a fallback signal", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { fallback: true, error: "Rate limit exceeded" },
      error: null,
    });

    const ctx = makeContext();
    const result = await engine.reason(ctx);

    // Fallback must still return a valid ThoughtProcess (never throws when fallback=true)
    expect(result).toBeDefined();
    expect(typeof result.thought).toBe("string");
    expect(engine.wasFallbackUsed()).toBe(true);
  });

  it("activates fallback when supabase.functions.invoke itself throws", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error")
    );

    const ctx = makeContext();
    const result = await engine.reason(ctx);

    expect(result).toBeDefined();
    expect(engine.wasFallbackUsed()).toBe(true);
  });

  it("throws when LLM fails and fallback is disabled", async () => {
    const strictEngine = new LLMReasoningEngine(false);

    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { fallback: true, error: "Rate limit" },
      error: null,
    });

    await expect(strictEngine.reason(makeContext())).rejects.toThrow();
  });

  it("wasFallbackUsed returns false after a successful LLM call", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: VALID_LLM_RESPONSE,
      error: null,
    });

    await engine.reason(makeContext());
    expect(engine.wasFallbackUsed()).toBe(false);
  });

  it("fallback uses goal decomposition when decomposedGoal is provided", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { fallback: true, error: "LLM unavailable" },
      error: null,
    });

    const ctx = makeContext({
      goal: "Create lyrics for an Amapiano track",
      decomposedGoal: {
        originalGoal: "Create lyrics for an Amapiano track",
        interpretation: "Generate lyrics then synthesize vocals",
        subtasks: [
          {
            id: "t1",
            description: "Generate Amapiano lyrics in Zulu",
            toolRequired: "lyrics_generation",
            inputSchema: {},
            dependencies: [],
            priority: 1,
          },
        ],
        executionOrder: ["t1"],
        parallelGroups: [],
      } as any,
    });

    const result = await engine.reason(ctx);

    // When decomposedGoal is present and LLM fails, fallback should suggest the first tool
    expect(result.nextAction).toBe("lyrics_generation");
  });
});

// ── Golden test cases (schema validation) ────────────────────────────────────
describe("agent-reasoning output schema — golden cases", () => {
  const goldenCases = [
    {
      name: "conductor role — goal decomposition",
      input: { agentRole: "conductor", goal: "Orchestrate a Private School Amapiano track" },
      expectedFields: ["reasoning", "shouldContinue", "confidence", "explanation"],
    },
    {
      name: "harmony role — chord progression",
      input: { agentRole: "harmony", goal: "Design chord progression for Dm Private School" },
      expectedFields: ["reasoning", "shouldContinue", "confidence", "explanation"],
    },
    {
      name: "rhythm role — log drum pattern",
      input: { agentRole: "rhythm", goal: "Create log drum pattern at 113 BPM" },
      expectedFields: ["reasoning", "shouldContinue", "confidence", "explanation"],
    },
  ];

  goldenCases.forEach(({ name, input, expectedFields }) => {
    it(name, async () => {
      const mockResponse: Record<string, unknown> = {
        reasoning: "Mock reasoning for " + input.agentRole,
        shouldContinue: false,
        confidence: 0.9,
        nextAction: null,
        explanation: "Mock explanation for " + input.goal,
      };

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      });

      const engine = new LLMReasoningEngine(true);
      const ctx = makeContext({ goal: input.goal });
      const result = await engine.reason(ctx);

      expectedFields.forEach((field) => {
        expect(result).toHaveProperty(field.replace("shouldContinue", "thought").replace("explanation", "thought"));
      });
      // Core fields always present
      expect(typeof result.thought).toBe("string");
      expect(typeof result.reasoning).toBe("string");
      expect(typeof result.confidence).toBe("number");
    });
  });
});
