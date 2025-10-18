/**
 * React Hook for DataSpace - Unified Data Layer
 */

import { useState, useEffect, useCallback } from 'react';
import { getDataSpace, type DataQuery, type DataSpaceEvent } from '@/lib/DataSpace';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useDataSpace = (namespace: string = 'aura-x') => {
  const [isReady, setIsReady] = useState(false);
  const [dataSpace, setDataSpace] = useState<ReturnType<typeof getDataSpace> | null>(null);

  useEffect(() => {
    const initDataSpace = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Initialize DataSpace
        const ds = getDataSpace({
          namespace,
          userId: user?.id,
          workspaceId: user?.id, // Use userId as workspace for now
        });

        setDataSpace(ds);
        setIsReady(true);
      } catch (error) {
        console.error('[useDataSpace] Initialization error:', error);
      }
    };

    initDataSpace();
  }, [namespace]);

  /**
   * Execute a data operation
   */
  const execute = useCallback(async <T = any>(query: DataQuery) => {
    if (!dataSpace) {
      toast({
        title: "DataSpace Not Ready",
        description: "Please wait for initialization",
        variant: "destructive",
      });
      return { data: null, error: new Error('DataSpace not initialized') };
    }

    return await dataSpace.execute<T>(query);
  }, [dataSpace]);

  /**
   * Subscribe to DataSpace events
   */
  const subscribe = useCallback((eventType: string, callback: (event: DataSpaceEvent) => void) => {
    if (!dataSpace) return () => {};
    return dataSpace.subscribe(eventType, callback);
  }, [dataSpace]);

  /**
   * Quick access methods
   */
  const getProjects = useCallback(async (filters?: Record<string, any>) => {
    return execute({
      collection: 'projects',
      operation: 'read',
      filters,
    });
  }, [execute]);

  const createProject = useCallback(async (data: any) => {
    return execute({
      collection: 'projects',
      operation: 'create',
      data,
    });
  }, [execute]);

  const updateProject = useCallback(async (id: string, data: any) => {
    return execute({
      collection: 'projects',
      operation: 'update',
      filters: { id },
      data,
    });
  }, [execute]);

  const deleteProject = useCallback(async (id: string) => {
    return execute({
      collection: 'projects',
      operation: 'delete',
      filters: { id },
    });
  }, [execute]);

  const searchProjects = useCallback(async (query: string) => {
    return execute({
      collection: 'projects',
      operation: 'search',
      filters: { query },
    });
  }, [execute]);

  const getSamples = useCallback(async (filters?: Record<string, any>) => {
    return execute({
      collection: 'samples',
      operation: 'read',
      filters,
    });
  }, [execute]);

  const searchSamples = useCallback(async (query: string) => {
    return execute({
      collection: 'samples',
      operation: 'search',
      filters: { query },
    });
  }, [execute]);

  const logEvent = useCallback(async (type: string, data: any) => {
    return execute({
      collection: 'events',
      operation: 'create',
      data: { type, ...data },
    });
  }, [execute]);

  return {
    isReady,
    dataSpace,
    execute,
    subscribe,
    // Quick access methods
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    searchProjects,
    getSamples,
    searchSamples,
    logEvent,
  };
};
