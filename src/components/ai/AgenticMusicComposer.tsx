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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, Users, Zap, Target, Music, Brain, 
  Clock, CheckCircle, AlertCircle, Cpu, 
  Search, Database, Layers 
} from "lucide-react";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  type: 'conductor' | 'harmony' | 'rhythm' | 'melody' | 'arrangement' | 'analysis' | 'rag';
  status: 'idle' | 'active' | 'completed' | 'failed';
  specialty: string;
  currentTask?: string;
  confidence: number;
  lastActivity: string;
}

interface CompositionGoal {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedAgents: string[];
  progress: number;
  subGoals: string[];
}

interface RAGContext {
  id: string;
  type: 'pattern' | 'reference' | 'style' | 'theory';
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
  status: 'planning' | 'composing' | 'arranging' | 'finalizing' | 'completed';
  startTime: string;
  estimatedCompletionTime?: string;
}

const MUSIC_AGENTS: Agent[] = [
  {
    id: 'conductor',
    name: 'Conductor Agent',
    type: 'conductor',
    status: 'idle',
    specialty: 'Overall orchestration and goal decomposition',
    confidence: 95,
    lastActivity: 'Initialized system'
  },
  {
    id: 'harmony_specialist',
    name: 'Harmony Specialist',
    type: 'harmony',
    status: 'idle',
    specialty: 'Chord progressions, voice leading, harmonic analysis',
    confidence: 92,
    lastActivity: 'Analyzed jazz progressions'
  },
  {
    id: 'rhythm_master',
    name: 'Rhythm Master',
    type: 'rhythm',
    status: 'idle',
    specialty: 'Log drums, percussion patterns, groove analysis',
    confidence: 89,
    lastActivity: 'Generated Amapiano rhythm'
  },
  {
    id: 'melody_weaver',
    name: 'Melody Weaver',
    type: 'melody',
    status: 'idle',
    specialty: 'Melodic composition, phrasing, emotional expression',
    confidence: 87,
    lastActivity: 'Crafted piano melody'
  },
  {
    id: 'arrangement_architect',
    name: 'Arrangement Architect',
    type: 'arrangement',
    status: 'idle',
    specialty: 'Song structure, instrumentation, dynamic flow',
    confidence: 91,
    lastActivity: 'Structured track layout'
  },
  {
    id: 'pattern_analyzer',
    name: 'Pattern Analyzer',
    type: 'analysis',
    status: 'idle',
    specialty: 'Pattern recognition, style analysis, reference matching',
    confidence: 94,
    lastActivity: 'Analyzed reference tracks'
  },
  {
    id: 'knowledge_retriever',
    name: 'Knowledge Retriever',
    type: 'rag',
    status: 'idle',
    specialty: 'Context retrieval, reference matching, style guidance',
    confidence: 88,
    lastActivity: 'Retrieved style contexts'
  }
];

const AMAPIANO_STYLES = [
  'Classic Amapiano',
  'Private School Amapiano',
  'Vocal Amapiano',
  'Deep Amapiano',
  'Soulful Amapiano',
  'Jazz-influenced Amapiano',
  'Experimental Amapiano'
];

export const AgenticMusicComposer = () => {
  const [agents, setAgents] = useState<Agent[]>(MUSIC_AGENTS);
  const [currentSession, setCurrentSession] = useState<CompositionSession | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('amapiano');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [enableRAG, setEnableRAG] = useState(true);
  const [agentCoordination, setAgentCoordination] = useState(true);
  const [creativityLevel, setCreativityLevel] = useState(75);
  const [contextWeight, setContextWeight] = useState(80);
  const [isComposing, setIsComposing] = useState(false);

  const sessionRef = useRef<CompositionSession | null>(null);

  const generateRAGContext = useCallback(async (prompt: string, style: string): Promise<RAGContext[]> => {
    // Simulate RAG retrieval
    return [
      {
        id: 'context_1',
        type: 'pattern',
        content: 'Classic Amapiano chord progression: Am7 - Dm7 - G7 - CM7',
        relevance: 95,
        source: 'Pattern Database',
        timestamp: new Date().toISOString()
      },
      {
        id: 'context_2',
        type: 'reference',
        content: 'Log drum pattern from Kabza De Small - "Scorpion Kings"',
        relevance: 88,
        source: 'Reference Tracks',
        timestamp: new Date().toISOString()
      },
      {
        id: 'context_3',
        type: 'style',
        content: 'Private School Amapiano: Jazz harmony with soulful piano',
        relevance: 92,
        source: 'Style Guide',
        timestamp: new Date().toISOString()
      },
      {
        id: 'context_4',
        type: 'theory',
        content: 'Use of modal interchange in Amapiano for emotional depth',
        relevance: 78,
        source: 'Music Theory Database',
        timestamp: new Date().toISOString()
      }
    ];
  }, []);

  const createCompositionGoals = useCallback((prompt: string, style: string): CompositionGoal[] => {
    return [
      {
        id: 'goal_1',
        description: 'Analyze prompt and establish musical direction',
        priority: 'high',
        status: 'pending',
        assignedAgents: ['conductor', 'pattern_analyzer'],
        progress: 0,
        subGoals: ['Parse musical requirements', 'Determine style characteristics', 'Set structural parameters']
      },
      {
        id: 'goal_2',
        description: 'Generate harmonic foundation',
        priority: 'high',
        status: 'pending',
        assignedAgents: ['harmony_specialist', 'knowledge_retriever'],
        progress: 0,
        subGoals: ['Create chord progression', 'Apply voice leading', 'Add jazz extensions']
      },
      {
        id: 'goal_3',
        description: 'Compose rhythmic patterns',
        priority: 'high',
        status: 'pending',
        assignedAgents: ['rhythm_master'],
        progress: 0,
        subGoals: ['Design log drum pattern', 'Add percussion layers', 'Create groove variations']
      },
      {
        id: 'goal_4',
        description: 'Craft melodic elements',
        priority: 'medium',
        status: 'pending',
        assignedAgents: ['melody_weaver'],
        progress: 0,
        subGoals: ['Piano melody composition', 'Bass line creation', 'Synth lead phrases']
      },
      {
        id: 'goal_5',
        description: 'Arrange and structure composition',
        priority: 'medium',
        status: 'pending',
        assignedAgents: ['arrangement_architect', 'conductor'],
        progress: 0,
        subGoals: ['Define song structure', 'Plan instrumentation', 'Create dynamic flow']
      }
    ];
  }, []);

  const simulateAgentWork = useCallback(async (
    agent: Agent, 
    goal: CompositionGoal, 
    session: CompositionSession
  ): Promise<void> => {
    // Update agent status
    setAgents(prev => prev.map(a => 
      a.id === agent.id ? { ...a, status: 'active', currentTask: goal.description } : a
    ));

    // Simulate work with progress updates
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update goal progress
      if (sessionRef.current) {
        sessionRef.current.goals = sessionRef.current.goals.map(g =>
          g.id === goal.id ? { ...g, progress, status: progress === 100 ? 'completed' : 'in_progress' } : g
        );
        
        // Update overall session progress
        const totalProgress = sessionRef.current.goals.reduce((sum, g) => sum + g.progress, 0) / sessionRef.current.goals.length;
        sessionRef.current.progress = totalProgress;
        
        setCurrentSession({ ...sessionRef.current });
      }
    }

    // Complete agent work
    setAgents(prev => prev.map(a => 
      a.id === agent.id ? { 
        ...a, 
        status: 'completed', 
        currentTask: undefined, 
        lastActivity: `Completed: ${goal.description}` 
      } : a
    ));
  }, []);

  const orchestrateComposition = useCallback(async (session: CompositionSession) => {
    sessionRef.current = session;
    
    try {
      // Phase 1: Planning and Analysis
      session.status = 'planning';
      setCurrentSession({ ...session });
      
      const planningGoals = session.goals.filter(g => g.priority === 'high');
      for (const goal of planningGoals) {
        const assignedAgent = agents.find(a => a.id === goal.assignedAgents[0]);
        if (assignedAgent) {
          await simulateAgentWork(assignedAgent, goal, session);
        }
      }

      // Phase 2: Composition
      session.status = 'composing';
      setCurrentSession({ ...session });
      
      const compositionGoals = session.goals.filter(g => g.priority === 'medium');
      // Run composition goals in parallel for efficiency
      await Promise.all(
        compositionGoals.map(async (goal) => {
          const assignedAgent = agents.find(a => a.id === goal.assignedAgents[0]);
          if (assignedAgent) {
            await simulateAgentWork(assignedAgent, goal, session);
          }
        })
      );

      // Phase 3: Finalizing
      session.status = 'finalizing';
      setCurrentSession({ ...session });
      
      // Final arrangement and polishing
      const arrangementAgent = agents.find(a => a.id === 'arrangement_architect');
      const finalGoal = session.goals.find(g => g.description.includes('Arrange'));
      if (arrangementAgent && finalGoal) {
        await simulateAgentWork(arrangementAgent, finalGoal, session);
      }

      // Complete session
      session.status = 'completed';
      session.progress = 100;
      session.estimatedCompletionTime = new Date().toISOString();
      setCurrentSession({ ...session });
      
      toast.success("Agentic composition completed successfully!");
    } catch (error) {
      toast.error("Composition failed");
      console.error(error);
    }
  }, [agents, simulateAgentWork]);

  const startComposition = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a composition prompt");
      return;
    }

    setIsComposing(true);

    try {
      // Generate RAG context if enabled
      let ragContext: RAGContext[] = [];
      if (enableRAG) {
        ragContext = await generateRAGContext(prompt, selectedStyle);
      }

      // Create composition session
      const session: CompositionSession = {
        id: `session_${Date.now()}`,
        prompt,
        genre: selectedGenre,
        style: selectedStyle,
        goals: createCompositionGoals(prompt, selectedStyle),
        ragContext,
        activeAgents: [...agents],
        progress: 0,
        status: 'planning',
        startTime: new Date().toISOString()
      };

      setCurrentSession(session);
      
      // Start orchestration
      await orchestrateComposition(session);
      
    } catch (error) {
      toast.error("Failed to start composition");
      console.error(error);
    } finally {
      setIsComposing(false);
    }
  }, [prompt, selectedGenre, selectedStyle, enableRAG, agents, generateRAGContext, createCompositionGoals, orchestrateComposition]);

  const getAgentStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getGoalStatusIcon = (status: CompositionGoal['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'blocked': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
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
              {agents.filter(a => a.status === 'active').length} Agents Active
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
                      {AMAPIANO_STYLES.map(style => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Switch checked={enableRAG} onCheckedChange={setEnableRAG} />
                  <span className="text-sm">Enable RAG</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={agentCoordination} onCheckedChange={setAgentCoordination} />
                  <span className="text-sm">Agent Coordination</span>
                </div>
                <div className="flex items-center space-x-2 flex-1">
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
                {isComposing ? 'Composing...' : 'Start Agentic Composition'}
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
                    <Badge variant={currentSession.status === 'completed' ? 'default' : 'secondary'}>
                      {currentSession.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{currentSession.prompt}</p>
                    <Progress value={currentSession.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress: {Math.round(currentSession.progress)}%</span>
                      <span>Started: {new Date(currentSession.startTime).toLocaleTimeString()}</span>
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
                          <div className={`w-3 h-3 rounded-full ${getAgentStatusColor(agent.status)}`} />
                          <div>
                            <h4 className="font-medium">{agent.name}</h4>
                            <p className="text-sm text-muted-foreground">{agent.specialty}</p>
                            {agent.currentTask && (
                              <p className="text-xs text-blue-600 mt-1">Current: {agent.currentTask}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{agent.confidence}%</p>
                          <p className="text-xs text-muted-foreground">Confidence</p>
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
                        <Badge variant={goal.priority === 'high' ? 'default' : 'secondary'}>
                          {goal.priority}
                        </Badge>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Assigned: {goal.assignedAgents.join(', ')}
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="context" className="space-y-4">
                <ScrollArea className="h-64">
                  {currentSession?.ragContext.map((context) => (
                    <Card key={context.id} className="p-3 mb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            <Badge variant="outline" className="text-xs">
                              {context.type}
                            </Badge>
                          </div>
                          <p className="text-sm">{context.content}</p>
                          <p className="text-xs text-muted-foreground">
                            Source: {context.source} • Relevance: {context.relevance}%
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="output" className="space-y-4">
                <Card className="p-4">
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Composition output will appear here when the session is completed
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};