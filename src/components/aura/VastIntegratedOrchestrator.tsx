/**
 * VAST-Integrated AURA Orchestrator
 * Combines Agent Lifecycle, DataSpace, EventProcessor, and AuraBridge
 * for enterprise-scale AI orchestration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Database, 
  Zap, 
  Activity, 
  Sparkles,
  TrendingUp,
  Network,
  Layers
} from "lucide-react";
import { useDataSpace } from '@/hooks/useDataSpace';
import { useMCPServer } from '@/hooks/useMCPServer';
import { AuraBridge } from '@/lib/AuraBridge';
import { getEventProcessor, EventTypes } from '@/lib/EventProcessor';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface VastIntegratedOrchestratorProps {
  user: User | null;
}

export const VastIntegratedOrchestrator: React.FC<VastIntegratedOrchestratorProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('orchestrator');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orchestrationProgress, setOrchestrationProgress] = useState(0);
  
  // VAST Components
  const dataSpace = useDataSpace('aura-orchestrator');
  const mcpServer = useMCPServer();
  const eventProcessor = getEventProcessor();
  const { toast } = useToast();

  // Metrics tracking
  const [metrics, setMetrics] = useState({
    totalOperations: 0,
    successRate: 0,
    avgLatency: 0,
    activeAgents: 0
  });

  useEffect(() => {
    if (dataSpace.isReady) {
      console.log('✅ DataSpace ready for AURA orchestration');
    }
  }, [dataSpace.isReady]);

  useEffect(() => {
    // Subscribe to orchestration events
    eventProcessor.on(
      /^orchestration\./,
      'high',
      async (event) => {
        console.log('📡 Orchestration event:', event);
        
        if (event.type === EventTypes.AI_GENERATION_COMPLETE) {
          toast({
            title: "Generation Complete",
            description: "AI orchestration finished successfully",
          });
        }
      }
    );
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const bridgeMetrics = AuraBridge.getMetrics();
      const processingStats = eventProcessor.getStats();
      
      setMetrics({
        totalOperations: bridgeMetrics.total,
        successRate: bridgeMetrics.successRate,
        avgLatency: bridgeMetrics.avgLatency,
        activeAgents: mcpServer.isInitialized ? 1 : 0
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [mcpServer.isInitialized]);

  const runIntelligentOrchestration = async (prompt: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use AI orchestration",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setOrchestrationProgress(0);

    try {
      // Step 1: Initialize MCP Agent (10%)
      console.log('🤖 Step 1: Initializing AI Agent...');
      if (!mcpServer.isInitialized) {
        await mcpServer.initializeSession();
      }
      setOrchestrationProgress(10);

      // Dispatch orchestration start event
      await eventProcessor.dispatch({
        type: EventTypes.AI_GENERATION_START,
        priority: 'high',
        payload: { prompt, userId: user.id },
        source: 'aura_orchestrator'
      });

      // Step 2: Get AI suggestions via Lovable AI (30%)
      console.log('💡 Step 2: Getting AI suggestions...');
      const suggestions = await AuraBridge.call({
        function_name: 'aura-ai-suggestions',
        body: {
          context: {
            user_intent: prompt,
            genre: 'amapiano',
            bpm: 118
          },
          suggestion_type: 'full_analysis'
        }
      });
      setOrchestrationProgress(30);

      // Step 3: Execute MCP orchestration request (60%)
      console.log('🎼 Step 3: Executing orchestration...');
      const orchestrationResult = await mcpServer.executeRequest({
        prompt,
        context: {
          suggestions: suggestions.suggestions,
          session_context: mcpServer.context?.context
        }
      });
      setOrchestrationProgress(60);

      // Step 4: Store results in DataSpace (80%)
      console.log('💾 Step 4: Storing in DataSpace...');
      const projectData = {
        name: `Orchestration_${Date.now()}`,
        orchestration_data: orchestrationResult,
        ai_suggestions: suggestions,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      await dataSpace.execute({
        collection: 'projects',
        operation: 'create',
        data: projectData
      });
      setOrchestrationProgress(80);

      // Step 5: Log completion event (100%)
      console.log('📊 Step 5: Logging completion...');
      await dataSpace.logEvent('orchestration_complete', {
        project_id: projectData.name,
        suggestions_count: suggestions.suggestions?.length || 0,
        metrics: AuraBridge.getMetrics()
      });

      await eventProcessor.dispatch({
        type: EventTypes.AI_GENERATION_COMPLETE,
        priority: 'normal',
        payload: { 
          success: true,
          projectName: projectData.name 
        },
        source: 'aura_orchestrator'
      });

      setOrchestrationProgress(100);

      toast({
        title: "🎉 Orchestration Complete!",
        description: `Generated with ${suggestions.suggestions?.length || 0} AI suggestions`,
      });

    } catch (error) {
      console.error('Orchestration error:', error);
      
      await eventProcessor.dispatch({
        type: 'orchestration.failed',
        priority: 'high',
        payload: { error: error instanceof Error ? error.message : 'Unknown error' },
        source: 'aura_orchestrator'
      });

      toast({
        title: "Orchestration Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Please sign in to access VAST-integrated orchestration</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with VAST Components Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            VAST-Integrated AURA Orchestrator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Database className={`w-8 h-8 mx-auto mb-2 ${dataSpace.isReady ? 'text-green-500' : 'text-gray-400'}`} />
              <div className="text-sm font-medium">DataSpace</div>
              <Badge variant={dataSpace.isReady ? 'default' : 'secondary'}>
                {dataSpace.isReady ? 'Ready' : 'Initializing'}
              </Badge>
            </div>

            <div className="text-center">
              <Brain className={`w-8 h-8 mx-auto mb-2 ${mcpServer.isInitialized ? 'text-green-500' : 'text-gray-400'}`} />
              <div className="text-sm font-medium">MCP Agent</div>
              <Badge variant={mcpServer.isInitialized ? 'default' : 'secondary'}>
                {mcpServer.isInitialized ? 'Active' : 'Idle'}
              </Badge>
            </div>

            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-sm font-medium">Event Pipeline</div>
              <Badge variant="default">
                {eventProcessor.getStats().totalProcessed} Events
              </Badge>
            </div>

            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-sm font-medium">AuraBridge</div>
              <Badge variant="default">
                {metrics.successRate.toFixed(0)}% Success
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Orchestration Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orchestrator">
            <Layers className="w-4 h-4 mr-2" />
            Orchestrator
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="architecture">
            <Network className="w-4 h-4 mr-2" />
            Architecture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orchestrator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Orchestration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Describe your amapiano track vision:
                </label>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-md"
                  placeholder="E.g., 'Create a smooth amapiano track with deep log drums, jazzy piano chords, and a groovy bassline at 118 BPM'"
                  id="orchestration-prompt"
                />
              </div>

              <Button
                onClick={() => {
                  const prompt = (document.getElementById('orchestration-prompt') as HTMLTextAreaElement)?.value;
                  if (prompt) runIntelligentOrchestration(prompt);
                }}
                disabled={isProcessing || !dataSpace.isReady}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isProcessing ? 'Orchestrating...' : 'Start VAST Orchestration'}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={orchestrationProgress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {orchestrationProgress}% Complete
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Operations</span>
                  <Badge>{metrics.totalOperations}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Success Rate</span>
                  <Badge variant="default">{metrics.successRate.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Latency</span>
                  <Badge variant="secondary">{metrics.avgLatency.toFixed(0)}ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active AI Agents</span>
                  <Badge variant={metrics.activeAgents > 0 ? 'default' : 'secondary'}>
                    {metrics.activeAgents}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Events Processed</span>
                  <Badge>{eventProcessor.getStats().totalProcessed}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>VAST Architecture Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold mb-1">Agent Lifecycle (MCP)</h4>
                <p className="text-sm text-muted-foreground">
                  Sense → Learn → Reason → Act paradigm for autonomous AI agents
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold mb-1">DataSpace</h4>
                <p className="text-sm text-muted-foreground">
                  Unified data layer with real-time sync and event pub/sub
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold mb-1">Event Processor</h4>
                <p className="text-sm text-muted-foreground">
                  Priority-based event queue with pattern matching
                </p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold mb-1">AuraBridge</h4>
                <p className="text-sm text-muted-foreground">
                  Unified API layer with automatic monitoring and metrics
                </p>
              </div>

              <div className="border-l-4 border-pink-500 pl-4">
                <h4 className="font-semibold mb-1">Lovable AI Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Powered by google/gemini-2.5-flash for intelligent suggestions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Powered By Badge */}
      <div className="text-center">
        <Badge variant="outline" className="gap-2">
          <Sparkles className="w-3 h-3" />
          Powered by VAST Architecture + Lovable AI
        </Badge>
      </div>
    </div>
  );
};
