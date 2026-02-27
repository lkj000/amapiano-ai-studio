# Amapiano AI Studio — 11-Phase AI Agent Production Framework
### Side-by-Side with Steve Nouri's Enterprise Roadmap to AI Agents

> Generated: 2026-02-27 | Commit: `032a9ab`

---

## Recommended Build Order — Where We Stand

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  V3: Production-Ready (Scale)
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░  V2: Reliability (1–3 Weeks) — ~80% complete
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  V1: The Foundation — complete
```

Overall agent maturity: **V2+ / Early V3**. Foundation and reliability layers are solid.
Production-readiness (monitoring at scale, staging, security hardening) is the outstanding gap.

---

## Phase-by-Phase Comparison

---

### Phase 1 · Define Purpose & Scope

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | One-page spec: use cases, success metrics, constraints | `docs/PRD.md` + `docs/APP_OVERVIEW.md` |
| **Use cases** | Specific jobs and user types | 5 user personas (producer 35%, educator 20%, creator 15%, preservationist 5%) |
| **Success metrics** | Defined KPIs | MAU 50K target, 15% paid conversion, CAC < $30, per-feature acceptance criteria |
| **Constraints** | Technical + business constraints documented | Browser/WebAudio limits, cultural authenticity requirements, subscription tier gating |
| **Status** | ✅ Required | ⚠️ **Partial** |

**Gap:** No dedicated *agent* scope document. The PRD covers the product; the agent subsystem has no standalone mission spec (separate from `docs/AURA_X_AGENT_WHITEPAPER.md`). The `feature_flags` table is referenced in code but never created in migrations — all feature flags return hardcoded `true`.

**Action:** Write `docs/AGENT_SCOPE.md` — define the agent system's purpose, success criteria (task completion rate, latency P95, fallback frequency), and failure modes. Create the `feature_flags` DB table.

---

### Phase 2 · Design Behavior & Prompting

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | System prompt v1, tool policy doc, example interactions | `getRoleSystemPrompt()` in `agent-reasoning/index.ts` |
| **System prompt** | Role-specific operational instructions | 7 role-specific prompts: conductor, harmony, rhythm, melody, arrangement, analysis, rag |
| **Tool usage policy** | Which tools the agent may/must/must not use | `subGoals[]` array passed per agent call; no explicit prohibition policy |
| **Output schema** | Structured JSON output enforced | `{ reasoning, shouldContinue, confidence, nextAction, actionInput, explanation }` — strict schema enforced |
| **Example interactions** | Golden examples in prompt | Domain knowledge baked into each role prompt (BPM ranges, chord voicings, rhythm patterns) |
| **Status** | ✅ Required | ✅ **Real — the strongest phase** |

**Strengths:** Role-specific system prompts carry genuine Amapiano domain knowledge. Output schema is enforced with JSON parse + fallback. The `AgenticMusicComposer.tsx` curated `AMAPIANO_KNOWLEDGE_BASE` constant (10 expert knowledge items) supplements prompts at call time.

**Gap:** No prompt versioning. If a prompt is updated, there is no way to audit which version produced which output. Previous executions in `agent_executions` table do not record the prompt version used.

**Action:** Add a `prompt_version` field to `agent_executions` inserts. Tag each `getRoleSystemPrompt()` with a semver string returned alongside the prompt text.

---

### Phase 3 · LLM Strategy

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | Model selection doc + routing rules | Single model, no routing doc |
| **Model selection** | Match task type to model strengths | `google/gemini-2.5-flash` for all tasks via Lovable AI gateway |
| **Routing rules** | Route by task complexity, cost, latency | No routing — all agent calls go to the same model |
| **Fallback models** | Provider/model fallback chain | Rule-based `fallbackReasoning()` in `LLMReasoningEngine.ts` (keyword matching, not a secondary LLM) |
| **Temperature strategy** | Task-specific temperature | 0.3 fixed for all agent calls (reasoning); not differentiated by task |
| **Status** | ✅ Required | ⚠️ **Partial** |

**What's real:** `LLMReasoningEngine.fallbackReasoning()` (lines 97–159) activates on rate limit (HTTP 429), payment required (402), or `{ fallback: true }` signal. It uses decomposed goal subtasks to select a deterministic next action — not random, not placeholder.

**Gap:** Single model strategy. No routing to a cheaper model for low-complexity tasks. No Anthropic/OpenAI provider fallback if Lovable AI gateway is down. The `useModelAnalytics.ts` hook exists but is not wired to model selection logic.

**Action:** Add provider fallback chain: Lovable (Gemini 2.5 Flash) → OpenAI GPT-4o-mini → rule-based fallback. Add routing: use a smaller/cheaper call for RAG-type queries; reserve Gemini for conductor + harmony roles.

---

### Phase 4 · Tooling & Integrations

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | Tool registry + authentication/security map | `RealToolDefinitions.ts` — 12 registered tools |
| **Tool registry** | Structured interfaces for knowledge, action, computation | `getAllRealTools()` returns `ToolDefinition[]` with `name`, `description`, `parameters`, `execute()` |
| **Authentication** | API keys, OAuth, service accounts per tool | Supabase anon key + service role key; ElevenLabs API key; Modal API key; Temporal API key |
| **Status** | ✅ Required | ⚠️ **Partial** |

**Tool inventory (12 tools):**

| Tool | Status | Backing |
|---|---|---|
| `stem_separation` | ✅ Real | Modal → Demucs `htdemucs_6s` GPU |
| `voice_synthesis` | ✅ Real | `generate-song-with-vocals` → ElevenLabs Music API |
| `lyrics_generation` | ✅ Real | `ai-chat` edge function → Gemini |
| `audio_analysis` | ✅ Real | Modal → Librosa CPU |
| `audio_quantization` | ✅ Real | Modal → real SNR/noise measurement |
| `export_stems` | ✅ Real | `zip-stems` edge function |
| `layer_generation` | ✅ Real | `generate-layer` edge function |
| `amapianorization` | ⚠️ Partial | Local `audioProcessor` (no GPU path) |
| `ai_mastering` | ⚠️ Partial | LUFS measurement real; DSP chain (EQ/compression/limiting) not implemented |
| `agent_goal_execution` | ⚠️ Partial | Temporal (needs env creds) → Modal ReAct loop fallback |
| `temporal_workflow` | ⚠️ Partial | Requires `TEMPORAL_NAMESPACE` + `TEMPORAL_API_KEY` env vars |
| `music_generation` | ❌ Stub | Returns hardcoded `PLACEHOLDER_URL` — MusicGen model not loaded |

**Gap:** `music_generation` is the largest stub — the core generative function of an Amapiano AI Studio returns a static sample URL. The mastering tool has real measurement but no actual mastering DSP.

**Action:** Replace `PLACEHOLDER_URL` with a real MusicGen/AudioCraft integration. Implement mastering DSP chain (EQ + compression + limiting) or integrate an external mastering API.

---

### Phase 5 · Safety Memory

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | Multi-layer memory architecture + retention policy | Short-term (in-memory), long-term (`agent_memory` + `agent_executions` tables) |
| **Short-term** | Working memory for current session | `AgentMemory.shortTerm: Map<string, any>` in `AutonomousAgent` — in-memory |
| **Episodic** | Conversation/session history | `AgentMemory.workingContext` + `DurableAgentState` event log in `agent_memory` table |
| **Long-term RAG/Vector** | Semantic search over persistent knowledge | `musical_vectors` table exists (`vector(1536)` column) but **not connected to the agent system** |
| **Retention policy** | What to keep, for how long | `longTerm` array capped at 100 entries in-memory; no DB-level TTL or pruning policy |
| **Status** | ✅ Required | ⚠️ **Partial** |

> **Note:** Phase 5 in Steve Nouri's framework is labeled "Safety Memory" in the diagram but describes the memory architecture. Phase 10 covers safety/governance. This document treats Phase 5 as the Memory Architecture phase per the framework description.

**What's real:** `agent_memory` and `agent_executions` Supabase tables with RLS. `DurableAgentState` provides full event sourcing with saga/compensation via `executeSagaCompensation()`. `useAgentMemoryPersistence.ts` exposes real CRUD operations used by `AgenticMusicComposer`.

**Gap:** The `musical_vectors` table with `vector(1536)` column (pgvector) is never queried by the agent system. RAG uses a deterministic 128-dim hash pseudo-embedding (`generatePseudoEmbedding()`) rather than real semantic embeddings. No DB-level retention policy.

**Action:** Wire `musical_vectors` to the RAG pipeline. Generate real embeddings (OpenAI `text-embedding-3-small` or equivalent) for each knowledge base item and store in `musical_vectors`. Update `rag-knowledge-search` to use `pgvector` similarity search when real embeddings are available.

---

### Phase 6 · Orchestration & Runtime

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | Runtime flow diagram + state machine | 6 orchestration layers implemented |
| **State management** | Explicit agent state machine | `AutonomousAgent` states: `idle → thinking → acting → reflecting → complete/error` |
| **Triggers** | Event-driven execution | `AgentSignalBus` priority queue (critical/high/normal/low); signal types: nudge, pause, resume, terminate |
| **Async handling** | Concurrent and sequential agent execution | Phase 1 (planning): sequential chain; Phase 2 (composition): `Promise.all` parallel |
| **Retry logic** | Failure recovery | Fallback reasoning on LLM failure; saga compensation in `DurableAgentState` |
| **Durable execution** | Workflow survives crashes | `DurableAgentState` event sourcing + `replayWorkflow()` from `agent_memory` table |
| **Status** | ✅ Required | ✅ **Real — substantial implementation** |

**Six orchestration layers:**

| Layer | File | What it does |
|---|---|---|
| ReAct Loop | `ReActLoop.ts` | Thought → Action → Observation cycle, configurable maxSteps |
| Autonomous Agent | `AutonomousAgent.ts` | Full state machine, goal decomposition, tool execution, reflection |
| Level 5 Orchestrator | `Level5AgentCore.ts` | Planner + Rhythm + Melody + Review agents, in-memory MIDI patterns |
| Temporal Durable Exec | `TemporalWorkflowService.ts` | 5 workflow types via Temporal Cloud; local fallback |
| Signal Bus | `AgentSignalBus.ts` | Priority queue for inter-agent signals; `nudge`, `update_prompt`, `terminate` |
| Durable Agent State | `DurableAgentState.ts` | Event sourcing, saga/compensation, `replayWorkflow()` |

**Gap:** Temporal requires `TEMPORAL_NAMESPACE` + `TEMPORAL_API_KEY` environment variables that are not set in the production Supabase project — the durable workflow path always falls back to local execution. The `AgentSignalBus` is in-memory only; signals do not survive a page reload.

**Action:** Configure Temporal Cloud credentials as Supabase secrets. Persist `AgentSignalBus` events to the `agent_memory` table so signals survive sessions.

---

### Phase 7 · Memory Design

*(See Phase 5 above for database tables and implementation inventory)*

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | Memory architecture diagram + retention policy | Partial: 3 memory layers implemented, vector layer unused |
| **Working memory** | Current task context | `AgentMemory.workingContext` + `compositionOutput: Record<string, string>` in session |
| **Episodic memory** | Conversation history | `DurableAgentState` events in `agent_memory` table; `agent_executions` for past sessions |
| **Long-term RAG/Vector** | Persistent semantic search | `musical_vectors` table (pgvector) exists but not wired; static `AMAPIANO_KNOWLEDGE_BASE` used instead |
| **Retention policy** | TTL, pruning, importance scoring | `importance_score` field in `agent_memory` table; no automated pruning |
| **Status** | ✅ Required | ⚠️ **Partial** |

---

### Phase 8 · UI & Delivery Layer

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | UX flow + API contract | `AgenticMusicComposer.tsx` + streaming endpoint + agent hooks |
| **Human-in-the-loop** | H/I checkpoints for high-risk actions | `toast.error()` for empty prompts; no approval gate for destructive actions |
| **Interaction model** | Chat, form, dashboard | Multi-tab dashboard (Setup → Agents → Goals → RAG Context → Output) |
| **API contract** | Documented request/response schema | Edge function schemas defined in TypeScript types; no OpenAPI spec |
| **Status** | ✅ Required | ✅ **Real** |

**What's real:** `AgenticMusicComposer.tsx` renders 7 live agent cards with real-time status updates (idle/active/completed/failed), confidence scores from real LLM responses, and an Output tab showing actual LLM explanations per agent. `OrchestrationProgress.tsx` visualizes orchestration state. Streaming AI suggestions via `aura-ai-suggestions-stream/index.ts`.

**Gap:** No human-in-the-loop approval for high-risk actions (deleting projects, publishing tracks, billing operations). The `AuditLogViewer.tsx` component exists but is not surfaced in the main agent flow. Streaming is not integrated with the main `AgenticMusicComposer` composition loop (streaming goes to a separate suggestions panel).

**Action:** Add H/I confirmation gates for `stem_separation` (destructive — overwrites existing stems) and any billing-related tool calls. Surface `AuditLogViewer` in the Output tab alongside composition decisions.

---

### Phase 9 · Testing & Evaluations

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | Eval suite + metrics dashboard | 3 test files (33 tests), no automated eval harness |
| **Tool correctness** | Does the right tool get called? | ✅ `agenticComposer.test.tsx`: verifies `agent-reasoning` called with correct `agentRole` |
| **Hallucination rates** | Does the LLM output schema-valid responses? | ✅ `agentReasoning.test.ts`: verifies `ThoughtProcess` schema on all paths |
| **Regression** | Does performance hold across deployments? | ❌ No baseline metrics captured; no regression test suite |
| **RAG quality** | Are retrieved items relevant? | ⚠️ `ragSearch.test.ts`: tests determinism + ordering; no semantic relevance scoring |
| **End-to-end** | Full user journey tested? | ❌ No E2E tests |
| **Status** | ✅ Required | ⚠️ **Partial** |

**Test coverage:**

| File | Tests | What's covered |
|---|---|---|
| `agentReasoning.test.ts` | 10 | `LLMReasoningEngine` — success, fallback, strict mode, decomposed goal routing, golden schemas |
| `ragSearch.test.ts` | 18 | `cosineSimilarity`, `generatePseudoEmbedding`, `hybridSearch` — edge cases, ordering, determinism |
| `agenticComposer.test.tsx` | 5 | RAG call shape, `agentRole` forwarding, context chaining, Output tab content, empty prompt guard |

**Untested:** `AutonomousAgent`, `ReActLoop`, `GoalDecomposer`, `ToolChainManager`, `JudgeAgent`, `DurableAgentState`, `AgentSignalBus`, `Level5AgentCore`.

**Gap:** The `JudgeAgent.evaluateAllAgents()` function reads `agent_executions` and generates improvement recommendations — but there is no automated harness that invokes it on a test dataset to measure agent quality over time.

**Action:** Add Vitest unit tests for `AutonomousAgent` and `ReActLoop`. Build a eval dataset of 20 composition prompts with expected agent roles and context chains. Run `JudgeAgent.evaluateAllAgents()` in CI and track the `successRate` metric across deployments.

---

### Phase 10 · Safety & Governance

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | Security checklist + approval matrix | Audit logging real; injection defenses absent |
| **Prompt injection** | Sanitize all user inputs before LLM | ❌ Raw request body fields passed directly to LLM prompts |
| **Least-privilege** | Agents use only required permissions | ⚠️ Partial — RLS enforces user data isolation; but any agent can send `update_prompt` signals to any other agent |
| **Audit logging** | All actions recorded | ✅ `useAuditLog.ts` — 11 event types, writes to `analytics_events` table |
| **Rate limiting** | Per-user/per-API limits enforced | ❌ `_shared/rateLimiter.ts` defines limits but is imported by zero edge functions (dead code) |
| **Output validation** | LLM outputs filtered/validated | ⚠️ JSON parse with fallback — no content safety scoring |
| **Status** | ✅ Required | ⚠️ **Partial — critical gaps** |

**Security posture:**

| Control | Status | Detail |
|---|---|---|
| RLS on agent tables | ✅ Active | `agent_memory`, `agent_executions` — `auth.uid() = user_id` policy |
| User roles table | ✅ Exists | `user_roles` migration; tier-aware feature flags |
| Audit logging | ✅ Real | `useAuditLog.logAIGeneration()` + `logSecurityEvent()` |
| Rate limiting | ❌ Dead code | `_shared/rateLimiter.ts` never imported |
| Prompt injection defense | ❌ Missing | `goal`, `context`, `history`, `agentRole` passed raw |
| Input length limiting | ❌ Missing | No max length check on any agent input field |
| Output content filtering | ❌ Missing | No toxicity/safety scoring on LLM outputs |
| Inter-agent auth | ❌ Missing | No authorization check on `AgentSignalBus` signal delivery |

**Action (priority order):**
1. Import `checkRateLimit` in `agent-reasoning`, `aura-conductor-orchestration`, and `modal-agent` edge functions — this is one line per function and requires no new code
2. Add input length limits (max 2000 chars for `goal`, 5000 for `context`) in `agent-reasoning/index.ts`
3. Sanitize `agentRole` against an allowlist before passing to `getRoleSystemPrompt()`
4. Add authorization check on `AgentSignalBus.emit()` — only `JudgeAgent` should be able to send `update_prompt` signals

---

### Phase 11 · Deployment & Iteration

| | Steve Nouri Framework | Amapiano AI Studio |
|---|---|---|
| **Deliverable** | Deployment plan + monitoring strategy | Prometheus metrics endpoint real; staging absent |
| **Staging environment** | Separate pre-production environment | ❌ One Supabase project, one Modal app — no staging |
| **Observability** | Token usage, failure rates, latency in real-time | ✅ `supabase/functions/metrics/index.ts` — 10 Prometheus metrics |
| **Token monitoring** | Track LLM token spend | ⚠️ `useCostTracking.ts` + `record-generation-cost/index.ts` exist but not called from agent path |
| **Failure rate tracking** | Alert on error spikes | ✅ `detect-performance-anomalies/index.ts` + `send-performance-alert/index.ts` |
| **A/B testing** | Controlled rollout of changes | ⚠️ `useABTesting.ts` hook exists; DB table not queried (hardcoded) |
| **Continuous improvement** | Feedback loop from eval to prompt updates | ⚠️ `JudgeAgent.evaluateAllAgents()` + `AgentSignalBus` — not triggered automatically |
| **Status** | ✅ Required | ⚠️ **Partial** |

**Metrics tracked (real):**

| Metric | Source |
|---|---|
| `amapiano_ai_requests_total` | `ai_context_memory` table count |
| `amapiano_agent_executions_total` | `agent_executions` table count |
| `amapiano_agent_execution_duration_ms` | `agent_executions.duration_ms` avg |
| `amapiano_audio_jobs_hourly` | `audio_jobs` table (last hour) |
| `amapiano_generations_total` | `generated_tracks` table count |
| `amapiano_active_users_hourly` | `profiles` table (last hour) |
| `amapiano_performance_anomalies_active` | `performance_anomalies` table |
| `amapiano_edge_function_health` | Hardcoded `1.0` (gap — not actually probed) |

**Gap:** The `amapiano_edge_function_health` metric is hardcoded `1.0` — it does not actually probe edge function health. No CI/CD pipeline (no `.github/workflows/`). Cost tracking not called from the agent execution path, so LLM token spend is not recorded.

**Action:** Create a staging Supabase project and Modal app name. Add a `DEPLOY_ENV` env var and conditional config. Wire `record-generation-cost` into `executeAgentWork` after each LLM call. Replace hardcoded edge function health metric with real liveness checks.

---

## Reference Architecture — Nouri vs. Amapiano AI Studio

```
Steve Nouri                          Amapiano AI Studio
─────────────────────────────────    ─────────────────────────────────────────
Layer 1: Interface Layer             AgenticMusicComposer.tsx
  Web UI / Slack / API                 Multi-tab React UI (jsdom-tested)
                                       StreamingAISuggestions.tsx
                                       OrchestrationProgress.tsx

Layer 2: Orchestrator                AutonomousAgent.ts + ReActLoop.ts
  State, routing, retries              6-layer orchestration stack
                                       DurableAgentState (event sourcing)
                                       AgentSignalBus (priority queue)

Layer 3: LLM Layer                   agent-reasoning/index.ts
  Planning, reasoning, formatting      Gemini 2.5 Flash via Lovable gateway
                                       getRoleSystemPrompt (7 roles)
                                       LLMReasoningEngine + fallbackReasoning

Layer 4: Tool Layer                  RealToolDefinitions.ts (12 tools)
  External DBs, search, action APIs    Modal GPU (Demucs, Librosa)
                                       ElevenLabs, Replicate, Supabase Storage
                                       ⚠️ music_generation = stub

Layer 5: Memory Layer                agent_memory + agent_executions tables
  History, vectors, user profiles      DurableAgentState (episodic events)
                                       useAgentMemoryPersistence.ts
                                       ⚠️ musical_vectors table unused

Layer 6: Safety & Governance         useAuditLog.ts + RLS policies
  Permissions, approvals, audit        ❌ checkRateLimit = dead code
                                       ❌ no prompt injection defense

Layer 7: Eval & Observability        metrics/index.ts (Prometheus)
  Perf metrics, system health          JudgeAgent.evaluateAllAgents()
                                       ⚠️ edge_function_health hardcoded
                                       ❌ no staging environment
```

---

## Maturity Score

| Phase | Score | Verdict |
|---|---|---|
| 1. Purpose & Scope | 6/10 | Product PRD exists; no agent-specific scope doc |
| 2. Behavior & Prompting | 9/10 | 7 role-specific prompts with domain knowledge; lacks versioning |
| 3. LLM Strategy | 5/10 | Single model, real fallback logic, no multi-provider routing |
| 4. Tooling & Integrations | 7/10 | 8/12 tools real; music_generation and mastering DSP are stubs |
| 5. Safety Memory / Memory Design | 6/10 | 3-layer memory real; vector layer (pgvector) unused |
| 6. Orchestration & Runtime | 8/10 | 6 layers, event sourcing, saga compensation; Temporal needs env creds |
| 7. Memory Design (layered) | 6/10 | Same as Phase 5 — vector gap is the main issue |
| 8. UI & Delivery Layer | 8/10 | Real agent UI, streaming; no H/I approval gates |
| 9. Testing & Evaluations | 5/10 | 33 tests pass; core agent classes untested; no eval dataset |
| 10. Safety & Governance | 4/10 | Audit logging real; rate limiter dead code; no injection defense |
| 11. Deployment & Iteration | 5/10 | Prometheus metrics real; no staging; token tracking not wired |
| **Overall** | **6.3/10** | **Solid V2 — ready for V3 hardening** |

---

## Prioritized Next Steps (V3 Readiness)

### Critical (blocks production trust)
1. **Wire `checkRateLimit`** into `agent-reasoning`, `aura-conductor-orchestration`, `modal-agent` — one import per function, no new code needed
2. **Prompt injection defense** — sanitize `goal`/`context` length + `agentRole` allowlist in `agent-reasoning/index.ts`
3. **Fix `music_generation` stub** — replace `PLACEHOLDER_URL` with a real MusicGen/AudioCraft integration

### High (V3 quality gate)
4. **Real vector embeddings** — generate embeddings for `AMAPIANO_KNOWLEDGE_BASE` items, store in `musical_vectors`, update `rag-knowledge-search` to use pgvector
5. **Staging environment** — create staging Supabase project + `DEPLOY_ENV` env var
6. **Token cost tracking** — call `record-generation-cost` from `executeAgentWork` after each LLM call

### Medium (continuous improvement)
7. **Prompt versioning** — add `prompt_version` field to `agent_executions` inserts
8. **Eval harness** — 20-prompt eval dataset + automated `JudgeAgent.evaluateAllAgents()` in CI
9. **Test coverage** — Vitest unit tests for `AutonomousAgent`, `ReActLoop`, `DurableAgentState`
10. **H/I gates** — confirmation dialogs for destructive tool calls (`stem_separation`, billing)
11. **Multi-provider LLM fallback** — add OpenAI/Anthropic as secondary providers behind Lovable gateway
