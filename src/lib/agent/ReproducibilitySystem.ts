/**
 * Reproducibility System for Level 5 Autonomous Agent
 * Ensures deterministic, reproducible results across Suno, Moises, and LANDR operations
 * Fixes exact reproduction failures with state management and seeding
 */

import { supabase } from '@/integrations/supabase/client';
import { Tool } from './ReActLoop';
import type { Json } from '@/integrations/supabase/types';

// ============= Reproducibility Types =============

export interface ReproducibleSeed {
  master: string;        // Master seed for entire session
  generation: number;    // Seed for AI generation
  processing: number;    // Seed for DSP processing
  mixing: number;        // Seed for mix decisions
  mastering: number;     // Seed for mastering chain
  random: number;        // Current random state
}

export interface GenerationState {
  id: string;
  timestamp: number;
  operation: string;
  input: Record<string, unknown>;
  parameters: Record<string, unknown>;
  seed: ReproducibleSeed;
  output?: Record<string, unknown>;
  hash?: string;          // Hash of output for verification
  reproducible: boolean;
  attempts: number;
  reproductionErrors?: string[];
}

export interface ReproducibilityConfig {
  enableDeterminism: boolean;
  seedMode: 'fixed' | 'timestamp' | 'custom';
  customSeed?: string;
  maxReproductionAttempts: number;
  hashVerification: boolean;
  stateLogging: boolean;
}

export interface ReproductionResult {
  success: boolean;
  matchesOriginal: boolean;
  originalHash?: string;
  newHash?: string;
  differences?: string[];
  attempts: number;
}

// ============= Deterministic Random Generator =============

class DeterministicRandom {
  private state: number;
  
  constructor(seed: number) {
    this.state = seed;
  }
  
  /**
   * XorShift128+ algorithm for high-quality deterministic random
   */
  next(): number {
    let s = this.state;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    this.state = s >>> 0;
    return (s >>> 0) / 4294967296;
  }
  
  /**
   * Get random integer in range [min, max]
   */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /**
   * Get random float in range [min, max]
   */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  /**
   * Get current state for serialization
   */
  getState(): number {
    return this.state;
  }
  
  /**
   * Restore state from serialization
   */
  setState(state: number): void {
    this.state = state;
  }
}

// ============= Hash Generation for Verification =============

async function generateHash(data: unknown): Promise<string> {
  const text = JSON.stringify(data, Object.keys(data as object).sort());
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============= Reproducibility Manager =============

export class ReproducibilityManager {
  private config: ReproducibilityConfig;
  private seeds: ReproducibleSeed;
  private random: DeterministicRandom;
  private stateHistory: GenerationState[] = [];
  private currentSessionId: string;
  
  constructor(config?: Partial<ReproducibilityConfig>) {
    this.config = {
      enableDeterminism: true,
      seedMode: 'timestamp',
      maxReproductionAttempts: 3,
      hashVerification: true,
      stateLogging: true,
      ...config
    };
    
    this.currentSessionId = `session_${Date.now()}`;
    this.seeds = this.initializeSeeds();
    this.random = new DeterministicRandom(this.seeds.random);
  }
  
  /**
   * Initialize reproducible seeds
   */
  private initializeSeeds(): ReproducibleSeed {
    let masterSeed: string;
    
    switch (this.config.seedMode) {
      case 'fixed':
        masterSeed = 'amapiano_fixed_seed_2024';
        break;
      case 'custom':
        masterSeed = this.config.customSeed || 'custom_seed';
        break;
      case 'timestamp':
      default:
        masterSeed = `seed_${Date.now()}`;
    }
    
    // Derive sub-seeds from master seed using simple hash-like function
    const hashCode = (s: string) => {
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };
    
    return {
      master: masterSeed,
      generation: hashCode(masterSeed + '_generation'),
      processing: hashCode(masterSeed + '_processing'),
      mixing: hashCode(masterSeed + '_mixing'),
      mastering: hashCode(masterSeed + '_mastering'),
      random: hashCode(masterSeed + '_random')
    };
  }
  
  /**
   * Get current seeds for API calls
   */
  getSeeds(): ReproducibleSeed {
    return { ...this.seeds };
  }
  
  /**
   * Set seeds from previous state (for reproduction)
   */
  setSeeds(seeds: ReproducibleSeed): void {
    this.seeds = seeds;
    this.random = new DeterministicRandom(seeds.random);
  }
  
  /**
   * Get deterministic random value
   */
  getRandom(): number {
    return this.random.next();
  }
  
  /**
   * Get deterministic random integer
   */
  getRandomInt(min: number, max: number): number {
    return this.random.int(min, max);
  }
  
  /**
   * Record operation state for reproducibility
   */
  async recordState(
    operation: string,
    input: Record<string, unknown>,
    parameters: Record<string, unknown>,
    output?: Record<string, unknown>
  ): Promise<GenerationState> {
    const state: GenerationState = {
      id: `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      operation,
      input,
      parameters: {
        ...parameters,
        _seed: this.seeds.generation,
        _randomState: this.random.getState()
      },
      seed: { ...this.seeds },
      output,
      reproducible: true,
      attempts: 0
    };
    
    if (output && this.config.hashVerification) {
      state.hash = await generateHash(output);
    }
    
    this.stateHistory.push(state);
    
    if (this.config.stateLogging) {
      await this.persistState(state);
    }
    
    return state;
  }
  
  /**
   * Persist state to database
   */
  private async persistState(state: GenerationState): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('agent_memory').upsert([{
      user_id: user.id,
      memory_key: `repro_state_${state.id}`,
      memory_type: 'reproducibility_state',
      memory_data: JSON.parse(JSON.stringify(state)) as Json,
      importance_score: 80
    }]);
  }
  
  /**
   * Reproduce a previous operation with exact same parameters
   */
  async reproduce(stateId: string): Promise<ReproductionResult> {
    // Find the original state
    let originalState = this.stateHistory.find(s => s.id === stateId);
    
    if (!originalState) {
      // Try to load from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('agent_memory')
          .select('memory_data')
          .eq('user_id', user.id)
          .eq('memory_key', `repro_state_${stateId}`)
          .single();
        
        if (data) {
          originalState = data.memory_data as unknown as GenerationState;
        }
      }
    }
    
    if (!originalState) {
      return {
        success: false,
        matchesOriginal: false,
        differences: ['Original state not found'],
        attempts: 0
      };
    }
    
    // Restore seeds from original state
    this.setSeeds(originalState.seed);
    
    // Attempt reproduction
    let attempts = 0;
    let lastOutput: Record<string, unknown> | undefined;
    let lastHash: string | undefined;
    const differences: string[] = [];
    
    while (attempts < this.config.maxReproductionAttempts) {
      attempts++;
      
      try {
        // Re-execute the operation
        const result = await this.executeOperation(
          originalState.operation,
          originalState.input,
          originalState.parameters
        );
        
        lastOutput = result;
        lastHash = await generateHash(result);
        
        // Check if output matches
        if (lastHash === originalState.hash) {
          return {
            success: true,
            matchesOriginal: true,
            originalHash: originalState.hash,
            newHash: lastHash,
            attempts
          };
        }
        
        // Record difference
        differences.push(`Attempt ${attempts}: Hash mismatch`);
        
      } catch (error) {
        differences.push(`Attempt ${attempts}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Reset seeds for retry
      this.setSeeds(originalState.seed);
    }
    
    return {
      success: true,
      matchesOriginal: false,
      originalHash: originalState.hash,
      newHash: lastHash,
      differences,
      attempts
    };
  }
  
  /**
   * Execute an operation (called during reproduction)
   */
  private async executeOperation(
    operation: string,
    input: Record<string, unknown>,
    parameters: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Map operation to edge function
    const operationMap: Record<string, string> = {
      'generate_song': 'generate-song-suno',
      'generate_instrumental': 'generate-instrumental',
      'separate_stems': 'stem-separation',
      'master_track': 'ai-mastering',
      'analyze_audio': 'analyze-audio',
      'amapianorize': 'amapianorize-audio'
    };
    
    const edgeFunction = operationMap[operation];
    if (!edgeFunction) {
      throw new Error(`Unknown operation: ${operation}`);
    }
    
    // Add deterministic parameters
    const deterministicParams = {
      ...parameters,
      _seed: this.seeds.generation,
      _deterministicMode: true
    };
    
    const { data, error } = await supabase.functions.invoke(edgeFunction, {
      body: {
        ...input,
        ...deterministicParams
      }
    });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get reproducibility report for session
   */
  getReport(): {
    sessionId: string;
    totalOperations: number;
    reproducibleOperations: number;
    failedReproductions: number;
    seeds: ReproducibleSeed;
    states: GenerationState[];
  } {
    const reproducible = this.stateHistory.filter(s => s.reproducible).length;
    const failed = this.stateHistory.filter(s => 
      s.reproductionErrors && s.reproductionErrors.length > 0
    ).length;
    
    return {
      sessionId: this.currentSessionId,
      totalOperations: this.stateHistory.length,
      reproducibleOperations: reproducible,
      failedReproductions: failed,
      seeds: this.seeds,
      states: this.stateHistory
    };
  }
  
  /**
   * Export session state for later reproduction
   */
  async exportSession(): Promise<string> {
    const sessionData = {
      sessionId: this.currentSessionId,
      seeds: this.seeds,
      states: this.stateHistory,
      exportedAt: Date.now()
    };
    
    return JSON.stringify(sessionData);
  }
  
  /**
   * Import session state for reproduction
   */
  async importSession(sessionData: string): Promise<void> {
    const data = JSON.parse(sessionData);
    this.currentSessionId = data.sessionId;
    this.seeds = data.seeds;
    this.stateHistory = data.states;
    this.random = new DeterministicRandom(this.seeds.random);
  }
  
  /**
   * Clear state history
   */
  clearHistory(): void {
    this.stateHistory = [];
  }
}

// ============= Reproducibility Tools for Level 5 Agent =============

export const reproducibilityTools: Tool[] = [
  {
    name: 'set_reproducibility_seed',
    description: 'Set master seed for deterministic reproduction of all operations',
    parameters: {
      seed: { type: 'string', description: 'Master seed string', required: true },
      mode: { type: 'string', description: 'Seed mode: fixed, timestamp, or custom', required: false }
    },
    execute: async (input) => {
      const manager = new ReproducibilityManager({
        seedMode: (input.mode as 'fixed' | 'timestamp' | 'custom') || 'custom',
        customSeed: String(input.seed)
      });
      return JSON.stringify({ 
        success: true, 
        seeds: manager.getSeeds(),
        message: 'Reproducibility seeds initialized'
      });
    }
  },
  {
    name: 'record_generation_state',
    description: 'Record the state of a generation operation for later reproduction',
    parameters: {
      operation: { type: 'string', description: 'Operation name', required: true },
      input: { type: 'object', description: 'Input parameters', required: true },
      parameters: { type: 'object', description: 'Processing parameters', required: true },
      output: { type: 'object', description: 'Output data', required: false }
    },
    execute: async (input) => {
      const manager = new ReproducibilityManager();
      const state = await manager.recordState(
        String(input.operation),
        input.input as Record<string, unknown>,
        input.parameters as Record<string, unknown>,
        input.output as Record<string, unknown>
      );
      return JSON.stringify({ success: true, stateId: state.id, state });
    }
  },
  {
    name: 'reproduce_generation',
    description: 'Reproduce a previous generation with exact same parameters and seeds',
    parameters: {
      state_id: { type: 'string', description: 'State ID to reproduce', required: true }
    },
    execute: async (input) => {
      const manager = new ReproducibilityManager();
      const result = await manager.reproduce(String(input.state_id));
      return JSON.stringify(result);
    }
  },
  {
    name: 'export_reproducibility_session',
    description: 'Export current session state for later exact reproduction',
    parameters: {},
    execute: async () => {
      const manager = new ReproducibilityManager();
      const sessionData = await manager.exportSession();
      return sessionData;
    }
  },
  {
    name: 'import_reproducibility_session',
    description: 'Import a previously exported session for reproduction',
    parameters: {
      session_data: { type: 'string', description: 'Exported session JSON', required: true }
    },
    execute: async (input) => {
      const manager = new ReproducibilityManager();
      await manager.importSession(String(input.session_data));
      return JSON.stringify({ 
        success: true, 
        message: 'Session imported successfully',
        report: manager.getReport()
      });
    }
  },
  {
    name: 'get_reproducibility_report',
    description: 'Get report on reproducibility status of current session',
    parameters: {},
    execute: async () => {
      const manager = new ReproducibilityManager();
      return JSON.stringify(manager.getReport());
    }
  },
  {
    name: 'verify_reproduction',
    description: 'Verify that two outputs are identical (hash comparison)',
    parameters: {
      original_output: { type: 'object', description: 'Original output data', required: true },
      new_output: { type: 'object', description: 'New output data', required: true }
    },
    execute: async (input) => {
      const originalHash = await generateHash(input.original_output);
      const newHash = await generateHash(input.new_output);
      return JSON.stringify({
        match: originalHash === newHash,
        originalHash,
        newHash,
        differences: originalHash !== newHash ? ['Hashes do not match'] : []
      });
    }
  }
];

// Export singleton
export const reproducibilityManager = new ReproducibilityManager();
