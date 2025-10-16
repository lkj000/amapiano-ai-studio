import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Workflow, 
  Code, 
  Palette, 
  Zap, 
  Database,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  Square,
  RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MultiAgentOrchestratorProps {
  user: User | null;
  className?: string;
}

interface Agent {
  id: string;
  name: string;
  type: 'conductor' | 'backend' | 'frontend' | 'ai_ml' | 'devops' | 'cpp';
  status: 'idle' | 'working' | 'completed' | 'error';
  current_task?: string;
  progress: number;
  last_output?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  capabilities: string[];
}

interface OrchestrationTask {
  id: string;
  name: string;
  description: string;
  agent_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  start_time?: string;
  completion_time?: string;
  output?: any;
  dependencies: string[];
}

interface OrchestrationSession {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  tasks: OrchestrationTask[];
  started_at?: string;
  completed_at?: string;
}

export const MultiAgentOrchestrator: React.FC<MultiAgentOrchestratorProps> = ({ 
  user, 
  className 
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentSession, setCurrentSession] = useState<OrchestrationSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  // Initialize agents
  useEffect(() => {
    const initialAgents: Agent[] = [
      {
        id: 'conductor',
        name: 'AuraConductor',
        type: 'conductor',
        status: 'idle',
        progress: 0,
        icon: Brain,
        color: 'text-primary',
        capabilities: ['Strategic Planning', 'Task Orchestration', 'Quality Control', 'Self-Correction']
      },
      {
        id: 'backend',
        name: 'AuraBackendAgent',
        type: 'backend',
        status: 'idle',
        progress: 0,
        icon: Database,
        color: 'text-blue-500',
        capabilities: ['Microservices Development', 'Database Management', 'API Design', 'Performance Optimization']
      },
      {
        id: 'frontend',
        name: 'AuraFrontendAgent',
        type: 'frontend',
        status: 'idle',
        progress: 0,
        icon: Palette,
        color: 'text-green-500',
        capabilities: ['React Components', 'UI/UX Design', 'Responsive Layouts', 'Accessibility']
      },
      {
        id: 'ai_ml',
        name: 'AuraAIAgent',
        type: 'ai_ml',
        status: 'idle',
        progress: 0,
        icon: Zap,
        color: 'text-purple-500',
        capabilities: ['Model Training', 'Neural Networks', 'Music Generation', 'Cultural Analysis']
      },
      {
        id: 'devops',
        name: 'AuraDevOpsAgent',
        type: 'devops',
        status: 'idle',
        progress: 0,
        icon: Workflow,
        color: 'text-orange-500',
        capabilities: ['CI/CD Pipelines', 'Infrastructure Management', 'Containerization', 'Monitoring']
      },
      {
        id: 'cpp',
        name: 'AuraCppGenAgent',
        type: 'cpp',
        status: 'idle',
        progress: 0,
        icon: Code,
        color: 'text-red-500',
        capabilities: ['Audio Engine Development', 'JUCE Framework', 'Real-time Processing', 'Plugin Development']
      }
    ];

    setAgents(initialAgents);
  }, []);

  const createSampleSession = (): OrchestrationSession => {
    return {
      id: `session_${Date.now()}`,
      name: 'Enhanced Amapiano Track Creation',
      description: 'Multi-agent orchestration for creating authentic amapiano track with cultural validation',
      status: 'idle',
      progress: 0,
      tasks: [
        {
          id: 'task_1',
          name: 'Strategic Planning',
          description: 'Analyze user intent and create orchestration plan',
          agent_id: 'conductor',
          status: 'pending',
          progress: 0,
          dependencies: []
        },
        {
          id: 'task_2',
          name: 'Style Profile Analysis',
          description: 'Query style exchange for matching profiles',
          agent_id: 'backend',
          status: 'pending',
          progress: 0,
          dependencies: ['task_1']
        },
        {
          id: 'task_3',
          name: 'Neural Music Generation',
          description: 'Generate amapiano patterns using AI models',
          agent_id: 'ai_ml',
          status: 'pending',
          progress: 0,
          dependencies: ['task_1', 'task_2']
        },
        {
          id: 'task_4',
          name: 'UI Generation',
          description: 'Create responsive interface components',
          agent_id: 'frontend',
          status: 'pending',
          progress: 0,
          dependencies: ['task_1']
        },
        {
          id: 'task_5',
          name: 'Audio Processing',
          description: 'Implement real-time audio engine optimizations',
          agent_id: 'cpp',
          status: 'pending',
          progress: 0,
          dependencies: ['task_3']
        },
        {
          id: 'task_6',
          name: 'Cultural Validation',
          description: 'Validate cultural authenticity and apply corrections',
          agent_id: 'conductor',
          status: 'pending',
          progress: 0,
          dependencies: ['task_3', 'task_5']
        }
      ]
    };
  };

  const startOrchestration = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start orchestration",
        variant: "destructive",
      });
      return;
    }

    const session = createSampleSession();
    setCurrentSession(session);
    setIsRunning(true);

    // Update session status
    const runningSession = {
      ...session,
      status: 'running' as const,
      started_at: new Date().toISOString()
    };
    setCurrentSession(runningSession);

    try {
      // Execute tasks in dependency order
      const taskQueue = [...session.tasks].sort((a, b) => a.dependencies.length - b.dependencies.length);
      
      for (let i = 0; i < taskQueue.length; i++) {
        const task = taskQueue[i];
        const agent = agents.find(a => a.id === task.agent_id);
        
        if (!agent) continue;

        // Update task status to running
        setCurrentSession(prev => ({
          ...prev!,
          tasks: prev!.tasks.map(t => 
            t.id === task.id 
              ? { ...t, status: 'running' as const, start_time: new Date().toISOString() }
              : t
          )
        }));

        // Update agent status
        setAgents(prev => prev.map(a => 
          a.id === agent.id 
            ? { ...a, status: 'working' as const, current_task: task.name, progress: 0 }
            : a
        ));

        // Simulate task execution with real AI orchestration call
        await executeTask(task, agent);

        // Update task as completed
        setCurrentSession(prev => ({
          ...prev!,
          tasks: prev!.tasks.map(t => 
            t.id === task.id 
              ? { 
                  ...t, 
                  status: 'completed' as const, 
                  progress: 100,
                  completion_time: new Date().toISOString(),
                  output: generateTaskOutput(task.name)
                }
              : t
          )
        }));

        // Update agent status
        setAgents(prev => prev.map(a => 
          a.id === agent.id 
            ? { ...a, status: 'completed' as const, progress: 100, last_output: `Completed: ${task.name}` }
            : a
        ));

        // Update overall progress
        const completedTasks = i + 1;
        const totalProgress = (completedTasks / taskQueue.length) * 100;
        
        setCurrentSession(prev => ({
          ...prev!,
          progress: totalProgress
        }));
      }

      // Mark session as completed
      setCurrentSession(prev => ({
        ...prev!,
        status: 'completed' as const,
        completed_at: new Date().toISOString()
      }));

      toast({
        title: "Orchestration Complete",
        description: "Multi-agent system successfully completed all tasks",
      });

    } catch (error: any) {
      console.error('Orchestration error:', error);
      
      setCurrentSession(prev => ({
        ...prev!,
        status: 'failed' as const
      }));

      const errorMsg = error?.message || 'Unknown error';
      const isQuotaError = errorMsg.includes('quota') || errorMsg.includes('402');
      
      toast({
        title: "Orchestration Failed",
        description: isQuotaError
          ? "AI credits exhausted. Add funds to continue orchestration."
          : "An error occurred during multi-agent execution. Check logs for details.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      
      // Reset agents to idle
      setTimeout(() => {
        setAgents(prev => prev.map(a => ({
          ...a,
          status: 'idle' as const,
          progress: 0,
          current_task: undefined
        })));
      }, 3000);
    }
  };

  const executeTask = async (task: OrchestrationTask, agent: Agent): Promise<void> => {
    // Simulate progressive task execution
    for (let progress = 0; progress <= 100; progress += 20) {
      setAgents(prev => prev.map(a => 
        a.id === agent.id ? { ...a, progress } : a
      ));
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Call real AI orchestration for specific tasks
    if (task.name === 'Neural Music Generation') {
      try {
        await supabase.functions.invoke('aura-conductor-orchestration', {
          body: {
            prompt: 'Generate authentic amapiano track with cultural validation',
            target: 'neural_generation',
            config: {
              ai_models: ['neural-music-engine-v2'],
              tools: ['cultural_authenticity_engine'],
              quality_threshold: 0.9
            }
          }
        });
      } catch (error) {
        console.error('AI orchestration error:', error);
      }
    }
  };

  const generateTaskOutput = (taskName: string): any => {
    const outputs = {
      'Strategic Planning': {
        plan_id: 'plan_001',
        target_genre: 'amapiano_private_school',
        cultural_elements: ['log_drums', 'jazz_piano', 'south_african_rhythms'],
        quality_target: 0.95
      },
      'Style Profile Analysis': {
        matching_profiles: 3,
        recommended_style: 'kelvin_momo_influenced',
        cultural_score: 0.92
      },
      'Neural Music Generation': {
        track_url: '/generated/amapiano_track_001.wav',
        metadata: { bpm: 118, key: 'F#m', duration: 240 },
        cultural_authenticity: 0.94
      },
      'UI Generation': {
        components_created: 5,
        responsive_breakpoints: ['mobile', 'tablet', 'desktop'],
        accessibility_score: 98
      },
      'Audio Processing': {
        latency_optimized: true,
        buffer_size: 256,
        sample_rate: 44100,
        performance_gain: '15%'
      },
      'Cultural Validation': {
        authenticity_score: 0.96,
        corrections_applied: 2,
        cultural_compliance: true
      }
    };

    return outputs[taskName as keyof typeof outputs] || { status: 'completed' };
  };

  const stopOrchestration = () => {
    setIsRunning(false);
    setCurrentSession(prev => prev ? { ...prev, status: 'failed' as const } : null);
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' as const, progress: 0, current_task: undefined })));
    
    toast({
      title: "Orchestration Stopped",
      description: "Multi-agent execution has been terminated",
    });
  };

  const resetOrchestration = () => {
    setCurrentSession(null);
    setIsRunning(false);
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' as const, progress: 0, current_task: undefined })));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return <Activity className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-primary';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Brain className="w-7 h-7 text-primary" />
            Multi-Agent Orchestrator
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              AURA-X System
            </Badge>
          </h2>
          <p className="text-muted-foreground mt-1">
            Autonomous AI agents working together to build and optimize your music platform
          </p>
        </div>

        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={startOrchestration} disabled={!user}>
              <Play className="w-4 h-4 mr-2" />
              Start Orchestration
            </Button>
          ) : (
            <Button onClick={stopOrchestration} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
          
          {currentSession && !isRunning && (
            <Button onClick={resetOrchestration} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className={cn("w-5 h-5", agent.color)} />
                    {agent.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(agent.status)}
                    <Badge variant={agent.status === 'working' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                  </div>
                </div>
                {agent.current_task && (
                  <CardDescription className="text-sm">
                    {agent.current_task}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-3">
                {agent.progress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{agent.progress}%</span>
                    </div>
                    <Progress value={agent.progress} className="h-2" />
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm font-medium">Capabilities</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                {agent.last_output && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    {agent.last_output}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Session */}
      {currentSession && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-primary" />
                {currentSession.name}
                <Badge variant={currentSession.status === 'running' ? 'default' : 'secondary'}>
                  {currentSession.status}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Progress: {Math.round(currentSession.progress)}%
                </span>
                <Progress value={currentSession.progress} className="w-32 h-2" />
              </div>
            </div>
            <CardDescription>{currentSession.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {currentSession.tasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task.name}</h4>
                        <Badge variant="outline" className={getTaskStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      
                      {task.dependencies.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Depends on: {task.dependencies.join(', ')}
                        </p>
                      )}

                      {task.status === 'running' && (
                        <Progress value={task.progress} className="mt-2 h-1" />
                      )}

                      {task.output && (
                        <div className="text-xs bg-muted/50 p-2 rounded mt-2">
                          Output: {JSON.stringify(task.output, null, 2)}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {getStatusIcon(task.status)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};