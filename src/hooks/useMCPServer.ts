/**
 * Model Context Protocol (MCP) Server Hook
 * Manages AI model orchestration and context management
 */

import { useState, useEffect, useCallback } from 'react';
import { AuraBridge } from '@/lib/AuraBridge';
import { toast } from '@/hooks/use-toast';

interface MCPContext {
  sessionId: string;
  context: Record<string, any>;
  activeModel: string;
  temperature: number;
}

interface MCPRequest {
  prompt: string;
  context?: Record<string, any>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface MCPResponse {
  result: string;
  model: string;
  tokensUsed: number;
  latency: number;
  contextUpdated: boolean;
}

export const useMCPServer = () => {
  const [context, setContext] = useState<MCPContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Initialize MCP session with persistent context
   */
  const initializeSession = useCallback(async () => {
    try {
      const sessionId = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newContext: MCPContext = {
        sessionId,
        context: {},
        activeModel: 'google/gemini-2.5-flash',
        temperature: 0.7,
      };

      setContext(newContext);
      setIsInitialized(true);
      
      // Store in localStorage for session persistence
      localStorage.setItem('mcp_context', JSON.stringify(newContext));
      
      toast({
        title: "MCP Server Initialized",
        description: "AI orchestration system ready",
      });
    } catch (error: any) {
      console.error('MCP initialization error:', error);
      toast({
        title: "Initialization Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, []);

  /**
   * Execute AI request through MCP with context management
   */
  const executeRequest = useCallback(async (request: MCPRequest): Promise<MCPResponse | null> => {
    if (!context) {
      toast({
        title: "MCP Not Initialized",
        description: "Please initialize the MCP server first",
        variant: "destructive",
      });
      return null;
    }

    setIsProcessing(true);

    try {
      // Merge request context with session context
      const mergedContext = {
        ...context.context,
        ...request.context,
        sessionId: context.sessionId,
      };

      // Route through AuraBridge for monitoring
      const response = await AuraBridge.call<MCPResponse>({
        function_name: 'neural-music-generation',
        body: {
          prompt: request.prompt,
          context: mergedContext,
          model: request.model || context.activeModel,
          temperature: request.temperature || context.temperature,
          maxTokens: request.maxTokens || 2000,
        },
      });

      // Update context if model provided new context
      if (response.contextUpdated) {
        const updatedContext = {
          ...context,
          context: mergedContext,
        };
        setContext(updatedContext);
        localStorage.setItem('mcp_context', JSON.stringify(updatedContext));
      }

      return response;
    } catch (error: any) {
      console.error('MCP execution error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [context]);

  /**
   * Update MCP context manually
   */
  const updateContext = useCallback((updates: Partial<Record<string, any>>) => {
    if (!context) return;

    const updatedContext = {
      ...context,
      context: {
        ...context.context,
        ...updates,
      },
    };

    setContext(updatedContext);
    localStorage.setItem('mcp_context', JSON.stringify(updatedContext));
  }, [context]);

  /**
   * Change active AI model
   */
  const setActiveModel = useCallback((model: string) => {
    if (!context) return;

    const updatedContext = {
      ...context,
      activeModel: model,
    };

    setContext(updatedContext);
    localStorage.setItem('mcp_context', JSON.stringify(updatedContext));
  }, [context]);

  /**
   * Clear context and reset session
   */
  const clearSession = useCallback(() => {
    setContext(null);
    setIsInitialized(false);
    localStorage.removeItem('mcp_context');
    
    toast({
      title: "Session Cleared",
      description: "MCP context has been reset",
    });
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mcp_context');
    if (stored) {
      try {
        const restored = JSON.parse(stored);
        setContext(restored);
        setIsInitialized(true);
      } catch (e) {
        console.warn('Failed to restore MCP context:', e);
      }
    }
  }, []);

  return {
    context,
    isInitialized,
    isProcessing,
    initializeSession,
    executeRequest,
    updateContext,
    setActiveModel,
    clearSession,
  };
};
