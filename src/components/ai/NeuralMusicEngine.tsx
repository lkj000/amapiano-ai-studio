/**
 * Neural Music Engine
 * 
 * Real model registry + instrument configuration UI.
 * No fake accuracy numbers, no simulated loading, no hardcoded stats.
 * Models show their actual status from the HuggingFace pipeline / TF.js runtime.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Cpu, Wand2, Music, Layers, Zap, Settings2, Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// REAL MODEL REGISTRY — status reflects actual runtime state, not hardcoded values
// ============================================================================

type ModelStatus = "not_loaded" | "loading" | "ready" | "error";

interface RegisteredModel {
  id: string;
  name: string;
  type: "rnn" | "gan" | "transformer" | "vae";
  instrument: string;
  /** Pipeline ID for HuggingFace or TF.js model path */
  pipelineId: string | null;
  version: string;
  /** Actual runtime status — starts as not_loaded */
  status: ModelStatus;
  /** Error message if loading failed */
  error?: string;
  /** Actual load time in ms, measured — not hardcoded */
  loadTimeMs?: number;
}

/**
 * Model registry. Status starts as "not_loaded" for all.
 * Accuracy is NOT listed because we have no validated benchmarks yet.
 * When a real evaluation pipeline exists, accuracy will come from measured test sets.
 */
const createModelRegistry = (): RegisteredModel[] => [
  // Core instruments with real HuggingFace pipeline IDs where available
  { id: "hf_audio_features", name: "Audio Feature Extractor", type: "transformer", instrument: "analysis", pipelineId: "Xenova/wav2vec2-base", version: "1.0.0", status: "not_loaded" },
  
  // These models are planned but don't have real weights yet — marked honestly
  { id: "planned_piano", name: "Piano Composer (Planned)", type: "rnn", instrument: "piano", pipelineId: null, version: "0.0.0", status: "not_loaded" },
  { id: "planned_log_drums", name: "Log Drum Generator (Planned)", type: "gan", instrument: "log_drums", pipelineId: null, version: "0.0.0", status: "not_loaded" },
  { id: "planned_bass", name: "Bass RNN (Planned)", type: "rnn", instrument: "deep_bass", pipelineId: null, version: "0.0.0", status: "not_loaded" },
  { id: "planned_percussion", name: "Percussion VAE (Planned)", type: "vae", instrument: "percussion", pipelineId: null, version: "0.0.0", status: "not_loaded" },
  { id: "planned_harmony", name: "Harmony Transformer (Planned)", type: "transformer", instrument: "harmony", pipelineId: null, version: "0.0.0", status: "not_loaded" },
  { id: "planned_arrangement", name: "Arrangement GAN (Planned)", type: "gan", instrument: "arrangement", pipelineId: null, version: "0.0.0", status: "not_loaded" },
];

interface InstrumentConfig {
  instrument: string;
  model: string;
  complexity: number;
  creativity: number;
  styleAdherence: number;
  humanization: number;
}

interface AgenticTask {
  id: string;
  type: "compose" | "arrange" | "analyze" | "separate";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  agent: string;
  description: string;
  error?: string;
}

// Available instruments — the config UI is real, the generation backend is WIP
const CONFIGURABLE_INSTRUMENTS = [
  "piano", "log_drums", "deep_bass", "percussion", "shakers",
  "synth_lead", "pads", "synth_bass", "vocals",
];

export const NeuralMusicEngine = () => {
  const [models, setModels] = useState<RegisteredModel[]>(createModelRegistry);
  const [instrumentConfigs, setInstrumentConfigs] = useState<InstrumentConfig[]>([]);
  const [currentTasks, setCurrentTasks] = useState<AgenticTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agenticMode, setAgenticMode] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Real model loading — uses dynamic import of HuggingFace pipeline
  const loadModel = useCallback(async (modelId: string) => {
    setModels(prev => prev.map(m =>
      m.id === modelId ? { ...m, status: "loading" as ModelStatus, error: undefined } : m
    ));

    const model = models.find(m => m.id === modelId);
    if (!model?.pipelineId) {
      setModels(prev => prev.map(m =>
        m.id === modelId ? {
          ...m,
          status: "error" as ModelStatus,
          error: "No trained weights available yet. This model is planned for future release."
        } : m
      ));
      toast.error(`${model?.name ?? modelId}: No weights available yet.`);
      return;
    }

    const startTime = performance.now();
    try {
      // Real HuggingFace pipeline loading
      const { pipeline } = await import("@huggingface/transformers");
      await pipeline("feature-extraction" as any, model.pipelineId, {
        device: "wasm",
      } as any);

      const loadTimeMs = Math.round(performance.now() - startTime);
      setModels(prev => prev.map(m =>
        m.id === modelId ? { ...m, status: "ready" as ModelStatus, loadTimeMs } : m
      ));
      toast.success(`${model.name} loaded in ${(loadTimeMs / 1000).toFixed(1)}s`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown loading error";
      setModels(prev => prev.map(m =>
        m.id === modelId ? { ...m, status: "error" as ModelStatus, error: errorMsg } : m
      ));
      toast.error(`Failed to load ${model.name}: ${errorMsg}`);
    }
  }, [models]);

  // Real stats from database — not hardcoded
  const [dbStats, setDbStats] = useState<{ patterns: number; tracks: number; feedback: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patternsRes, tracksRes, feedbackRes] = await Promise.all([
          supabase.from("generated_samples").select("id", { count: "exact", head: true }),
          supabase.from("audio_analysis_results").select("id", { count: "exact", head: true }),
          supabase.from("community_feedback").select("id", { count: "exact", head: true }),
        ]);
        setDbStats({
          patterns: patternsRes.count ?? 0,
          tracks: tracksRes.count ?? 0,
          feedback: feedbackRes.count ?? 0,
        });
      } catch {
        // Silently fail — stats are supplementary
      }
    };
    fetchStats();
  }, []);

  const updateInstrumentConfig = useCallback((instrument: string, config: Partial<InstrumentConfig>) => {
    setInstrumentConfigs(prev => {
      const existing = prev.find(c => c.instrument === instrument);
      if (existing) {
        return prev.map(c => c.instrument === instrument ? { ...c, ...config } : c);
      }
      return [...prev, {
        instrument,
        model: "",
        complexity: 70,
        creativity: 80,
        styleAdherence: 85,
        humanization: 60,
        ...config,
      }];
    });
  }, []);

  const getModelTypeIcon = (type: RegisteredModel["type"]) => {
    switch (type) {
      case "rnn": return <Layers className="w-4 h-4" />;
      case "gan": return <Zap className="w-4 h-4" />;
      case "transformer": return <Brain className="w-4 h-4" />;
      case "vae": return <Target className="w-4 h-4" />;
      default: return <Cpu className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (model: RegisteredModel) => {
    switch (model.status) {
      case "ready":
        return <Badge variant="default">Ready ({model.loadTimeMs}ms)</Badge>;
      case "loading":
        return <Badge variant="secondary">Loading…</Badge>;
      case "error":
        return (
          <Badge variant="destructive" className="max-w-48 truncate" title={model.error}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            {model.pipelineId ? "Error" : "No Weights"}
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Loaded</Badge>;
    }
  };

  const readyCount = models.filter(m => m.status === "ready").length;
  const plannedCount = models.filter(m => !m.pipelineId).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Neural Music Engine
            <Badge variant="outline" className="ml-auto">
              {readyCount} / {models.length} Models Loaded
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex items-center space-x-2">
              <Switch checked={agenticMode} onCheckedChange={setAgenticMode} />
              <span className="text-sm">Agentic AI</span>
            </div>
            {plannedCount > 0 && (
              <p className="text-xs text-muted-foreground self-center">
                {plannedCount} models are planned — weights not yet trained
              </p>
            )}
          </div>

          <Tabs defaultValue="models" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="models">Model Registry</TabsTrigger>
              <TabsTrigger value="instruments">Instrument Config</TabsTrigger>
              <TabsTrigger value="stats">Database Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="models" className="space-y-4">
              <div className="grid gap-3">
                {models.map((model) => (
                  <Card key={model.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {getModelTypeIcon(model.type)}
                        <div className="min-w-0">
                          <h4 className="font-medium truncate">{model.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {model.instrument} • v{model.version}
                            {model.pipelineId && (
                              <span className="ml-2 text-xs font-mono text-muted-foreground/60">
                                {model.pipelineId}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(model)}
                        <Badge variant={model.type === "transformer" ? "default" : "secondary"}>
                          {model.type.toUpperCase()}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={model.status === "loading" || model.status === "ready"}
                          onClick={() => loadModel(model.id)}
                        >
                          {model.status === "loading" ? "Loading…" : "Load"}
                        </Button>
                      </div>
                    </div>
                    {model.status === "error" && model.error && (
                      <p className="text-xs text-destructive mt-2">{model.error}</p>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="instruments" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Configure parameters for each instrument. These values will be passed to the generation backend when models are available.
              </p>
              <div className="grid gap-4">
                {CONFIGURABLE_INSTRUMENTS.map((instrument) => {
                  const config = instrumentConfigs.find(c => c.instrument === instrument);
                  const availableModels = models.filter(m =>
                    m.instrument === instrument || m.instrument === "harmony"
                  );

                  return (
                    <Card key={instrument} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium capitalize">{instrument.replace("_", " ")}</h4>
                          <Select
                            value={config?.model || ""}
                            onValueChange={(value) => updateInstrumentConfig(instrument, { model: value })}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableModels.length > 0 ? (
                                availableModels.map((model) => (
                                  <SelectItem key={model.id} value={model.id}>
                                    {model.name} {model.status !== "ready" ? "(not loaded)" : ""}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  No models available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {config && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Complexity</label>
                              <Slider
                                value={[config.complexity]}
                                onValueChange={([value]) => updateInstrumentConfig(instrument, { complexity: value })}
                                max={100}
                                step={1}
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Creativity</label>
                              <Slider
                                value={[config.creativity]}
                                onValueChange={([value]) => updateInstrumentConfig(instrument, { creativity: value })}
                                max={100}
                                step={1}
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Style Adherence</label>
                              <Slider
                                value={[config.styleAdherence]}
                                onValueChange={([value]) => updateInstrumentConfig(instrument, { styleAdherence: value })}
                                max={100}
                                step={1}
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Humanization</label>
                              <Slider
                                value={[config.humanization]}
                                onValueChange={([value]) => updateInstrumentConfig(instrument, { humanization: value })}
                                max={100}
                                step={1}
                                className="mt-2"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-4">Live Database Counts</h3>
                {dbStats ? (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Generated Samples:</span>
                      <span className="ml-2 font-medium">{dbStats.patterns.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Audio Analyses:</span>
                      <span className="ml-2 font-medium">{dbStats.tracks.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Community Feedback:</span>
                      <span className="ml-2 font-medium">{dbStats.feedback.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading stats from database…</p>
                )}
                <Separator className="my-4" />
                <p className="text-xs text-muted-foreground">
                  All numbers are live counts from the Supabase database — not hardcoded.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
