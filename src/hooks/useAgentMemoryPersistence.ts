/**
 * Hook for persisting agent memory to Supabase
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface AgentMemoryRecord {
  id?: string;
  user_id: string;
  memory_type: string;
  memory_key: string;
  memory_data: Json;
  importance_score?: number;
  access_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AgentExecutionRecord {
  id?: string;
  user_id: string;
  goal: string;
  decomposed_goal?: Json;
  execution_result?: Json;
  reflections?: Json;
  learnings?: Json;
  success: boolean;
  duration_ms?: number;
  created_at?: string;
}

export const useAgentMemoryPersistence = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveMemory = useCallback(async (memory: Omit<AgentMemoryRecord, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    try {
      const { data: existing } = await supabase
        .from('agent_memory')
        .select('id')
        .eq('user_id', memory.user_id)
        .eq('memory_key', memory.memory_key)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('agent_memory')
          .update({
            memory_type: memory.memory_type,
            memory_data: memory.memory_data,
            importance_score: memory.importance_score
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('agent_memory')
          .insert({
            user_id: memory.user_id,
            memory_type: memory.memory_type,
            memory_key: memory.memory_key,
            memory_data: memory.memory_data,
            importance_score: memory.importance_score
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to save agent memory:', error);
      toast({
        title: 'Memory Save Failed',
        description: 'Could not persist agent memory',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadMemory = useCallback(async (userId: string, memoryKey?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('agent_memory')
        .select('*')
        .eq('user_id', userId);

      if (memoryKey) {
        query = query.eq('memory_key', memoryKey);
      }

      const { data, error } = await query.order('importance_score', { ascending: false });

      if (error) throw error;
      return data as AgentMemoryRecord[];
    } catch (error) {
      console.error('Failed to load agent memory:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveExecution = useCallback(async (execution: Omit<AgentExecutionRecord, 'id' | 'created_at'>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_executions')
        .insert({
          user_id: execution.user_id,
          goal: execution.goal,
          decomposed_goal: execution.decomposed_goal,
          execution_result: execution.execution_result,
          reflections: execution.reflections,
          learnings: execution.learnings,
          success: execution.success,
          duration_ms: execution.duration_ms
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save agent execution:', error);
      toast({
        title: 'Execution Save Failed',
        description: 'Could not persist agent execution history',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadExecutionHistory = useCallback(async (userId: string, limit = 10) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AgentExecutionRecord[];
    } catch (error) {
      console.error('Failed to load execution history:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSuccessRate = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_executions')
        .select('success')
        .eq('user_id', userId);

      if (error) throw error;
      if (!data || data.length === 0) return 0;

      const successCount = data.filter(e => e.success).length;
      return (successCount / data.length) * 100;
    } catch (error) {
      console.error('Failed to calculate success rate:', error);
      return 0;
    }
  }, []);

  return {
    isLoading,
    saveMemory,
    loadMemory,
    saveExecution,
    loadExecutionHistory,
    getSuccessRate
  };
};
