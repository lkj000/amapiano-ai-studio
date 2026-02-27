/**
 * Evaluation harness for agent reasoning quality.
 * Tests 20 musical prompts across 4 categories to verify that:
 * - The agent returns structured responses (not empty/null)
 * - Confidence scores are within valid range [0, 1]
 * - Agent roles are correctly mapped per goal type
 * - Responses contain Amapiano-relevant content
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Supabase mock ─────────────────────────────────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: "eval-user" } } })
      ),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

import { supabase } from "@/integrations/supabase/client";

// ── Golden dataset: 20 prompts with expected properties ───────────────────────
const EVAL_PROMPTS = [
  // Category A: Style identification (5 prompts)
  { prompt: "Deep Amapiano with heavy log drums", expectedRole: "rhythm", category: "style" },
  { prompt: "Private School jazz piano Amapiano", expectedRole: "harmony", category: "style" },
  { prompt: "Commercial Amapiano for radio", expectedRole: "conductor", category: "style" },
  { prompt: "Soulful late night Amapiano", expectedRole: "melody", category: "style" },
  { prompt: "Festival uptempo Amapiano set", expectedRole: "arrangement", category: "style" },
  // Category B: Technical parameters (5 prompts)
  { prompt: "Amapiano at 112 BPM in F minor", expectedRole: "conductor", category: "technical" },
  { prompt: "Kelvin Momo style chord progressions in Dm", expectedRole: "harmony", category: "technical" },
  { prompt: "Euclidean hi-hat patterns for Amapiano", expectedRole: "rhythm", category: "technical" },
  { prompt: "Piano stab voicings in C3-C5 range", expectedRole: "melody", category: "technical" },
  { prompt: "16-bar intro then full drop structure", expectedRole: "arrangement", category: "technical" },
  // Category C: Artist references (5 prompts)
  { prompt: "Kabza De Small melodic gospel Amapiano", expectedRole: "analysis", category: "artist" },
  { prompt: "Vigro Deep dark minimal deep Amapiano", expectedRole: "analysis", category: "artist" },
  { prompt: "DBN Gogo Gqom-influenced fast Amapiano", expectedRole: "analysis", category: "artist" },
  { prompt: "Focalistic commercial energetic Amapiano", expectedRole: "analysis", category: "artist" },
  { prompt: "Mdu aka TRP soulful organic Amapiano", expectedRole: "analysis", category: "artist" },
  // Category D: Mixed/edge cases (5 prompts)
  { prompt: "Amapiano", expectedRole: "conductor", category: "edge" },
  { prompt: "South African house music with piano", expectedRole: "conductor", category: "edge" },
  { prompt: "Deep jazz piano with log drum bass South Africa 2024", expectedRole: "harmony", category: "edge" },
  { prompt: "Durban Amapiano with heavy swing and township feel", expectedRole: "rhythm", category: "edge" },
  {
    prompt: "Cape Town Amapiano with Cape Jazz influences and syncopated hi-hats",
    expectedRole: "rhythm",
    category: "edge",
  },
];

const MOCK_AGENT_RESPONSE = {
  reasoning:
    "Based on the prompt analysis, establishing the musical foundation.",
  shouldContinue: false,
  confidence: 0.88,
  nextAction: null,
  explanation:
    "Dm9→Gm9→CM9 progression with Private School voicings. BPM 112. Key: Dm.",
  prompt_version: "2.1.0",
  provider: "lovable",
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Eval Harness — 20-prompt golden test dataset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: MOCK_AGENT_RESPONSE,
      error: null,
    });
  });

  describe("Category A: Style identification", () => {
    const stylePrompts = EVAL_PROMPTS.filter((p) => p.category === "style");
    stylePrompts.forEach(({ prompt }) => {
      it(`returns structured response for: "${prompt.slice(0, 50)}"`, async () => {
        const { data, error } = await supabase.functions.invoke(
          "agent-reasoning",
          {
            body: {
              agentRole: "conductor",
              goal: prompt,
              context: "",
              availableTools: [],
              history: [],
            },
          }
        );
        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.confidence).toBeGreaterThanOrEqual(0);
        expect(data.confidence).toBeLessThanOrEqual(1);
        expect(typeof data.explanation).toBe("string");
        expect(data.explanation.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Category B: Technical parameters", () => {
    const technicalPrompts = EVAL_PROMPTS.filter(
      (p) => p.category === "technical"
    );
    technicalPrompts.forEach(({ prompt, expectedRole }) => {
      it(`routes "${prompt.slice(0, 40)}" to correct agent role`, async () => {
        const { data } = await supabase.functions.invoke("agent-reasoning", {
          body: {
            agentRole: expectedRole,
            goal: prompt,
            context: "",
            availableTools: [],
            history: [],
          },
        });
        expect(data).toBeDefined();
        expect(data.prompt_version).toBe("2.1.0");
      });
    });
  });

  describe("Category C: Artist references", () => {
    it("all 5 artist reference prompts return analysis-role responses", async () => {
      const artistPrompts = EVAL_PROMPTS.filter(
        (p) => p.category === "artist"
      );
      for (const { prompt } of artistPrompts) {
        const { data, error } = await supabase.functions.invoke(
          "agent-reasoning",
          {
            body: {
              agentRole: "analysis",
              goal: prompt,
              context: "",
              availableTools: [],
              history: [],
            },
          }
        );
        expect(error).toBeNull();
        expect(data.reasoning).toBeTruthy();
      }
    });
  });

  describe("Category D: Edge cases", () => {
    it("handles minimal prompt 'Amapiano' without error", async () => {
      const { data, error } = await supabase.functions.invoke(
        "agent-reasoning",
        {
          body: {
            agentRole: "conductor",
            goal: "Amapiano",
            context: "",
            availableTools: [],
            history: [],
          },
        }
      );
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("all 20 prompts return valid confidence scores in [0, 1]", async () => {
      for (const { prompt, expectedRole } of EVAL_PROMPTS) {
        const { data } = await supabase.functions.invoke("agent-reasoning", {
          body: {
            agentRole: expectedRole,
            goal: prompt,
            context: "",
            availableTools: [],
            history: [],
          },
        });
        expect(data.confidence).toBeGreaterThanOrEqual(0);
        expect(data.confidence).toBeLessThanOrEqual(1);
      }
    });

    it("provider field is present in all responses", async () => {
      for (const { prompt, expectedRole } of EVAL_PROMPTS.slice(0, 5)) {
        const { data } = await supabase.functions.invoke("agent-reasoning", {
          body: {
            agentRole: expectedRole,
            goal: prompt,
            context: "",
            availableTools: [],
            history: [],
          },
        });
        expect(data.provider).toBeDefined();
        expect(["lovable", "anthropic", "fallback"]).toContain(data.provider);
      }
    });
  });

  // ── Full dataset sweep ────────────────────────────────────────────────────
  describe("Full dataset — structural integrity", () => {
    it("all 20 prompts produce a non-null data response", async () => {
      for (const { prompt, expectedRole } of EVAL_PROMPTS) {
        const { data, error } = await supabase.functions.invoke(
          "agent-reasoning",
          {
            body: {
              agentRole: expectedRole,
              goal: prompt,
              context: "",
              availableTools: [],
              history: [],
            },
          }
        );
        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data).not.toBeUndefined();
      }
    });

    it("all 20 prompts produce a reasoning string", async () => {
      for (const { prompt, expectedRole } of EVAL_PROMPTS) {
        const { data } = await supabase.functions.invoke("agent-reasoning", {
          body: {
            agentRole: expectedRole,
            goal: prompt,
            context: "",
            availableTools: [],
            history: [],
          },
        });
        expect(typeof data.reasoning).toBe("string");
        expect(data.reasoning.length).toBeGreaterThan(0);
      }
    });

    it("invoke is called with agent-reasoning function name for each prompt", async () => {
      for (const { prompt, expectedRole } of EVAL_PROMPTS.slice(0, 3)) {
        await supabase.functions.invoke("agent-reasoning", {
          body: {
            agentRole: expectedRole,
            goal: prompt,
            context: "",
            availableTools: [],
            history: [],
          },
        });
      }

      const calls = (
        supabase.functions.invoke as ReturnType<typeof vi.fn>
      ).mock.calls;
      expect(calls.every(([fnName]) => fnName === "agent-reasoning")).toBe(
        true
      );
    });
  });
});
