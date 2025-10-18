/**
 * VAST-Inspired Architecture Demo
 * Showcases Agent Lifecycle, DataSpace, Event Processing, Vector Search, and Workspaces
 */

import { useState, useEffect } from 'react';
import { useMCPServer } from '@/hooks/useMCPServer';
import { useDataSpace } from '@/hooks/useDataSpace';
import { useVectorSearch } from '@/hooks/useVectorSearch';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getEventProcessor, EventTypes } from '@/lib/EventProcessor';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Brain, 
  Database, 
  Search, 
  Users, 
  Zap,
  TrendingUp,
  Cpu,
  Network
} from 'lucide-react';
import { WorkspaceManager } from '@/components/WorkspaceManager';

export default function VASTDemo() {
  const { agent, agentState, isInitialized, initializeSession } = useMCPServer();
  const { isReady, getProjects, getSamples, logEvent, execute } = useDataSpace();
  const { searchSimilar, searchByExample, results, isSearching } = useVectorSearch();
  const { currentWorkspace, workspaces, members } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [eventStats, setEventStats] = useState<any>(null);
  const [projectCount, setProjectCount] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);

  // Initialize MCP and DataSpace
  useEffect(() => {
    if (!isInitialized) {
      initializeSession();
    }
  }, [isInitialized, initializeSession]);

  // Setup event processor monitoring
  useEffect(() => {
    const processor = getEventProcessor();
    
    // Update stats every 2 seconds
    const interval = setInterval(() => {
      setEventStats(processor.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Load data counts
  useEffect(() => {
    if (isReady) {
      getProjects().then(result => {
        if (result.data) setProjectCount(result.data.length);
      });
      getSamples().then(result => {
        if (result.data) setSampleCount(result.data.length);
      });
    }
  }, [isReady, getProjects, getSamples]);

  // Demo: Simulate agent sensing
  const simulateAudioEvent = () => {
    const processor = getEventProcessor();
    processor.dispatch({
      type: EventTypes.AUDIO_INPUT,
      priority: 'high',
      payload: { amplitude: Math.random(), frequency: 440 + Math.random() * 100 },
      source: 'demo',
    });

    if (agent) {
      agent.sense({
        type: 'audio',
        timestamp: Date.now(),
        payload: { demo: true },
      });
    }
  };

  // Demo: Simulate MIDI event
  const simulateMIDIEvent = () => {
    const processor = getEventProcessor();
    processor.dispatch({
      type: EventTypes.MIDI_NOTE_ON,
      priority: 'high',
      payload: { note: 60, velocity: 100 },
      source: 'demo',
    });

    if (agent) {
      agent.sense({
        type: 'midi',
        timestamp: Date.now(),
        payload: { note: 60 },
      });
    }
  };

  // Demo: Log analytics event
  const logDemoEvent = async () => {
    await logEvent('demo.interaction', { action: 'button_click', timestamp: Date.now() });
  };

  // Demo: Vector search
  const handleVectorSearch = async () => {
    if (!searchQuery.trim()) return;
    await searchSimilar(searchQuery, 'sample');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            VAST-Inspired Architecture Demo
          </h1>
          <p className="text-muted-foreground">
            Agentic Computing • Unified Data Layer • Event Processing • Vector Search • Multi-Tenancy
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
              <Brain className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{agentState}</div>
              <Badge variant={isInitialized ? "default" : "secondary"} className="mt-2">
                {isInitialized ? "Active" : "Inactive"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">DataSpace</CardTitle>
              <Database className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectCount + sampleCount}</div>
              <p className="text-xs text-muted-foreground">
                {projectCount} projects, {sampleCount} samples
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Event Pipeline</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventStats?.totalProcessed || 0}</div>
              <p className="text-xs text-muted-foreground">
                {eventStats?.averageLatency?.toFixed(2) || 0}ms avg latency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="agent" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="agent">
              <Brain className="h-4 w-4 mr-2" />
              Agent
            </TabsTrigger>
            <TabsTrigger value="dataspace">
              <Database className="h-4 w-4 mr-2" />
              DataSpace
            </TabsTrigger>
            <TabsTrigger value="events">
              <Activity className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="vector">
              <Search className="h-4 w-4 mr-2" />
              Vector Search
            </TabsTrigger>
            <TabsTrigger value="workspace">
              <Users className="h-4 w-4 mr-2" />
              Workspaces
            </TabsTrigger>
          </TabsList>

          {/* Agent Lifecycle Tab */}
          <TabsContent value="agent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Agent Lifecycle: Sense → Learn → Reason → Act
                </CardTitle>
                <CardDescription>
                  VAST-inspired agentic computing with autonomous decision-making
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={simulateAudioEvent} variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Simulate Audio Event
                  </Button>
                  <Button onClick={simulateMIDIEvent} variant="outline">
                    <Cpu className="h-4 w-4 mr-2" />
                    Simulate MIDI Event
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Agent State Machine</h4>
                  <div className="flex items-center gap-2">
                    {['idle', 'sensing', 'learning', 'reasoning', 'acting'].map(state => (
                      <Badge
                        key={state}
                        variant={agentState === state ? "default" : "outline"}
                        className="capitalize"
                      >
                        {state}
                      </Badge>
                    ))}
                  </div>
                </div>

                {agent && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Learning Context</h4>
                    <p className="text-sm text-muted-foreground">
                      Patterns: {agent.getContext().patterns.length} •
                      Preferences: {Object.keys(agent.getContext().userPreferences).length} •
                      Metrics: {Object.keys(agent.getContext().performanceMetrics).length}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DataSpace Tab */}
          <TabsContent value="dataspace" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  DataSpace: Unified Data Layer
                </CardTitle>
                <CardDescription>
                  Single API for all data operations across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-1">Projects</h4>
                    <p className="text-3xl font-bold text-primary">{projectCount}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-1">Samples</h4>
                    <p className="text-3xl font-bold text-primary">{sampleCount}</p>
                  </div>
                </div>

                <Button onClick={logDemoEvent} variant="outline" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Log Analytics Event
                </Button>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">DataSpace Status</h4>
                  <Badge variant={isReady ? "default" : "secondary"}>
                    {isReady ? "Ready" : "Initializing"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Event Processing Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Event Processing Pipeline
                </CardTitle>
                <CardDescription>
                  Real-time event orchestration with priority-based processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {eventStats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-semibold mb-1">Total Processed</h4>
                      <p className="text-2xl font-bold text-primary">{eventStats.totalProcessed}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-semibold mb-1">Avg Latency</h4>
                      <p className="text-2xl font-bold text-primary">
                        {eventStats.averageLatency.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-semibold mb-1">Failed Events</h4>
                      <p className="text-2xl font-bold text-destructive">{eventStats.failedEvents}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-semibold mb-1">Event Types</h4>
                      <p className="text-2xl font-bold text-primary">
                        {Object.keys(eventStats.eventsByType).length}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Priority Queue</h4>
                  <div className="flex gap-2">
                    <Badge variant="destructive">Critical</Badge>
                    <Badge variant="default">High</Badge>
                    <Badge variant="secondary">Normal</Badge>
                    <Badge variant="outline">Low</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vector Search Tab */}
          <TabsContent value="vector" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Musical Vector Database
                </CardTitle>
                <CardDescription>
                  Semantic search across samples, patterns, and plugins
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for similar sounds... (e.g., 'amapiano log drum')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleVectorSearch()}
                  />
                  <Button onClick={handleVectorSearch} disabled={isSearching}>
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>

                {results.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Search Results ({results.length})</h4>
                    {results.map((result, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{result.entityType}</p>
                          <p className="text-sm text-muted-foreground">
                            Similarity: {(result.similarity * 100).toFixed(1)}%
                          </p>
                        </div>
                        <Badge variant="outline">{result.entityId.slice(0, 8)}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {results.length === 0 && searchQuery && !isSearching && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No similar content found. Try a different search query.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Multi-Tenancy & Workspaces
                </CardTitle>
                <CardDescription>
                  Team collaboration with granular permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentWorkspace && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h4 className="font-semibold mb-2">Current Workspace</h4>
                    <p className="text-lg">{currentWorkspace.name}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        <Network className="h-3 w-3 mr-1" />
                        {members.length} members
                      </Badge>
                      <Badge variant="outline">
                        {workspaces.length} total workspaces
                      </Badge>
                    </div>
                  </div>
                )}

                <WorkspaceManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Architecture Overview */}
        <Card>
          <CardHeader>
            <CardTitle>VAST Architecture Components</CardTitle>
            <CardDescription>Enterprise-scale infrastructure inspired by VAST Data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Agent Lifecycle
                </h4>
                <p className="text-sm text-muted-foreground">
                  Autonomous AI agents with Sense → Learn → Reason → Act capabilities
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  DataSpace API
                </h4>
                <p className="text-sm text-muted-foreground">
                  Unified interface for storage, database, and application runtime
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Event Processor
                </h4>
                <p className="text-sm text-muted-foreground">
                  Real-time event orchestration with priority-based queuing
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Vector Database
                </h4>
                <p className="text-sm text-muted-foreground">
                  Semantic search with 1536-dimensional embeddings
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Multi-Tenancy
                </h4>
                <p className="text-sm text-muted-foreground">
                  Workspace isolation with role-based access control
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Network className="h-4 w-4 text-primary" />
                  Real-time Sync
                </h4>
                <p className="text-sm text-muted-foreground">
                  Sub-100ms data propagation across all clients
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
