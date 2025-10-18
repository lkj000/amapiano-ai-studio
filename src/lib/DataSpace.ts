/**
 * DataSpace - Unified Data Layer inspired by VAST
 * Single API for storage, database, and application runtime
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DataSpaceConfig {
  namespace: string;
  userId?: string;
  workspaceId?: string;
}

export interface DataQuery {
  collection: 'projects' | 'samples' | 'patterns' | 'plugins' | 'events';
  operation: 'create' | 'read' | 'update' | 'delete' | 'search';
  filters?: Record<string, any>;
  data?: any;
  limit?: number;
  offset?: number;
}

export interface DataSpaceEvent {
  type: string;
  collection: string;
  data: any;
  timestamp: number;
}

export class DataSpace {
  private config: DataSpaceConfig;
  private eventBuffer: DataSpaceEvent[] = [];
  private subscribers: Map<string, Set<(event: DataSpaceEvent) => void>> = new Map();

  constructor(config: DataSpaceConfig) {
    this.config = config;
    this.setupRealtimeSync();
  }

  /**
   * Universal data access method - handles all CRUD operations
   */
  async execute<T = any>(query: DataQuery): Promise<{ data: T | null; error: Error | null }> {
    try {
      console.log(`[DataSpace] Executing ${query.operation} on ${query.collection}`);

      switch (query.collection) {
        case 'projects':
          return await this.handleProjects(query);
        case 'samples':
          return await this.handleSamples(query);
        case 'patterns':
          return await this.handlePatterns(query);
        case 'plugins':
          return await this.handlePlugins(query);
        case 'events':
          return await this.handleEvents(query);
        default:
          throw new Error(`Unknown collection: ${query.collection}`);
      }
    } catch (error: any) {
      console.error('[DataSpace] Execution error:', error);
      return { data: null, error };
    }
  }

  /**
   * Handle DAW projects operations
   */
  private async handleProjects(query: DataQuery) {
    const table = supabase.from('daw_projects');

    switch (query.operation) {
      case 'create':
        const createResult = await table.insert(query.data).select().single();
        if (!createResult.error) {
          this.emit({ type: 'project.created', collection: 'projects', data: createResult.data, timestamp: Date.now() });
        }
        return createResult;

      case 'read':
        let selectQuery = table.select('*');
        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            selectQuery = selectQuery.eq(key, value);
          });
        }
        if (query.limit) selectQuery = selectQuery.limit(query.limit);
        if (query.offset) selectQuery = selectQuery.range(query.offset, query.offset + (query.limit || 10) - 1);
        return await selectQuery;

      case 'update':
        const updateResult = await table.update(query.data).eq('id', query.filters?.id).select().single();
        if (!updateResult.error) {
          this.emit({ type: 'project.updated', collection: 'projects', data: updateResult.data, timestamp: Date.now() });
        }
        return updateResult;

      case 'delete':
        const deleteResult = await table.delete().eq('id', query.filters?.id);
        if (!deleteResult.error) {
          this.emit({ type: 'project.deleted', collection: 'projects', data: query.filters, timestamp: Date.now() });
        }
        return deleteResult;

      case 'search':
        return await table.select('*').ilike('project_name', `%${query.filters?.query}%`);

      default:
        throw new Error(`Unknown operation: ${query.operation}`);
    }
  }

  /**
   * Handle samples operations
   */
  private async handleSamples(query: DataQuery) {
    const table = supabase.from('samples');

    switch (query.operation) {
      case 'create':
        return await table.insert(query.data).select().single();
      case 'read':
        let selectQuery = table.select('*');
        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            selectQuery = selectQuery.eq(key, value);
          });
        }
        return await selectQuery;
      case 'search':
        return await table.select('*').or(`name.ilike.%${query.filters?.query}%,tags.cs.{${query.filters?.query}}`);
      default:
        return { data: null, error: new Error('Operation not implemented') };
    }
  }

  /**
   * Handle patterns operations
   */
  private async handlePatterns(query: DataQuery) {
    // Similar pattern to samples
    return { data: null, error: new Error('Patterns operations not yet implemented') };
  }

  /**
   * Handle plugins operations
   */
  private async handlePlugins(query: DataQuery) {
    // Plugin management through DataSpace
    return { data: null, error: new Error('Plugin operations not yet implemented') };
  }

  /**
   * Handle events operations (logging and analytics)
   */
  private async handleEvents(query: DataQuery) {
    if (query.operation === 'create') {
      this.eventBuffer.push({
        type: query.data.type,
        collection: query.data.collection || 'general',
        data: query.data,
        timestamp: Date.now(),
      });

      // Batch insert events when buffer is full
      if (this.eventBuffer.length >= 50) {
        await this.flushEvents();
      }
    }

    return { data: { success: true }, error: null };
  }

  /**
   * Flush event buffer to database
   */
  private async flushEvents() {
    if (this.eventBuffer.length === 0) return;

    try {
      await supabase.from('analytics_events').insert(
        this.eventBuffer.map(e => ({
          user_id: this.config.userId,
          event_type: e.type,
          event_data: e.data,
          created_at: new Date(e.timestamp).toISOString(),
        }))
      );

      this.eventBuffer = [];
    } catch (error) {
      console.error('[DataSpace] Failed to flush events:', error);
    }
  }

  /**
   * Setup real-time synchronization across users
   */
  private setupRealtimeSync() {
    if (!this.config.workspaceId) return;

    // Subscribe to workspace changes
    supabase
      .channel(`workspace:${this.config.workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('[DataSpace] Real-time update:', payload);
        this.emit({
          type: `realtime.${payload.eventType}`,
          collection: payload.table,
          data: payload.new || payload.old,
          timestamp: Date.now(),
        });
      })
      .subscribe();
  }

  /**
   * Subscribe to DataSpace events
   */
  subscribe(eventType: string, callback: (event: DataSpaceEvent) => void) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  /**
   * Emit event to subscribers
   */
  private emit(event: DataSpaceEvent) {
    const subscribers = this.subscribers.get(event.type);
    if (subscribers) {
      subscribers.forEach(callback => callback(event));
    }

    // Also notify wildcard subscribers
    const wildcardSubs = this.subscribers.get('*');
    if (wildcardSubs) {
      wildcardSubs.forEach(callback => callback(event));
    }
  }

  /**
   * Get current namespace
   */
  getNamespace(): string {
    return this.config.namespace;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<DataSpaceConfig>) {
    this.config = { ...this.config, ...updates };
  }
}

// Singleton instance factory
let globalDataSpace: DataSpace | null = null;

export function getDataSpace(config?: DataSpaceConfig): DataSpace {
  if (!globalDataSpace && config) {
    globalDataSpace = new DataSpace(config);
  }
  if (!globalDataSpace) {
    throw new Error('DataSpace not initialized. Provide config on first call.');
  }
  return globalDataSpace;
}
