import { useState, useEffect } from 'react';
import { useAutonomousAgent } from '@/hooks/useAutonomousAgent';
import { useAgentMemoryPersistence } from '@/hooks/useAgentMemoryPersistence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  RotateCcw, 
  Brain, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Activity,
  History,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AgentDemo = () => {
  const [goal, setGoal] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const {
    status,
    isExecuting,
    lastResult,
    events,
    memory,
    execute,
    reset,
    successRate
  } = useAutonomousAgent({
    maxIterations: 10,
    reflectionEnabled: true,
    autonomousMode: true
  });

  const {
    loadExecutionHistory,
    getSuccessRate: getPersistedSuccessRate
  } = useAgentMemoryPersistence();

  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [persistedSuccessRate, setPersistedSuccessRate] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const history = await loadExecutionHistory(user.id);
        setExecutionHistory(history);
        const rate = await getPersistedSuccessRate(user.id);
        setPersistedSuccessRate(rate);
      }
    };
    checkAuth();
  }, [loadExecutionHistory, getPersistedSuccessRate]);

  const handleExecute = async () => {
    if (!goal.trim()) return;
    await execute(goal);
  };

  const handleReset = () => {
    reset();
    setGoal('');
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'idle': return 'secondary';
      case 'thinking': return 'default';
      case 'acting': return 'default';
      case 'reflecting': return 'default';
      case 'complete': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const exampleGoals = [
    'Generate Amapiano lyrics in Zulu about love and dancing',
    'Separate stems from an audio file and export as ZIP',
    'Create an authentic Johannesburg-style Amapiano track',
    'Analyze audio and apply Amapianorization with log drums'
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Autonomous Agent Demo
            </h1>
            <p className="text-muted-foreground mt-1">
              Test the ReAct loop, goal decomposition, and tool chaining
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-primary">
                {(persistedSuccessRate || successRate).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input & Control */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Goal Input
                </CardTitle>
                <CardDescription>
                  Enter a goal for the agent to accomplish
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="e.g., Create Amapiano track with Zulu lyrics"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  disabled={isExecuting}
                  onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExecute} 
                    disabled={isExecuting || !goal.trim()}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isExecuting ? 'Executing...' : 'Execute'}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Example goals:</p>
                  {exampleGoals.map((example, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2 px-3"
                      onClick={() => setGoal(example)}
                      disabled={isExecuting}
                    >
                      <span className="truncate">{example}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Agent Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">State</span>
                  <Badge variant={getStatusColor(status.state)}>
                    {status.state}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(status.progress)}%</span>
                  </div>
                  <Progress value={status.progress} />
                </div>

                {status.currentGoal && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Current Goal</p>
                    <p className="text-sm text-muted-foreground">{status.currentGoal}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Events & Results */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="events" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="events">
                  <Zap className="h-4 w-4 mr-2" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="result">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Result
                </TabsTrigger>
                <TabsTrigger value="memory">
                  <Brain className="h-4 w-4 mr-2" />
                  Memory
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="events">
                <Card className="h-[500px]">
                  <CardHeader>
                    <CardTitle>Execution Events</CardTitle>
                    <CardDescription>Real-time agent activity log</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[380px]">
                      {events.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No events yet. Execute a goal to see activity.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {events.map((event, i) => (
                            <div 
                              key={i} 
                              className="p-3 bg-muted rounded-lg text-sm"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {event.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                {typeof event.data === 'object' 
                                  ? JSON.stringify(event.data, null, 2)
                                  : String(event.data)
                                }
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="result">
                <Card className="h-[500px]">
                  <CardHeader>
                    <CardTitle>Execution Result</CardTitle>
                    <CardDescription>Final outcome of the agent's execution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!lastResult ? (
                      <div className="flex items-center justify-center h-[380px] text-muted-foreground">
                        No result yet. Execute a goal to see results.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          {lastResult.success ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                          )}
                          <span className="text-lg font-medium">
                            {lastResult.success ? 'Goal Achieved' : 'Execution Failed'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Tasks Completed</p>
                            <p className="text-2xl font-bold">
                              {lastResult.tasksCompleted}/{lastResult.totalTasks}
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="text-2xl font-bold flex items-center gap-1">
                              <Clock className="h-5 w-5" />
                              {(lastResult.executionTime / 1000).toFixed(1)}s
                            </p>
                          </div>
                        </div>

                        <ScrollArea className="h-[250px]">
                          <div className="space-y-2">
                            <p className="font-medium">Outputs:</p>
                            <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                              {JSON.stringify(lastResult.outputs, null, 2)}
                            </pre>
                            
                            {Object.keys(lastResult.errors).length > 0 && (
                              <>
                                <p className="font-medium text-destructive">Errors:</p>
                                <pre className="p-3 bg-destructive/10 rounded-lg text-xs text-destructive overflow-x-auto">
                                  {JSON.stringify(lastResult.errors, null, 2)}
                                </pre>
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="memory">
                <Card className="h-[500px]">
                  <CardHeader>
                    <CardTitle>Agent Memory</CardTitle>
                    <CardDescription>Short-term and long-term memory state</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!memory ? (
                      <div className="flex items-center justify-center h-[380px] text-muted-foreground">
                        No memory state. Execute a goal to see memory.
                      </div>
                    ) : (
                      <ScrollArea className="h-[380px]">
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium mb-2">Short-term Memory</p>
                            <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                              {JSON.stringify(Object.fromEntries(memory.shortTerm), null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="font-medium mb-2">Long-term Memory</p>
                            <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                              {JSON.stringify(memory.longTerm, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="font-medium mb-2">Working Context</p>
                            <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                              {JSON.stringify(memory.workingContext, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="h-[500px]">
                  <CardHeader>
                    <CardTitle>Execution History</CardTitle>
                    <CardDescription>Past agent executions (persisted)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!userId ? (
                      <div className="flex items-center justify-center h-[380px] text-muted-foreground">
                        Sign in to see execution history
                      </div>
                    ) : executionHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-[380px] text-muted-foreground">
                        No execution history yet
                      </div>
                    ) : (
                      <ScrollArea className="h-[380px]">
                        <div className="space-y-2">
                          {executionHistory.map((exec, i) => (
                            <div key={i} className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium truncate flex-1">
                                  {exec.goal?.slice(0, 50)}...
                                </span>
                                {exec.success ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{new Date(exec.created_at).toLocaleDateString()}</span>
                                {exec.duration_ms && (
                                  <span>{(exec.duration_ms / 1000).toFixed(1)}s</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDemo;
