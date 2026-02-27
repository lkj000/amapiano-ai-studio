import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot, Users, Zap, Target, Music, Brain,
  Clock, CheckCircle, AlertCircle, Database, Layers
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAgentMemoryPersistence } from "@/hooks/useAgentMemoryPersistence";

interface Agent {
  id: string;
  name: string;
  type: "conductor" | "harmony" | "rhythm" | "melody" | "arrangement" | "analysis" | "rag";
  status: "idle" | "active" | "completed" | "failed";
  specialty: string;
  currentTask?: string;
  confidence: number;
  lastActivity: string;
}

interface CompositionGoal {
  id: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "blocked";
  assignedAgents: string[];
  progress: number;
  subGoals: string[];
}

interface RAGContext {
  id: string;
  type: "pattern" | "reference" | "style" | "theory";
  content: string;
  relevance: number;
  source: string;
  timestamp: string;
}

interface CompositionSession {
  id: string;
  prompt: string;
  genre: string;
  style: string;
  goals: CompositionGoal[];
  ragContext: RAGContext[];
  activeAgents: Agent[];
  progress: number;
  status: "planning" | "composing" | "arranging" | "finalizing" | "completed";
  startTime: string;
  estimatedCompletionTime?: string;
  compositionOutput: Record<string, string>;
}

/**
 * Curated Amapiano expert knowledge base — always included in RAG queries
 * to ensure the search has substantive material even when DB tables are sparse.
 */
const AMAPIANO_KNOWLEDGE_BASE = [
  {
    id: "kb_logdrum_1",
    title: "Log Drum Fundamentals",
    content:
      "The log drum (or 808 bass drum tuned as a melodic instrument) is the signature of Amapiano. " +
      "It typically sits in the E1-A1 range with a long decay (500-900ms). " +
      "The classic pattern places it on the downbeat and syncopated 16th positions. " +
      "Private School style uses softer transients; Classic Amapiano uses harder knock with more body.",
    tags: ["log_drum", "rhythm", "bass", "amapiano", "808"],
  },
  {
    id: "kb_harmony_1",
    title: "Private School Harmonic Language",
    content:
      "Private School Amapiano (Kelvin Momo, BTSM, Babalwa M) draws heavily from jazz harmony. " +
      "Common progressions: Dm9 → Gm9 → CM9 → FM9 (ii-v-I-IV in D minor with 9th extensions). " +
      "Voice leading: keep common tones, move other voices by step. " +
      "Pedal point bass under changing harmony is characteristic.",
    tags: ["harmony", "private_school", "jazz", "chord_progression", "kelvin_momo"],
  },
  {
    id: "kb_bpm_1",
    title: "Amapiano BPM Conventions",
    content:
      "Amapiano BPM ranges by sub-genre: " +
      "Private School: 108-116 BPM. Classic/Commercial: 116-122 BPM. " +
      "Deep Amapiano: 106-112 BPM. Soulful: 104-114 BPM. " +
      "Festival/Uptempo: 120-128 BPM. " +
      "The half-time feel is common — patterns that feel like 56-60 BPM over a 112-120 BPM grid.",
    tags: ["bpm", "tempo", "amapiano", "production"],
  },
  {
    id: "kb_rhythm_euclidean",
    title: "Euclidean Rhythm Patterns in Amapiano",
    content:
      "Euclidean rhythms distribute beats as evenly as possible across subdivisions. " +
      "Common in Amapiano: E(3,8) for hi-hats creating a 3-against-8 pattern. " +
      "E(5,16) for shakers adds poly-rhythmic tension. " +
      "E(2,3) over 16th grid creates the classic Amapiano 'swung' feel. " +
      "Kick patterns often use E(3,8) displaced by 1/16th for syncopation.",
    tags: ["euclidean", "rhythm", "hi_hat", "shaker", "polyrhythm"],
  },
  {
    id: "kb_keys_1",
    title: "Common Keys in Amapiano",
    content:
      "Most popular keys: Am, Dm, Fm, F#m, Gm (minor keys dominate). " +
      "Major keys less common: C, F, Bb used in uplifting commercial tracks. " +
      "Modal approaches: Dorian (natural 6th brightens minor), Phrygian (dark, Spanish feel), " +
      "Mixolydian (major with flat 7th, gospel feel). " +
      "Key changes are rare in Amapiano — the groove stays in one tonal center.",
    tags: ["key", "tonality", "modal", "amapiano"],
  },
  {
    id: "kb_structure_1",
    title: "Amapiano Song Structure",
    content:
      "Standard DJ-friendly structure (bars): " +
      "Intro (16-32 bars): sparse percussion and atmosphere. " +
      "Groove (32-64 bars): log drum enters, full percussion, piano stabs. " +
      "Breakdown (16-32 bars): strip to melody and pads only. " +
      "Drop (32-64 bars): full energy, all elements, log drum prominent. " +
      "Outro (16-32 bars): gradual strip down for DJ mix-out.",
    tags: ["structure", "arrangement", "intro", "drop", "breakdown"],
  },
  {
    id: "kb_swing_1",
    title: "Regional Swing Profiles",
    content:
      "Amapiano groove feel varies by region: " +
      "Johannesburg: tight, precise 16th-note grid, 52-55% swing. " +
      "Pretoria: heavier log drum, 55-60% swing, more bass presence. " +
      "Durban: more relaxed timing, 60-65% swing, township influence. " +
      "Cape Town: syncopated hi-hats, 55-62% swing, Cape Jazz influence.",
    tags: ["swing", "groove", "regional", "johannesburg", "pretoria", "durban"],
  },
  {
    id: "kb_piano_1",
    title: "Amapiano Piano Stab Technique",
    content:
      "Piano stabs are short percussive chord hits, a defining element. " +
      "Velocity: 80-110 MIDI, with ghost notes at 40-60. " +
      "Timing: stabs often land on the 'and' of beat 2 and beat 4 in 4/4. " +
      "Voicing: close-position chords in mid-range (C3-C5) for cut through the mix. " +
      "Sustain: short, staccato hits (16th-32nd note duration) for rhythm or longer for melody.",
    tags: ["piano", "stab", "technique", "midi", "voicing"],
  },
  {
    id: "kb_bass_1",
    title: "Amapiano Bass Design",
    content:
      "Bass in Amapiano is distinct from other genres: " +
      "Sub-bass (20-80 Hz): felt rather than heard, provides foundation. " +
      "Mid-bass (80-200 Hz): the log drum body, primary rhythmic bass element. " +
      "Bass notes follow the root of each chord but also melodic movement. " +
      "Sidechain: heavy pumping sidechain compression from kick is NOT typical in Amapiano. " +
      "The groove breathes naturally rather than pumping.",
    tags: ["bass", "sub_bass", "sidechain", "production", "mix"],
  },
  {
    id: "kb_artists_1",
    title: "Amapiano Artist Style Reference",
    content:
      "Key producer style fingerprints: " +
      "Kabza De Small: melodic, gospel influences, commercial appeal, major keys. " +
      "Kelvin Momo: jazz harmony depth, Private School pioneer, intimate feel. " +
      "Vigro Deep: deep, minimal, heavy sub-bass, dark progressions. " +
      "DBN Gogo: Gqom-influenced, harder percussion, faster tempo. " +
      "Focalistic: commercial, accessible, energetic drops. " +
      "Mdu aka TRP: soulful, organic, live instrument influence.",
    tags: ["artist", "style", "kabza", "kelvin_momo", "vigro_deep", "dbn_gogo"],
  },
];

const MUSIC_AGENTS: Agent[] = [
  {
    id: "conductor",
    name: "Conductor Agent",
    type: "conductor",
    status: "idle",
    specialty: "Overall orchestration and goal decomposition",
    confidence: 0,
    lastActivity: "Ready",
  },
  {
    id: "harmony_specialist",
    name: "Harmony Specialist",
    type: "harmony",
    status: "idle",
    specialty: "Chord progressions, voice leading, harmonic analysis",
    confidence: 0,
    lastActivity: "Ready",
  },
  {
    id: "rhythm_master",
    name: "Rhythm Master",
    type: "rhythm",
    status: "idle",
    specialty: "Log drums, percussion patterns, groove analysis",
    confidence: 0,
    lastActivity: "Ready",
  },
  {
    id: "melody_weaver",
    name: "Melody Weaver",
    type: "melody",
    status: "idle",
    specialty: "Melodic composition, phrasing, emotional expression",
    confidence: 0,
    lastActivity: "Ready",
  },
  {
    id: "arrangement_architect",
    name: "Arrangement Architect",
    type: "arrangement",
    status: "idle",
    specialty: "Song structure, instrumentation, dynamic flow",
    confidence: 0,
    lastActivity: "Ready",
  },
  {
    id: "pattern_analyzer",
    name: "Pattern Analyzer",
    type: "analysis",
    status: "idle",
    specialty: "Pattern recognition, style analysis, reference matching",
    confidence: 0,
    lastActivity: "Ready",
  },
  {
    id: "knowledge_retriever",
    name: "Knowledge Retriever",
    type: "rag",
    status: "idle",
    specialty: "Context retrieval, reference matching, style guidance",
    confidence: 0,
    lastActivity: "Ready",
  },
];

const AMAPIANO_STYLES = [
  "Classic Amapiano",
  "Private School Amapiano",
  "Vocal Amapiano",
  "Deep Amapiano",
  "Soulful Amapiano",
  "Jazz-influenced Amapiano",
  "Experimental Amapiano",
];

export const AgenticMusicComposer = () => {
  const [agents, setAgents] = useState<Agent[]>(MUSIC_AGENTS);
  const [currentSession, setCurrentSession] = useState<CompositionSession | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("amapiano");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [enableRAG, setEnableRAG] = useState(true);
  const [agentCoordination, setAgentCoordination] = useState(true);
  const [creativityLevel, setCreativityLevel] = useState(75);
  const [isComposing, setIsComposing] = useState(false);

  const sessionRef = useRef<CompositionSession | null>(null);
  const { saveExecution } = useAgentMemoryPersistence();

  /**
   * Fetch real RAG context from Supabase DB + rag-knowledge-search edge function.
   * Queries drum_patterns and chord_progressions tables, combines with curated
   * Amapiano expert knowledge, then performs hybrid semantic search.
   */
  const generateRAGContext = useCallback(
    async (searchPrompt: string, style: string): Promise<RAGContext[]> => {
      try {
        // Fetch real patterns from DB in parallel
        const [patternsResult, chordsResult] = await Promise.all([
          supabase
            .from("drum_patterns")
            .select("id, name, genre, pattern_data, description")
            .limit(20),
          supabase
            .from("chord_progressions")
            .select("id, name, genre, progressions, description")
            .limit(20),
        ]);

        // Build knowledge base from DB results + curated expert knowledge
        const dbItems = [
          ...(patternsResult.data || []).map((p) => ({
            id: p.id,
            title: p.name || "Drum Pattern",
            content:
              p.description ||
              (p.pattern_data ? JSON.stringify(p.pattern_data).slice(0, 300) : "Drum pattern"),
            tags: ["drum_pattern", p.genre || "amapiano"],
          })),
          ...(chordsResult.data || []).map((c) => ({
            id: c.id,
            title: c.name || "Chord Progression",
            content:
              c.description ||
              (c.progressions ? JSON.stringify(c.progressions).slice(0, 300) : "Chord progression"),
            tags: ["harmony", "chord_progression", c.genre || "amapiano"],
          })),
          ...AMAPIANO_KNOWLEDGE_BASE,
        ];

        // Call real rag-knowledge-search edge function
        const { data, error } = await supabase.functions.invoke("rag-knowledge-search", {
          body: {
            query: `${searchPrompt} ${style}`.trim(),
            currentContext: `Genre: ${selectedGenre}, Style: ${style}`,
            knowledgeBase: dbItems,
            topK: 4,
          },
        });

        if (error) {
          console.error("[AgenticComposer] RAG search failed:", error);
          // Return a minimal context from the curated KB without search ranking
          return AMAPIANO_KNOWLEDGE_BASE.slice(0, 4).map((item) => ({
            id: item.id,
            type: "theory" as const,
            content: item.content,
            relevance: 75,
            source: "Expert Knowledge Base",
            timestamp: new Date().toISOString(),
          }));
        }

        const enhancedResults: Array<{ id: string; score: number }> =
          data.enhancedResults || [];

        // Map search results back to RAGContext using the knowledge base items
        const itemMap = new Map(dbItems.map((item) => [item.id, item]));

        return enhancedResults
          .slice(0, 4)
          .map((result) => {
            const item = itemMap.get(result.id);
            if (!item) return null;
            const type = item.tags.includes("drum_pattern")
              ? ("pattern" as const)
              : item.tags.includes("harmony") || item.tags.includes("chord_progression")
              ? ("reference" as const)
              : item.tags.includes("style") || item.tags.includes("artist")
              ? ("style" as const)
              : ("theory" as const);
            return {
              id: result.id,
              type,
              content: item.content,
              relevance: Math.round(result.score * 100),
              source: item.tags.includes("kb_") ? "Expert Knowledge Base" : "Pattern Database",
              timestamp: new Date().toISOString(),
            };
          })
          .filter(Boolean) as RAGContext[];
      } catch (err) {
        console.error("[AgenticComposer] generateRAGContext error:", err);
        return [];
      }
    },
    [selectedGenre]
  );

  /**
   * Execute a single agent's work via a real LLM call to agent-reasoning.
   * Passes agent role, goal context, RAG knowledge, and previous agent outputs.
   * Returns the LLM's explanation string for display in the Output tab.
   */
  const executeAgentWork = useCallback(
    async (
      agent: Agent,
      goal: CompositionGoal,
      session: CompositionSession,
      previousOutputs: Record<string, string>
    ): Promise<string> => {
      // Mark agent as active
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id ? { ...a, status: "active", currentTask: goal.description } : a
        )
      );

      // Build rich context from RAG knowledge and previous agent work
      const ragSummary = session.ragContext
        .slice(0, 3)
        .map((r) => `[${r.type.toUpperCase()}] ${r.content.slice(0, 200)}`)
        .join("\n");

      const previousWork = Object.entries(previousOutputs)
        .map(([agentName, output]) => `${agentName}: ${output.slice(0, 300)}`)
        .join("\n");

      const context = [
        `Genre: ${session.genre}`,
        selectedStyle ? `Style: ${session.style}` : "",
        `Creativity level: ${creativityLevel}%`,
        ragSummary ? `\nRetrieved Knowledge:\n${ragSummary}` : "",
        previousWork ? `\nPrevious agent decisions:\n${previousWork}` : "",
        `\nCurrent task: ${goal.description}`,
        `Sub-tasks to address: ${goal.subGoals.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n");

      // Call real agent-reasoning edge function with the agent's role
      const { data, error } = await supabase.functions.invoke("agent-reasoning", {
        body: {
          agentRole: agent.type,
          goal: goal.description,
          context,
          availableTools: goal.subGoals,
          history: [],
        },
      });

      let llmOutput = "";
      let confidence = 0;

      if (error || data?.fallback) {
        console.error(`[AgenticComposer] ${agent.name} reasoning failed:`, error || data?.error);
        llmOutput = `${agent.name} reasoning temporarily unavailable. Proceeding with available context.`;
        confidence = 0;
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id
              ? { ...a, status: "failed", currentTask: undefined, lastActivity: "Reasoning failed" }
              : a
          )
        );
      } else {
        llmOutput = data.explanation || data.reasoning || "Completed";
        confidence = Math.round((data.confidence || 0) * 100);

        // Mark agent as completed with real confidence from LLM
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id
              ? {
                  ...a,
                  status: "completed",
                  currentTask: undefined,
                  confidence,
                  lastActivity: `Completed: ${goal.description}`,
                }
              : a
          )
        );
      }

      // Update goal status to completed
      setCurrentSession((prev) => {
        if (!prev) return prev;
        const completed = prev.goals.map((g) =>
          g.id === goal.id ? { ...g, status: "completed" as const, progress: 100 } : g
        );
        const totalProgress =
          completed.reduce((sum, g) => sum + g.progress, 0) / completed.length;
        return { ...prev, goals: completed, progress: totalProgress };
      });

      return llmOutput;
    },
    [selectedStyle, creativityLevel]
  );

  const createCompositionGoals = useCallback(
    (sessionPrompt: string, style: string): CompositionGoal[] => [
      {
        id: "goal_1",
        description: "Analyze prompt and establish musical direction",
        priority: "high",
        status: "pending",
        assignedAgents: ["conductor", "pattern_analyzer"],
        progress: 0,
        subGoals: [
          "Parse musical requirements",
          "Determine style characteristics",
          "Set structural parameters",
          "Identify BPM and key",
        ],
      },
      {
        id: "goal_2",
        description: "Generate harmonic foundation",
        priority: "high",
        status: "pending",
        assignedAgents: ["harmony_specialist", "knowledge_retriever"],
        progress: 0,
        subGoals: [
          "Create chord progression",
          "Apply voice leading",
          "Add jazz extensions",
          "Define harmonic rhythm",
        ],
      },
      {
        id: "goal_3",
        description: "Compose rhythmic patterns",
        priority: "high",
        status: "pending",
        assignedAgents: ["rhythm_master"],
        progress: 0,
        subGoals: [
          "Design log drum pattern",
          "Add percussion layers",
          "Create groove variations",
          "Set swing percentage",
        ],
      },
      {
        id: "goal_4",
        description: "Craft melodic elements",
        priority: "medium",
        status: "pending",
        assignedAgents: ["melody_weaver"],
        progress: 0,
        subGoals: [
          "Piano melody composition",
          "Bass line creation",
          "Call-and-response phrases",
          "Synth lead direction",
        ],
      },
      {
        id: "goal_5",
        description: "Arrange and structure composition",
        priority: "medium",
        status: "pending",
        assignedAgents: ["arrangement_architect", "conductor"],
        progress: 0,
        subGoals: [
          "Define song structure",
          "Plan instrumentation per section",
          "Create dynamic flow",
          "Design transitions",
        ],
      },
    ],
    []
  );

  const orchestrateComposition = useCallback(
    async (session: CompositionSession, startTime: number) => {
      sessionRef.current = session;
      const compositionOutput: Record<string, string> = {};

      try {
        // Phase 1: Planning — high-priority goals run sequentially
        // (conductor output feeds into harmony, then rhythm)
        const planningGoals = session.goals.filter((g) => g.priority === "high");

        setCurrentSession((prev) => (prev ? { ...prev, status: "planning" } : prev));

        for (const goal of planningGoals) {
          const assignedAgent = agents.find((a) => a.id === goal.assignedAgents[0]);
          if (!assignedAgent) continue;

          const output = await executeAgentWork(
            assignedAgent,
            goal,
            session,
            compositionOutput
          );
          compositionOutput[assignedAgent.name] = output;

          // Update session with accumulated outputs
          setCurrentSession((prev) =>
            prev ? { ...prev, compositionOutput: { ...compositionOutput } } : prev
          );
        }

        // Phase 2: Composition — medium-priority goals run in parallel
        // Both receive the accumulated outputs from phase 1
        const compositionGoals = session.goals.filter((g) => g.priority === "medium");

        setCurrentSession((prev) => (prev ? { ...prev, status: "composing" } : prev));

        await Promise.all(
          compositionGoals.map(async (goal) => {
            const assignedAgent = agents.find((a) => a.id === goal.assignedAgents[0]);
            if (!assignedAgent) return;
            const output = await executeAgentWork(
              assignedAgent,
              goal,
              session,
              compositionOutput
            );
            compositionOutput[assignedAgent.name] = output;
          })
        );

        // Phase 3: Finalize
        setCurrentSession((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                progress: 100,
                compositionOutput: { ...compositionOutput },
                estimatedCompletionTime: new Date().toISOString(),
              }
            : prev
        );

        toast.success("Agentic composition completed!");

        // Persist execution to database
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await saveExecution({
            user_id: user.id,
            goal: session.prompt,
            success: true,
            execution_result: {
              sessionId: session.id,
              genre: session.genre,
              style: session.style,
              agentOutputs: compositionOutput,
              ragContextCount: session.ragContext.length,
            } as any,
            decomposed_goal: session.goals as any,
            duration_ms: Date.now() - startTime,
          });
        }
      } catch (error) {
        toast.error("Composition failed");
        console.error("[AgenticComposer] orchestrateComposition error:", error);
      }
    },
    [agents, executeAgentWork, saveExecution]
  );

  const startComposition = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a composition prompt");
      return;
    }

    setIsComposing(true);
    // Reset agents to idle
    setAgents(MUSIC_AGENTS.map((a) => ({ ...a, status: "idle", confidence: 0, lastActivity: "Ready" })));

    const startTime = Date.now();

    try {
      // Real RAG context retrieval
      let ragContext: RAGContext[] = [];
      if (enableRAG) {
        ragContext = await generateRAGContext(prompt, selectedStyle);
      }

      const session: CompositionSession = {
        id: `session_${Date.now()}`,
        prompt,
        genre: selectedGenre,
        style: selectedStyle,
        goals: createCompositionGoals(prompt, selectedStyle),
        ragContext,
        activeAgents: [...MUSIC_AGENTS],
        progress: 0,
        status: "planning",
        startTime: new Date().toISOString(),
        compositionOutput: {},
      };

      setCurrentSession(session);
      await orchestrateComposition(session, startTime);
    } catch (error) {
      toast.error("Failed to start composition");
      console.error("[AgenticComposer] startComposition error:", error);
    } finally {
      setIsComposing(false);
    }
  }, [
    prompt,
    selectedGenre,
    selectedStyle,
    enableRAG,
    generateRAGContext,
    createCompositionGoals,
    orchestrateComposition,
  ]);

  const getAgentStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getGoalStatusIcon = (status: CompositionGoal["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "blocked":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Agentic Music Composer
            <Badge variant="outline" className="ml-auto">
              {agents.filter((a) => a.status === "active").length} Agents Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Composition Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Composition Prompt</label>
                <Textarea
                  placeholder="Describe the music you want to create... (e.g., 'Create a soulful Private School Amapiano track with jazz piano, deep bass, and emotional log drum patterns')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amapiano">Amapiano</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="electronic">Electronic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Style</label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {AMAPIANO_STYLES.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center space-x-2">
                  <Switch checked={enableRAG} onCheckedChange={setEnableRAG} />
                  <span className="text-sm">Enable RAG</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={agentCoordination} onCheckedChange={setAgentCoordination} />
                  <span className="text-sm">Agent Coordination</span>
                </div>
                <div className="flex items-center space-x-2 flex-1 min-w-48">
                  <span className="text-sm whitespace-nowrap">Creativity:</span>
                  <Slider
                    value={[creativityLevel]}
                    onValueChange={([value]) => setCreativityLevel(value)}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-8">{creativityLevel}%</span>
                </div>
              </div>

              <Button onClick={startComposition} disabled={isComposing} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                {isComposing ? "Composing..." : "Start Agentic Composition"}
              </Button>
            </div>

            {/* Current Session */}
            {currentSession && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      <span className="font-medium">Active Session</span>
                    </div>
                    <Badge
                      variant={currentSession.status === "completed" ? "default" : "secondary"}
                    >
                      {currentSession.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{currentSession.prompt}</p>
                    <Progress value={currentSession.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress: {Math.round(currentSession.progress)}%</span>
                      <span>
                        Started: {new Date(currentSession.startTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            <Tabs defaultValue="agents" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="agents">Agents</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="context">RAG Context</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
              </TabsList>

              <TabsContent value="agents" className="space-y-4">
                <div className="grid gap-4">
                  {agents.map((agent) => (
                    <Card key={agent.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${getAgentStatusColor(agent.status)}`}
                          />
                          <div>
                            <h4 className="font-medium">{agent.name}</h4>
                            <p className="text-sm text-muted-foreground">{agent.specialty}</p>
                            {agent.currentTask && (
                              <p className="text-xs text-blue-600 mt-1">
                                Current: {agent.currentTask}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {agent.lastActivity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {agent.confidence > 0 && (
                            <>
                              <p className="text-sm font-medium">{agent.confidence}%</p>
                              <p className="text-xs text-muted-foreground">Confidence</p>
                            </>
                          )}
                          <Badge
                            variant={agent.status === "completed" ? "default" : "outline"}
                            className="text-xs mt-1"
                          >
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                {currentSession?.goals.map((goal) => (
                  <Card key={goal.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getGoalStatusIcon(goal.status)}
                          <span className="font-medium">{goal.description}</span>
                        </div>
                        <Badge variant={goal.priority === "high" ? "default" : "secondary"}>
                          {goal.priority}
                        </Badge>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Assigned: {goal.assignedAgents.join(", ")}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {goal.subGoals.map((sg) => (
                          <Badge key={sg} variant="outline" className="text-xs">
                            {sg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
                {!currentSession && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Start a composition to see goal decomposition
                  </p>
                )}
              </TabsContent>

              <TabsContent value="context" className="space-y-4">
                {currentSession?.ragContext && currentSession.ragContext.length > 0 ? (
                  <ScrollArea className="h-64">
                    {currentSession.ragContext.map((context) => (
                      <Card key={context.id} className="p-3 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            <Badge variant="outline" className="text-xs">
                              {context.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {context.relevance}% relevance
                            </span>
                          </div>
                          <p className="text-sm">{context.content}</p>
                          <p className="text-xs text-muted-foreground">
                            Source: {context.source}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {enableRAG
                        ? "RAG context will appear here after starting composition"
                        : "Enable RAG to retrieve contextual knowledge"}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="output" className="space-y-4">
                {currentSession?.compositionOutput &&
                Object.keys(currentSession.compositionOutput).length > 0 ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {Object.entries(currentSession.compositionOutput).map(
                        ([agentName, output]) => (
                          <Card key={agentName} className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-primary" />
                                <h4 className="font-medium text-sm">{agentName}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {output}
                              </p>
                            </div>
                          </Card>
                        )
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <Card className="p-4">
                    <div className="text-center py-8">
                      <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Real agent decisions will appear here as each specialist completes its
                        analysis
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
