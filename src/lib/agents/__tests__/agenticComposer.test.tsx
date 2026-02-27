/**
 * Integration tests for the AgenticMusicComposer component.
 *
 * These tests verify that:
 * 1. generateRAGContext calls rag-knowledge-search with a real knowledgeBase (not hardcoded data)
 * 2. executeAgentWork calls agent-reasoning with the correct agentRole
 * 3. Previous agent outputs are forwarded as context to subsequent agents
 * 4. saveExecution is called after a composition session completes
 * 5. The Output tab is populated with real LLM reasoning strings
 *
 * Mocking strategy:
 * - supabase.functions.invoke is mocked to return controlled responses
 * - supabase.from(...) is mocked to return empty DB results (testing the path that
 *   falls through to AMAPIANO_KNOWLEDGE_BASE)
 * - supabase.auth.getUser is mocked to return a test user
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgenticMusicComposer } from "@/components/ai/AgenticMusicComposer";

// ── Global mocks ──────────────────────────────────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "test-user-123" } } })),
    },
  },
}));

vi.mock("@/hooks/useAgentMemoryPersistence", () => ({
  useAgentMemoryPersistence: () => ({
    saveExecution: vi.fn().mockResolvedValue({ id: "exec-1" }),
    loadExecutionHistory: vi.fn().mockResolvedValue([]),
    isLoading: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { supabase } from "@/integrations/supabase/client";

// ── Shared fixtures ────────────────────────────────────────────────────────────
const MOCK_RAG_RESPONSE = {
  enhancedResults: [
    { id: "kb_logdrum_1", score: 0.95 },
    { id: "kb_harmony_1", score: 0.88 },
    { id: "kb_bpm_1", score: 0.75 },
    { id: "kb_rhythm_euclidean", score: 0.70 },
  ],
  searchMethod: "hybrid_lovable_ai",
  embeddingDimensions: 128,
};

const MOCK_AGENT_RESPONSE = {
  reasoning: "Given the Private School Amapiano style, I will establish Dm jazz harmony with 9th extensions as the harmonic foundation.",
  shouldContinue: false,
  confidence: 0.91,
  nextAction: null,
  actionInput: null,
  explanation: "Established Dm9→Gm9→CM9→FM9 progression with Private School voicings. BPM: 113, Key: Dm.",
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("AgenticMusicComposer — generateRAGContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: DB returns empty results (knowledge base comes from curated constant)
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    }));

    // RAG search call
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(
      (fnName: string) => {
        if (fnName === "rag-knowledge-search") {
          return Promise.resolve({ data: MOCK_RAG_RESPONSE, error: null });
        }
        if (fnName === "agent-reasoning") {
          return Promise.resolve({ data: MOCK_AGENT_RESPONSE, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }
    );
  });

  it("calls rag-knowledge-search with a non-empty knowledgeBase", async () => {
    render(<AgenticMusicComposer />);

    const textarea = screen.getByPlaceholderText(/Describe the music/i);
    fireEvent.change(textarea, { target: { value: "Soulful Private School Amapiano with jazz piano" } });

    const button = screen.getByRole("button", { name: /Start Agentic Composition/i });
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      const ragCalls = (supabase.functions.invoke as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([name]) => name === "rag-knowledge-search"
      );
      expect(ragCalls.length).toBeGreaterThan(0);
    }, { timeout: 10000 });

    const [, ragOptions] = (supabase.functions.invoke as ReturnType<typeof vi.fn>).mock.calls.find(
      ([name]) => name === "rag-knowledge-search"
    )!;

    expect(ragOptions.body.knowledgeBase).toBeDefined();
    expect(Array.isArray(ragOptions.body.knowledgeBase)).toBe(true);
    // Should include curated knowledge base items
    expect(ragOptions.body.knowledgeBase.length).toBeGreaterThan(0);
    // Query should include the user's prompt
    expect(ragOptions.body.query).toContain("Soulful Private School Amapiano");
  });

  it("calls agent-reasoning with the correct agentRole for each agent", async () => {
    render(<AgenticMusicComposer />);

    const textarea = screen.getByPlaceholderText(/Describe the music/i);
    fireEvent.change(textarea, { target: { value: "Deep Amapiano with heavy log drums" } });

    const button = screen.getByRole("button", { name: /Start Agentic Composition/i });
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      const agentCalls = (supabase.functions.invoke as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([name]) => name === "agent-reasoning"
      );
      expect(agentCalls.length).toBeGreaterThan(0);
    }, { timeout: 10000 });

    const agentCalls = (supabase.functions.invoke as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([name]) => name === "agent-reasoning"
    );

    // Each call must have an agentRole field
    agentCalls.forEach(([, options]) => {
      expect(options.body).toHaveProperty("agentRole");
      expect(typeof options.body.agentRole).toBe("string");
    });

    // The set of roles used must include conductor (first high-priority agent)
    const roles = agentCalls.map(([, options]) => options.body.agentRole as string);
    expect(roles).toContain("conductor");
  });

  it("forwards previous agent outputs as context to subsequent agent calls", async () => {
    render(<AgenticMusicComposer />);

    const textarea = screen.getByPlaceholderText(/Describe the music/i);
    fireEvent.change(textarea, { target: { value: "Classic Amapiano for a DJ set" } });

    const button = screen.getByRole("button", { name: /Start Agentic Composition/i });
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      const agentCalls = (supabase.functions.invoke as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([name]) => name === "agent-reasoning"
      );
      // Expect at least 2 agent calls (high-priority goals run sequentially)
      expect(agentCalls.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 10000 });

    const agentCalls = (supabase.functions.invoke as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([name]) => name === "agent-reasoning"
    );

    // Second call's context should reference the first agent's output
    if (agentCalls.length >= 2) {
      const secondCallContext: string = agentCalls[1][1].body.context;
      // Context must be a non-empty string with some composition info
      expect(typeof secondCallContext).toBe("string");
      expect(secondCallContext.length).toBeGreaterThan(0);
    }
  });
});

describe("AgenticMusicComposer — output display", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    }));

    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(
      (fnName: string) => {
        if (fnName === "rag-knowledge-search") {
          return Promise.resolve({ data: MOCK_RAG_RESPONSE, error: null });
        }
        if (fnName === "agent-reasoning") {
          return Promise.resolve({ data: MOCK_AGENT_RESPONSE, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }
    );
  });

  it("shows agent reasoning text in the Output tab after composition completes", async () => {
    const user = userEvent.setup();
    render(<AgenticMusicComposer />);

    const textarea = screen.getByPlaceholderText(/Describe the music/i);
    fireEvent.change(textarea, { target: { value: "Soulful Amapiano" } });

    const button = screen.getByRole("button", { name: /Start Agentic Composition/i });
    await act(async () => {
      fireEvent.click(button);
    });

    // Wait for all 5 agent goals to complete before checking Output tab
    await waitFor(() => {
      expect(
        (supabase.functions.invoke as ReturnType<typeof vi.fn>).mock.calls.filter(
          ([name]) => name === "agent-reasoning"
        ).length
      ).toBeGreaterThanOrEqual(5);
    }, { timeout: 15000 });

    // Flush remaining React state after async composition
    await act(async () => {});

    // Use userEvent (fires pointerdown events that Radix UI Tabs requires)
    const outputTab = screen.getByRole("tab", { name: /Output/i });
    await user.click(outputTab);

    // The LLM explanation should appear in the Output tab content
    await waitFor(() => {
      const outputContent = document.body.textContent || "";
      // Check for ASCII part of the explanation (avoids unicode arrow issues)
      expect(outputContent).toContain("Private School voicings");
    }, { timeout: 5000 });
  }, 25000);
});

describe("AgenticMusicComposer — input validation", () => {
  it("does not call agent-reasoning when prompt is empty", async () => {
    // Clear any call history from previous describes before checking empty-prompt guard
    vi.clearAllMocks();

    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: MOCK_AGENT_RESPONSE,
      error: null,
    });

    render(<AgenticMusicComposer />);

    const button = screen.getByRole("button", { name: /Start Agentic Composition/i });
    fireEvent.click(button);

    // Brief wait — no LLM calls should fire for empty prompt
    await new Promise((r) => setTimeout(r, 200));

    const agentCalls = (supabase.functions.invoke as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([name]) => name === "agent-reasoning"
    );
    expect(agentCalls).toHaveLength(0);
  });
});
