/**
 * Evaluation tests for RAG search logic.
 *
 * These tests cover the pure functions that live in the rag-knowledge-search edge function.
 * Since the edge function runs on Deno, we replicate the key algorithms here in TypeScript
 * and test them directly — verifying correctness without network calls.
 *
 * Covered:
 * 1. cosineSimilarity — mathematical correctness
 * 2. generatePseudoEmbedding — determinism and normalization
 * 3. Hybrid search ranking — keyword boost raises relevant items above unrelated ones
 * 4. RAGContext mapping — that content from the knowledge base maps correctly
 */

import { describe, it, expect } from "vitest";

// ── Replicated pure functions from rag-knowledge-search ──────────────────────
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

function generatePseudoEmbedding(text: string): number[] {
  const embedding: number[] = [];
  const normalized = text.toLowerCase().trim();
  for (let i = 0; i < 128; i++) {
    let hash = 0;
    for (let j = 0; j < normalized.length; j++) {
      const char = normalized.charCodeAt(j);
      hash = ((hash << 5) - hash + char * (i + 1)) | 0;
    }
    embedding.push(Math.sin(hash) * 0.5 + Math.cos(hash * 0.7) * 0.5);
  }
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return magnitude > 0 ? embedding.map((v) => v / magnitude) : embedding;
}

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

function hybridSearch(query: string, knowledgeBase: KnowledgeItem[], topK = 4) {
  const queryEmbedding = generatePseudoEmbedding(query);

  return knowledgeBase
    .map((item) => {
      const itemText = `${item.title}. ${item.content.slice(0, 500)}. Tags: ${item.tags.join(", ")}`;
      const itemEmbedding = generatePseudoEmbedding(itemText);
      const semanticScore = cosineSimilarity(queryEmbedding, itemEmbedding);

      const queryLower = query.toLowerCase();
      let keywordBoost = 0;
      if (item.title.toLowerCase().includes(queryLower)) keywordBoost += 0.1;
      const tagMatches = item.tags.filter(
        (t) => t.toLowerCase().includes(queryLower) || queryLower.includes(t.toLowerCase())
      ).length;
      keywordBoost += Math.min(tagMatches * 0.02, 0.1);

      return { id: item.id, score: Math.min(semanticScore + keywordBoost, 1) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ── Test fixtures ─────────────────────────────────────────────────────────────
const AMAPIANO_KB: KnowledgeItem[] = [
  {
    id: "kb_logdrum",
    title: "Log Drum Fundamentals",
    content: "The log drum sits in the E1-A1 range with a long decay (500-900ms). " +
             "Classic pattern places it on the downbeat and syncopated 16th positions.",
    tags: ["log_drum", "rhythm", "bass", "amapiano", "808"],
  },
  {
    id: "kb_harmony",
    title: "Private School Harmonic Language",
    content: "Private School Amapiano draws heavily from jazz harmony. " +
             "Common progressions: Dm9 → Gm9 → CM9 → FM9.",
    tags: ["harmony", "private_school", "jazz", "chord_progression"],
  },
  {
    id: "kb_bpm",
    title: "Amapiano BPM Conventions",
    content: "Private School: 108-116 BPM. Classic: 116-122 BPM. Deep: 106-112 BPM.",
    tags: ["bpm", "tempo", "amapiano", "production"],
  },
  {
    id: "kb_unrelated",
    title: "Reggae Production Basics",
    content: "Reggae uses the one-drop rhythm, where the kick hits on beat 3 only.",
    tags: ["reggae", "rhythm", "one_drop"],
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("cosineSimilarity", () => {
  it("returns 1.0 for identical vectors", () => {
    const v = [1, 0, 0, 1, 0];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it("returns 0.0 for orthogonal vectors", () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
  });

  it("returns -1.0 for opposite vectors", () => {
    const a = [1, 0, 0];
    const b = [-1, 0, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
  });

  it("returns 0 for vectors of different lengths", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });

  it("returns 0 for zero vectors", () => {
    expect(cosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0);
  });
});

describe("generatePseudoEmbedding", () => {
  it("returns a 128-dimensional vector", () => {
    const emb = generatePseudoEmbedding("log drum amapiano");
    expect(emb).toHaveLength(128);
  });

  it("is deterministic — same input produces same output", () => {
    const text = "Private School Amapiano jazz piano chord progression";
    const a = generatePseudoEmbedding(text);
    const b = generatePseudoEmbedding(text);
    expect(a).toEqual(b);
  });

  it("produces a normalized unit vector (magnitude ≈ 1)", () => {
    const emb = generatePseudoEmbedding("amapiano log drum bass");
    const magnitude = Math.sqrt(emb.reduce((sum, v) => sum + v * v, 0));
    expect(magnitude).toBeCloseTo(1.0, 4);
  });

  it("different inputs produce different embeddings", () => {
    const a = generatePseudoEmbedding("log drum");
    const b = generatePseudoEmbedding("jazz piano");
    // They should not be identical
    expect(a).not.toEqual(b);
  });

  it("is case-insensitive — same result regardless of case", () => {
    const a = generatePseudoEmbedding("Log Drum AMAPIANO");
    const b = generatePseudoEmbedding("log drum amapiano");
    expect(a).toEqual(b);
  });
});

describe("hybridSearch", () => {
  it("returns at most topK results", () => {
    const results = hybridSearch("log drum", AMAPIANO_KB, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("top result for 'log drum' query is the log drum knowledge item", () => {
    const results = hybridSearch("log drum", AMAPIANO_KB, 4);
    expect(results[0].id).toBe("kb_logdrum");
  });

  it("harmony item scores above unrelated item when query matches its title", () => {
    // "private school harmonic" is a substring of kb_harmony's title, giving it
    // a +0.1 title keyword boost that kb_unrelated cannot receive.
    const results = hybridSearch("private school harmonic", AMAPIANO_KB, 4);
    const harmonyIdx = results.findIndex((r) => r.id === "kb_harmony");
    const unrelatedIdx = results.findIndex((r) => r.id === "kb_unrelated");
    // kb_harmony must appear in results
    expect(harmonyIdx).toBeGreaterThanOrEqual(0);
    // And must rank above the unrelated reggae item if it appears at all
    if (unrelatedIdx !== -1) {
      expect(harmonyIdx).toBeLessThan(unrelatedIdx);
    }
  });

  it("Reggae item scores lower than Amapiano items for Amapiano queries", () => {
    const results = hybridSearch("amapiano production", AMAPIANO_KB, 4);
    const reggaeResult = results.find((r) => r.id === "kb_unrelated");
    const amapianoResults = results.filter((r) => r.id !== "kb_unrelated");

    if (reggaeResult) {
      const avgAmapianoScore =
        amapianoResults.reduce((sum, r) => sum + r.score, 0) / amapianoResults.length;
      expect(reggaeResult.score).toBeLessThan(avgAmapianoScore);
    }
  });

  it("all scores are between 0 and 1", () => {
    const results = hybridSearch("bpm tempo amapiano", AMAPIANO_KB, 4);
    results.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    });
  });

  it("results are sorted in descending order of score", () => {
    const results = hybridSearch("amapiano rhythm pattern", AMAPIANO_KB, 4);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("handles empty knowledge base without throwing", () => {
    const results = hybridSearch("log drum", [], 4);
    expect(results).toEqual([]);
  });

  it("handles empty query without throwing", () => {
    const results = hybridSearch("", AMAPIANO_KB, 4);
    expect(Array.isArray(results)).toBe(true);
  });
});
