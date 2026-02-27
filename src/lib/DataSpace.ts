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

export interface DataSpaceResponse<T = any> {
  data: T | null;
  error: Error | null;
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
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private queryBatcher: Map<string, Promise<any>> = new Map();

  constructor(config: DataSpaceConfig) {
    this.config = config;
    this.setupRealtimeSync();
    // Clean cache periodically
    setInterval(() => this.cleanCache(), 60000);
  }

  private cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  private getCacheKey(query: DataQuery): string {
    return JSON.stringify({
      collection: query.collection,
      operation: query.operation,
      filters: query.filters,
      limit: query.limit
    });
  }

  /**
   * Universal data access method - handles all CRUD operations
   */
  async execute<T = any>(query: DataQuery): Promise<DataSpaceResponse<T>> {
    try {
      // Check cache for read/search operations
      if (query.operation === 'read' || query.operation === 'search') {
        const cacheKey = this.getCacheKey(query);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          console.log(`[DataSpace] Cache hit for ${query.collection}.${query.operation}`);
          return { data: cached.data as T, error: null };
        }

        // Batch concurrent identical queries
        if (this.queryBatcher.has(cacheKey)) {
          console.log(`[DataSpace] Deduplicating query for ${query.collection}`);
          const result = await this.queryBatcher.get(cacheKey);
          return { data: result as T, error: null };
        }
      }

      console.log(`[DataSpace] Executing ${query.operation} on ${query.collection}`);

      let resultPromise: Promise<DataSpaceResponse<T>>;

      switch (query.collection) {
        case 'projects':
          resultPromise = this.handleProjects(query);
          break;
        case 'samples':
          resultPromise = this.handleSamples(query);
          break;
        case 'patterns':
          resultPromise = this.handlePatterns(query);
          break;
        case 'plugins':
          resultPromise = this.handlePlugins(query);
          break;
        case 'events':
          resultPromise = this.handleEvents(query);
          break;
        default:
          throw new Error(`Unknown collection: ${query.collection}`);
      }

      // Store in batcher for read/search operations
      if (query.operation === 'read' || query.operation === 'search') {
        const cacheKey = this.getCacheKey(query);
        this.queryBatcher.set(cacheKey, resultPromise.then(r => r.data));
      }

      const result = await resultPromise;

      // Cache successful read/search results
      if (result.data && (query.operation === 'read' || query.operation === 'search')) {
        const cacheKey = this.getCacheKey(query);
        this.cache.set(cacheKey, { data: result.data, timestamp: Date.now() });
        this.queryBatcher.delete(cacheKey);
      } else if (query.operation !== 'read' && query.operation !== 'search') {
        // Invalidate cache on mutations
        this.cache.clear();
      }

      return result;
    } catch (error: any) {
      console.error('[DataSpace] Execution error:', error);
      return { data: null, error };
    }
  }

  /**
   * Clear cache manually
   */
  clearCache() {
    this.cache.clear();
    this.queryBatcher.clear();
    console.log('[DataSpace] Cache cleared');
  }

  /**
   * Handle DAW projects operations
   */
  private async handleProjects(query: DataQuery): Promise<DataSpaceResponse> {
    const table = supabase.from('daw_projects');

    switch (query.operation) {
      case 'create':
        const createResult = await table.insert(query.data).select().single();
        if (!createResult.error) {
          this.emit({ type: 'project.created', collection: 'projects', data: createResult.data, timestamp: Date.now() });
        }
        return { data: createResult.data, error: createResult.error ? new Error(createResult.error.message) : null };

      case 'read':
        let selectQuery: any = table.select('*');
        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            selectQuery = selectQuery.eq(key, value);
          });
        }
        if (query.limit) selectQuery = selectQuery.limit(query.limit);
        if (query.offset) selectQuery = selectQuery.range(query.offset, query.offset + (query.limit || 10) - 1);
        const readResult = await selectQuery;
        return { data: readResult.data, error: readResult.error ? new Error(readResult.error.message) : null };

      case 'update':
        const updateResult = await table.update(query.data).eq('id', query.filters?.id).select().single();
        if (!updateResult.error) {
          this.emit({ type: 'project.updated', collection: 'projects', data: updateResult.data, timestamp: Date.now() });
        }
        return { data: updateResult.data, error: updateResult.error ? new Error(updateResult.error.message) : null };

      case 'delete':
        const deleteResult = await table.delete().eq('id', query.filters?.id);
        if (!deleteResult.error) {
          this.emit({ type: 'project.deleted', collection: 'projects', data: query.filters, timestamp: Date.now() });
        }
        return { data: null, error: deleteResult.error ? new Error(deleteResult.error.message) : null };

      case 'search':
        const searchResult = await table.select('*').ilike('name', `%${query.filters?.query}%`);
        return { data: searchResult.data, error: searchResult.error ? new Error(searchResult.error.message) : null };

      default:
        throw new Error(`Unknown operation: ${query.operation}`);
    }
  }

  /**
   * Handle samples operations
   */
  private async handleSamples(query: DataQuery): Promise<DataSpaceResponse> {
    const table = supabase.from('samples');

    switch (query.operation) {
      case 'create':
        const createResult = await table.insert(query.data).select().single();
        return { data: createResult.data, error: createResult.error ? new Error(createResult.error.message) : null };
      case 'read':
        let selectQuery2: any = table.select('*');
        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            selectQuery2 = selectQuery2.eq(key, value);
          });
        }
        const readResult = await selectQuery2;
        return { data: readResult.data, error: readResult.error ? new Error(readResult.error.message) : null };
      case 'search':
        const searchResult = await table.select('*').or(`name.ilike.%${query.filters?.query}%,tags.cs.{${query.filters?.query}}`);
        return { data: searchResult.data, error: searchResult.error ? new Error(searchResult.error.message) : null };
      default:
        return { data: null, error: new Error('Operation not implemented') };
    }
  }

  /**
   * Handle patterns operations
   */
  private async handlePatterns(query: DataQuery): Promise<DataSpaceResponse> {
    const table = supabase.from('drum_patterns' as any);

    switch (query.operation) {
      case 'create': {
        const result = await table.insert(query.data).select().single();
        return { data: result.data, error: result.error ? new Error(result.error.message) : null };
      }
      case 'read': {
        let q: any = table.select('*');
        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            q = q.eq(key, value);
          });
        }
        if (query.limit) q = q.limit(query.limit);
        const result = await q;
        // If the table doesn't exist yet, return an empty array rather than propagating the error
        if (result.error) return { data: [], error: null };
        return { data: result.data, error: null };
      }
      case 'search': {
        const result = await (table as any).select('*').ilike('name', `%${query.filters?.query}%`);
        if (result.error) return { data: [], error: null };
        return { data: result.data, error: null };
      }
      default:
        return { data: [], error: null };
    }
  }

  /**
   * Handle plugins operations
   */
  private async handlePlugins(query: DataQuery): Promise<DataSpaceResponse> {
    const table = supabase.from('audio_plugins' as any);

    switch (query.operation) {
      case 'create': {
        const result = await table.insert(query.data).select().single();
        return { data: result.data, error: result.error ? new Error(result.error.message) : null };
      }
      case 'read': {
        let q: any = table.select('*');
        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            q = q.eq(key, value);
          });
        }
        if (query.limit) q = q.limit(query.limit);
        const result = await q;
        // If the table doesn't exist yet, return an empty array rather than propagating the error
        if (result.error) return { data: [], error: null };
        return { data: result.data, error: null };
      }
      case 'search': {
        const result = await (table as any).select('*').ilike('name', `%${query.filters?.query}%`);
        if (result.error) return { data: [], error: null };
        return { data: result.data, error: null };
      }
      default:
        return { data: [], error: null };
    }
  }

  /**
   * Handle events operations (logging and analytics)
   */
  private async handleEvents(query: DataQuery): Promise<DataSpaceResponse> {
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
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      pending: this.queryBatcher.size,
      hitRate: this.cache.size > 0 ? 'Available' : 'No data'
    };
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
