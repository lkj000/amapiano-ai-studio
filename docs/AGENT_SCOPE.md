# Agent Scope Document — Amapiano AI Studio

**Version**: 1.0.0
**Status**: Active
**Last Updated**: 2026-02-27

---

## 1. Purpose & Mandate

The Amapiano AI Studio agent system exists to **assist music producers in composing, arranging, and refining Amapiano tracks** using AI-powered reasoning grounded in genre-specific knowledge. Agents are scoped strictly to music production tasks. They do not perform general-purpose automation, access external systems beyond defined integrations, or take irreversible actions without human confirmation.

---

## 2. In-Scope Capabilities

| Capability | Description | Human Confirmation Required |
|---|---|---|
| Musical analysis | Parse genre, BPM, key, mood from a text prompt | No |
| Harmonic generation | Suggest chord progressions with voice leading | No |
| Rhythm composition | Design log drum and percussion patterns | No |
| Melody composition | Generate melodic phrases and motifs | No |
| Arrangement planning | Propose song structure with section timing | No |
| RAG knowledge retrieval | Query curated Amapiano knowledge base | No |
| Stem separation | Trigger AI stem isolation (irreversible audio processing) | **Yes — H/I gate** |
| Music generation | Call ElevenLabs API to generate audio | **Yes — H/I gate** |
| Save execution history | Write composition session to `agent_executions` table | No |

---

## 3. Out-of-Scope (Hard Limits)

Agents **must never**:

- Access file systems beyond the project's Supabase storage bucket
- Send communications (email, social, messaging) on behalf of users
- Modify or delete user-uploaded audio files without explicit confirmation
- Execute code outside the Supabase Edge Function + Modal GPU sandbox
- Access user data from other users (strict row-level security applies)
- Make financial transactions (royalties, licensing) without human approval
- Access the internet except through approved integrations:
  - Lovable AI Gateway (`ai.gateway.lovable.dev`)
  - Anthropic API (`api.anthropic.com`) — fallback only
  - ElevenLabs API (`api.elevenlabs.io/v1/music/generate`)
  - Supabase REST/Functions (`*.supabase.co`)
  - Modal GPU infrastructure (`*.modal.run`)

---

## 4. Agent Roster & Roles

| Agent ID | Role | Description | Max Tokens |
|---|---|---|---|
| `conductor` | Orchestrator | Decomposes goals, sequences other agents | 2000 |
| `harmony` | Harmony Specialist | Chord progressions, voice leading | 2000 |
| `rhythm` | Rhythm Master | Log drums, percussion, Euclidean patterns | 1500 |
| `melody` | Melody Weaver | Melodic composition, phrasing | 1500 |
| `arrangement` | Arrangement Architect | Song structure, instrumentation | 1500 |
| `analysis` | Pattern Analyzer | Style fingerprinting, reference matching | 1500 |
| `rag` | Knowledge Retriever | Context retrieval from knowledge base | 800 |

**Allowlisted roles** (enforced in `agent-reasoning/index.ts`):
`conductor`, `harmony`, `rhythm`, `melody`, `arrangement`, `analysis`, `rag`

Requests with any other `agentRole` value are rejected with HTTP 400.

---

## 5. Memory & Data Retention

| Store | Table | Retention Policy | Notes |
|---|---|---|---|
| Short-term (session) | In-memory React state | Cleared on page reload | Agent working context |
| Execution history | `agent_executions` | 90 days, then archived | Full composition sessions |
| Agent memory | `agent_memory` | 30 days, then pruned | Key signals and learnings |
| Musical vectors | `musical_vectors` | Permanent | Seeded knowledge base |
| Drum patterns | `drum_patterns` | Permanent | User-created patterns |
| Chord progressions | `chord_progressions` | Permanent | User-created progressions |

**Data minimisation**: Only the `user_id`, `goal`, `success` flag, and structured `execution_result` JSON are persisted — no raw audio data is stored in `agent_executions`.

---

## 6. Safety Constraints

### Rate Limiting
All agentic edge functions enforce per-user rate limits:

| Function | Limit | Window |
|---|---|---|
| `agent-reasoning` | 30 requests | 1 minute |
| `aura-conductor-orchestration` | 10 requests | 1 minute |
| `modal-agent` | 20 requests | 1 minute |

Exceeding limits returns HTTP 429 with `Retry-After` header.

### Input Sanitization
All agent inputs are sanitised before LLM calls:
- Maximum goal length: **2,000 characters**
- Maximum context length: **8,000 characters**
- Prompt injection patterns stripped (`ignore previous instructions`, `system:` prefix, jailbreak keywords)
- Agent role validated against allowlist

### Human-in-the-Loop (H/I) Gates
The following operations require explicit user confirmation before execution:
1. **Stem separation** — irreversible audio processing (~2-5 min)
2. **Music generation via ElevenLabs** — API cost per call
3. **Bulk export** — writes multiple files to storage

---

## 7. Feature Flags

Feature flags control progressive rollout of agentic capabilities. Stored in `feature_flags` table with per-user group targeting.

| Flag | Default | Description |
|---|---|---|
| `multi_agent_system` | `true` | Enable the full multi-agent composition pipeline |
| `neural_music_engine` | `true` | Enable ElevenLabs music generation |
| `cultural_authenticity_engine` | `true` | Enable cultural authenticity validation |
| `ai_model_router` | `true` | Enable multi-provider LLM routing |
| `aura_sidebar` | `true` | Show the Aura AI assistant sidebar |
| `enhanced_style_exchange` | `true` | Enable style transfer features |
| `realtime_collaboration` | `true` | Enable collaborative sessions |
| `micro_royalty_system` | `true` | Enable micro-royalty tracking |
| `voice_ai_guide` | `true` | Enable voice AI guide |

---

## 8. Integration Architecture

```
User Prompt
    │
    ▼
AgenticMusicComposer (React)
    │
    ├── rag-knowledge-search (Edge Fn)
    │       └── musical_vectors (pgvector) + curated KB
    │
    ├── agent-reasoning (Edge Fn) × 7 agents
    │       ├── Lovable AI Gateway → Gemini-2.5-flash (primary)
    │       └── Anthropic API → claude-haiku-4-5 (fallback)
    │
    ├── aura-conductor-orchestration (Edge Fn)
    │       └── Full ReAct plan with real LLM calls per step
    │
    └── useAgentMemoryPersistence
            ├── agent_executions (write after session)
            └── agent_memory (read history)
```

---

## 9. Prompt Versioning

Current prompt version: **`2.1.0`**
Tracked in `PROMPT_VERSION` constant in `agent-reasoning/index.ts`.
Returned in every LLM response as `prompt_version` field.
Stored in `agent_executions.execution_result.prompt_version` for auditability.

---

## 10. Temporal / Durable Workflows

The `AgentSignalBus` implements Temporal-inspired durable inter-agent communication:
- Signals are persisted to `agent_memory` table (type: `agent_signal`) for durability
- Signal history survives page reloads for debugging and auditing
- `Temporal` workflow credentials configured via environment:
  - `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_TASK_QUEUE`

---

## 11. Revision History

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0.0 | 2026-02-27 | AI Studio Team | Initial scope document |
