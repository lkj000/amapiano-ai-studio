import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cpu, Zap, Clock, DollarSign, CheckCircle, AlertTriangle, 
  BarChart3, Settings, Shuffle, Target, Brain, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'elevenlabs' | 'local';
  type: 'text' | 'audio' | 'music' | 'voice' | 'analysis';
  costPerToken: number;
  latency: number; // ms
  quality: number; // 0-1
  reliability: number; // 0-1
  specialties: string[];
  status: 'active' | 'offline' | 'limited';
  usage: {
    tokensUsed: number;
    totalCost: number;
    successRate: number;
  };
}

interface AIModelRouterProps {
  onModelSelect: (modelId: string, task: string) => void;
  className?: string;
}

const AI_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-5-2025-08-07',
    name: 'GPT-5 (Latest)',
    provider: 'openai',
    type: 'text',
    costPerToken: 0.00006,
    latency: 800,
    quality: 0.95,
    reliability: 0.98,
    specialties: ['Music Theory', 'Complex Analysis', 'Creative Writing'],
    status: 'active',
    usage: { tokensUsed: 45230, totalCost: 2.71, successRate: 0.96 }
  },
  {
    id: 'gpt-5-mini-2025-08-07', 
    name: 'GPT-5 Mini',
    provider: 'openai',
    type: 'text',
    costPerToken: 0.00002,
    latency: 400,
    quality: 0.88,
    reliability: 0.97,
    specialties: ['Quick Responses', 'Pattern Recognition', 'Real-time Help'],
    status: 'active',
    usage: { tokensUsed: 123450, totalCost: 2.47, successRate: 0.94 }
  },
  {
    id: 'o4-mini-2025-04-16',
    name: 'O4 Mini (Reasoning)',
    provider: 'openai', 
    type: 'analysis',
    costPerToken: 0.00015,
    latency: 1200,
    quality: 0.92,
    reliability: 0.95,
    specialties: ['Music Analysis', 'Complex Problem Solving', 'Cultural Context'],
    status: 'active',
    usage: { tokensUsed: 12340, totalCost: 1.85, successRate: 0.98 }
  },
  {
    id: 'whisper-1',
    name: 'Whisper (Speech-to-Text)',
    provider: 'openai',
    type: 'audio',
    costPerToken: 0.006, // per minute
    latency: 2000,
    quality: 0.94,
    reliability: 0.96,
    specialties: ['Voice Recognition', 'Multiple Languages', 'Music Transcription'],
    status: 'active',
    usage: { tokensUsed: 340, totalCost: 2.04, successRate: 0.93 }
  },
  // ElevenLabs
  {
    id: 'eleven_turbo_v2_5',
    name: 'ElevenLabs Turbo V2.5',
    provider: 'elevenlabs',
    type: 'voice',
    costPerToken: 0.0002, // per character
    latency: 600,
    quality: 0.91,
    reliability: 0.94,
    specialties: ['Voice Synthesis', 'Real-time Speech', 'Multiple Languages'],
    status: 'active',
    usage: { tokensUsed: 15600, totalCost: 3.12, successRate: 0.92 }
  },
  // Local/Fallback Models
  {
    id: 'local_neural_engine',
    name: 'Local Neural Engine',
    provider: 'local',
    type: 'music',
    costPerToken: 0,
    latency: 300,
    quality: 0.75,
    reliability: 0.85,
    specialties: ['MIDI Generation', 'Pattern Creation', 'Offline Processing'],
    status: 'active',
    usage: { tokensUsed: 89000, totalCost: 0, successRate: 0.87 }
  }
];

export const AIModelRouter: React.FC<AIModelRouterProps> = ({
  onModelSelect,
  className
}) => {
  const [models, setModels] = useState<AIModel[]>(AI_MODELS);
  const [selectedTask, setSelectedTask] = useState<string>('music_generation');
  const [autoRouting, setAutoRouting] = useState(true);
  const [costBudget, setCostBudget] = useState(10.0); // dollars
  const [prioritizeSpeed, setPrioritizeSpeed] = useState(false);
  const [routingStats, setRoutingStats] = useState({
    totalRequests: 156,
    totalCost: 12.19,
    avgLatency: 750,
    successRate: 0.94
  });

  // Load real usage stats from ai_model_usage table
  useEffect(() => {
    const loadUsageStats = async () => {
      try {
        const { data } = await supabase
          .from('ai_model_usage')
          .select('model_name, cost_cents, generation_time_ms, success')
          .order('created_at', { ascending: false })
          .limit(100);

        if (data && data.length > 0) {
          const totalRequests = data.length;
          const totalCost = data.reduce((sum, d) => sum + (d.cost_cents || 0), 0) / 100;
          const avgLatency = Math.round(data.reduce((sum, d) => sum + (d.generation_time_ms || 0), 0) / totalRequests);
          const successRate = data.filter(d => d.success).length / totalRequests;
          setRoutingStats({ totalRequests, totalCost, avgLatency, successRate });
        }
      } catch (error) {
        console.error('Failed to load model usage stats:', error);
      }
    };
    loadUsageStats();
  }, []);

  const getOptimalModel = (task: string, requirements?: any) => {
    const taskModelMap: Record<string, string[]> = {
      music_generation: ['gpt-5-2025-08-07', 'local_neural_engine'],
      voice_processing: ['whisper-1', 'eleven_turbo_v2_5'],
      real_time_assistance: ['gpt-5-mini-2025-08-07', 'local_neural_engine'],
      deep_analysis: ['o4-mini-2025-04-16', 'gpt-5-2025-08-07'],
      text_to_speech: ['eleven_turbo_v2_5'],
      quick_response: ['gpt-5-mini-2025-08-07', 'local_neural_engine']
    };

    const eligibleModels = models.filter(model => 
      taskModelMap[task]?.includes(model.id) && model.status === 'active'
    );

    if (eligibleModels.length === 0) return models[0]; // fallback

    // Smart routing algorithm
    return eligibleModels.sort((a, b) => {
      const scoreA = calculateModelScore(a, requirements);
      const scoreB = calculateModelScore(b, requirements);
      return scoreB - scoreA;
    })[0];
  };

  const calculateModelScore = (model: AIModel, requirements?: any) => {
    let score = 0;
    
    // Quality weight (40%)
    score += model.quality * 0.4;
    
    // Reliability weight (30%)
    score += model.reliability * 0.3;
    
    // Speed preference (20%)
    if (prioritizeSpeed) {
      score += (1 - model.latency / 3000) * 0.2; // normalize latency
    } else {
      score += 0.1; // neutral speed impact
    }
    
    // Cost efficiency (10%)
    if (model.costPerToken === 0) {
      score += 0.1; // local models get bonus
    } else {
      score += (1 - Math.min(model.costPerToken / 0.001, 1)) * 0.1;
    }

    return score;
  };

  const selectModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      onModelSelect(modelId, selectedTask);
      toast.success(`Selected ${model.name}`, { 
        description: `Optimized for ${selectedTask.replace(/_/g, ' ')}` 
      });
    }
  };

  const autoSelectModel = () => {
    const optimal = getOptimalModel(selectedTask);
    selectModel(optimal.id);
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      openai: 'bg-green-500/20 text-green-700',
      anthropic: 'bg-blue-500/20 text-blue-700', 
      elevenlabs: 'bg-purple-500/20 text-purple-700',
      local: 'bg-orange-500/20 text-orange-700'
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-500/20 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-500',
      offline: 'text-red-500',
      limited: 'text-yellow-500'
    };
    return colors[status as keyof typeof colors] || 'text-gray-500';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Model Router
          <Badge variant="outline" className="ml-auto bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <Layers className="w-3 h-3 mr-1" />
            Multi-Provider
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="routing" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="routing">Smart Routing</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="routing" className="space-y-4">
            {/* Task Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Task</label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full p-2 border rounded-lg bg-background"
              >
                <option value="music_generation">Music Generation</option>
                <option value="voice_processing">Voice Processing</option>
                <option value="real_time_assistance">Real-time Assistance</option>
                <option value="deep_analysis">Deep Analysis</option>
                <option value="text_to_speech">Text-to-Speech</option>
                <option value="quick_response">Quick Response</option>
              </select>
            </div>

            {/* Routing Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRouting}
                    onChange={(e) => setAutoRouting(e.target.checked)}
                  />
                  <span className="text-sm">Auto-routing</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox" 
                    checked={prioritizeSpeed}
                    onChange={(e) => setPrioritizeSpeed(e.target.checked)}
                  />
                  <span className="text-sm">Prioritize Speed</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm">Cost Budget: ${costBudget}</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={costBudget}
                  onChange={(e) => setCostBudget(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Optimal Model Suggestion */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Optimal Model for {selectedTask.replace('_', ' ')}
                </h3>
                <Button onClick={autoSelectModel} size="sm">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Auto Select
                </Button>
              </div>
              
              {(() => {
                const optimal = getOptimalModel(selectedTask);
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{optimal.name}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Quality: {Math.round(optimal.quality * 100)}%</span>
                        <span>Latency: {optimal.latency}ms</span>
                        <span>Cost: ${optimal.costPerToken}/token</span>
                      </div>
                    </div>
                    <Badge className={getProviderColor(optimal.provider)}>
                      {optimal.provider}
                    </Badge>
                  </div>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-3">
            {models.map((model) => (
              <Card key={model.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{model.name}</h3>
                    <Badge className={getProviderColor(model.provider)}>
                      {model.provider}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(model.status)}>
                      {model.status}
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => selectModel(model.id)}
                    size="sm"
                    variant="outline"
                  >
                    Select
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quality</span>
                    <Progress value={model.quality * 100} className="mt-1" />
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reliability</span>
                    <Progress value={model.reliability * 100} className="mt-1" />
                  </div>
                  <div>
                    <span className="text-muted-foreground">Latency</span>
                    <div className="mt-1">{model.latency}ms</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {model.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="font-medium">Total Requests</span>
                </div>
                <p className="text-2xl font-bold">{routingStats.totalRequests}</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Total Cost</span>
                </div>
                <p className="text-2xl font-bold">${routingStats.totalCost.toFixed(2)}</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Avg Latency</span>
                </div>
                <p className="text-2xl font-bold">{routingStats.avgLatency}ms</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Success Rate</span>
                </div>
                <p className="text-2xl font-bold">{Math.round(routingStats.successRate * 100)}%</p>
              </Card>
            </div>

            {/* Usage by Provider */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Usage by Provider</h3>
              <div className="space-y-2">
                {Object.entries(
                  models.reduce((acc, model) => {
                    acc[model.provider] = (acc[model.provider] || 0) + model.usage.totalCost;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([provider, cost]) => (
                  <div key={provider} className="flex justify-between items-center">
                    <Badge className={getProviderColor(provider)}>
                      {provider}
                    </Badge>
                    <span className="font-medium">${cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};