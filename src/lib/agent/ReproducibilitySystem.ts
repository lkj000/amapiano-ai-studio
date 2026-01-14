/**
 * Reproducibility System for Level 5 Autonomous Agent
 * Ensures deterministic, reproducible results across Suno, Moises, and LANDR operations
 * Fixes exact reproduction failures with state management and seeding
 */

import { supabase } from '@/integrations/supabase/client';
import { Tool } from './ReActLoop';
import type { Json } from '@/integrations/supabase/types';

// ============= Reproducibility Types =============

/**
 * Operating Mode for Reproducibility
 * - creative: Allows variation for exploration, loose determinism
 * - production: Strict determinism for exact reproduction
 */
export type ReproducibilityMode = 'creative' | 'production';

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
  mode: ReproducibilityMode;  // Mode used during generation
}

/**
 * Creative Mode Settings - for exploration and variation
 */
export interface CreativeModeConfig {
  variationAmount: number;        // 0-1: How much variation to allow
  allowParameterDrift: boolean;   // Allow small changes to parameters
  driftRange: number;             // Max % drift for parameters
  explorationFactor: number;      // 0-1: Encourages novel outputs
  preserveCore: boolean;          // Keep core elements consistent
  variationDomains: ('melody' | 'rhythm' | 'harmony' | 'timbre' | 'dynamics' | 'effects')[];
}

/**
 * Production Mode Settings - for exact reproduction
 */
export interface ProductionModeConfig {
  strictDeterminism: boolean;     // Enforce exact same outputs
  lockAllParameters: boolean;     // No parameter changes allowed
  requireHashMatch: boolean;      // Must match original hash
  allowRetries: boolean;          // Retry on mismatch
  maxRetries: number;             // Max reproduction attempts
  toleranceThreshold: number;     // 0-1: Acceptable difference (0 = exact)
}

export interface ReproducibilityConfig {
  mode: ReproducibilityMode;
  enableDeterminism: boolean;
  seedMode: 'fixed' | 'timestamp' | 'custom';
  customSeed?: string;
  maxReproductionAttempts: number;
  hashVerification: boolean;
  stateLogging: boolean;
  creativeConfig: CreativeModeConfig;
  productionConfig: ProductionModeConfig;
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

// ============= Default Configs =============

const DEFAULT_CREATIVE_CONFIG: CreativeModeConfig = {
  variationAmount: 0.3,
  allowParameterDrift: true,
  driftRange: 0.15,
  explorationFactor: 0.5,
  preserveCore: true,
  variationDomains: ['melody', 'rhythm', 'harmony', 'timbre', 'dynamics', 'effects']
};

const DEFAULT_PRODUCTION_CONFIG: ProductionModeConfig = {
  strictDeterminism: true,
  lockAllParameters: true,
  requireHashMatch: true,
  allowRetries: true,
  maxRetries: 5,
  toleranceThreshold: 0
};

// ============= Reproducibility Manager =============

export class ReproducibilityManager {
  private config: ReproducibilityConfig;
  private seeds: ReproducibleSeed;
  private random: DeterministicRandom;
  private stateHistory: GenerationState[] = [];
  private currentSessionId: string;
  private creativeRandom: DeterministicRandom | null = null;
  
  constructor(config?: Partial<ReproducibilityConfig>) {
    this.config = {
      mode: 'production',
      enableDeterminism: true,
      seedMode: 'timestamp',
      maxReproductionAttempts: 3,
      hashVerification: true,
      stateLogging: true,
      creativeConfig: { ...DEFAULT_CREATIVE_CONFIG },
      productionConfig: { ...DEFAULT_PRODUCTION_CONFIG },
      ...config
    };
    
    this.currentSessionId = `session_${Date.now()}`;
    this.seeds = this.initializeSeeds();
    this.random = new DeterministicRandom(this.seeds.random);
    
    // Creative mode gets a separate random source for variations
    if (this.config.mode === 'creative') {
      this.creativeRandom = new DeterministicRandom(Date.now());
    }
  }
  
  /**
   * Get current mode
   */
  getMode(): ReproducibilityMode {
    return this.config.mode;
  }
  
  /**
   * Switch between creative and production modes
   */
  setMode(mode: ReproducibilityMode): void {
    this.config.mode = mode;
    
    if (mode === 'creative' && !this.creativeRandom) {
      this.creativeRandom = new DeterministicRandom(Date.now());
    }
    
    console.log(`[Reproducibility] Switched to ${mode.toUpperCase()} mode`);
  }
  
  /**
   * Update creative mode settings
   */
  setCreativeConfig(config: Partial<CreativeModeConfig>): void {
    this.config.creativeConfig = { ...this.config.creativeConfig, ...config };
  }
  
  /**
   * Update production mode settings
   */
  setProductionConfig(config: Partial<ProductionModeConfig>): void {
    this.config.productionConfig = { ...this.config.productionConfig, ...config };
  }
  
  /**
   * Get variation factor based on mode
   * In production: 0 (no variation)
   * In creative: Based on variationAmount setting
   */
  getVariationFactor(): number {
    if (this.config.mode === 'production') {
      return 0;
    }
    return this.config.creativeConfig.variationAmount;
  }
  
  /**
   * Apply creative variation to a parameter value
   */
  applyCreativeVariation(value: number, domain?: string): number {
    if (this.config.mode === 'production') {
      return value; // No variation in production mode
    }
    
    const { variationAmount, driftRange, variationDomains, preserveCore } = this.config.creativeConfig;
    
    // Check if this domain should have variation
    if (domain && !variationDomains.includes(domain as any)) {
      return value;
    }
    
    // Core preservation reduces variation
    const effectiveVariation = preserveCore ? variationAmount * 0.5 : variationAmount;
    
    // Calculate drift
    const drift = (this.creativeRandom?.next() ?? Math.random()) * 2 - 1; // -1 to 1
    const adjustedDrift = drift * driftRange * effectiveVariation;
    
    return value * (1 + adjustedDrift);
  }
  
  /**
   * Get exploration bonus for creative mode
   */
  getExplorationBonus(): number {
    if (this.config.mode === 'production') {
      return 0;
    }
    return this.config.creativeConfig.explorationFactor;
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
        _randomState: this.random.getState(),
        _mode: this.config.mode,
        _variationFactor: this.getVariationFactor()
      },
      seed: { ...this.seeds },
      output,
      reproducible: this.config.mode === 'production',
      attempts: 0,
      mode: this.config.mode
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
    name: 'set_reproducibility_mode',
    description: 'Switch between creative mode (exploration with variation) and production mode (strict determinism)',
    parameters: {
      mode: { type: 'string', description: 'Mode: "creative" or "production"', required: true }
    },
    execute: async (input) => {
      const mode = String(input.mode) as ReproducibilityMode;
      reproducibilityManager.setMode(mode);
      
      const modeInfo = mode === 'creative' 
        ? {
            description: 'Creative mode enabled - allows variation for exploration',
            variationFactor: reproducibilityManager.getVariationFactor(),
            explorationBonus: reproducibilityManager.getExplorationBonus(),
            reproducible: false
          }
        : {
            description: 'Production mode enabled - strict determinism for exact reproduction',
            variationFactor: 0,
            explorationBonus: 0,
            reproducible: true
          };
      
      return JSON.stringify({ 
        success: true, 
        mode,
        ...modeInfo
      });
    }
  },
  {
    name: 'configure_creative_mode',
    description: 'Configure creative mode settings for exploration and variation',
    parameters: {
      variation_amount: { type: 'number', description: 'Amount of variation (0-1)', required: false },
      allow_drift: { type: 'boolean', description: 'Allow parameter drift', required: false },
      drift_range: { type: 'number', description: 'Max drift percentage (0-1)', required: false },
      exploration_factor: { type: 'number', description: 'Exploration factor (0-1)', required: false },
      preserve_core: { type: 'boolean', description: 'Preserve core elements', required: false },
      variation_domains: { type: 'array', description: 'Domains to apply variation', required: false }
    },
    execute: async (input) => {
      const config: Partial<CreativeModeConfig> = {};
      
      if (input.variation_amount !== undefined) config.variationAmount = Number(input.variation_amount);
      if (input.allow_drift !== undefined) config.allowParameterDrift = Boolean(input.allow_drift);
      if (input.drift_range !== undefined) config.driftRange = Number(input.drift_range);
      if (input.exploration_factor !== undefined) config.explorationFactor = Number(input.exploration_factor);
      if (input.preserve_core !== undefined) config.preserveCore = Boolean(input.preserve_core);
      if (input.variation_domains !== undefined) {
        config.variationDomains = input.variation_domains as CreativeModeConfig['variationDomains'];
      }
      
      reproducibilityManager.setCreativeConfig(config);
      
      return JSON.stringify({ 
        success: true, 
        message: 'Creative mode configuration updated',
        config
      });
    }
  },
  {
    name: 'configure_production_mode',
    description: 'Configure production mode settings for exact reproduction',
    parameters: {
      strict_determinism: { type: 'boolean', description: 'Enforce strict determinism', required: false },
      lock_parameters: { type: 'boolean', description: 'Lock all parameters', required: false },
      require_hash_match: { type: 'boolean', description: 'Require hash match', required: false },
      allow_retries: { type: 'boolean', description: 'Allow retries on mismatch', required: false },
      max_retries: { type: 'number', description: 'Maximum retry attempts', required: false },
      tolerance: { type: 'number', description: 'Acceptable difference threshold (0-1)', required: false }
    },
    execute: async (input) => {
      const config: Partial<ProductionModeConfig> = {};
      
      if (input.strict_determinism !== undefined) config.strictDeterminism = Boolean(input.strict_determinism);
      if (input.lock_parameters !== undefined) config.lockAllParameters = Boolean(input.lock_parameters);
      if (input.require_hash_match !== undefined) config.requireHashMatch = Boolean(input.require_hash_match);
      if (input.allow_retries !== undefined) config.allowRetries = Boolean(input.allow_retries);
      if (input.max_retries !== undefined) config.maxRetries = Number(input.max_retries);
      if (input.tolerance !== undefined) config.toleranceThreshold = Number(input.tolerance);
      
      reproducibilityManager.setProductionConfig(config);
      
      return JSON.stringify({ 
        success: true, 
        message: 'Production mode configuration updated',
        config
      });
    }
  },
  {
    name: 'get_current_mode',
    description: 'Get the current reproducibility mode and its settings',
    parameters: {},
    execute: async () => {
      const mode = reproducibilityManager.getMode();
      return JSON.stringify({
        mode,
        variationFactor: reproducibilityManager.getVariationFactor(),
        explorationBonus: reproducibilityManager.getExplorationBonus(),
        isReproducible: mode === 'production'
      });
    }
  },
  {
    name: 'apply_creative_variation',
    description: 'Apply creative variation to a parameter value (only works in creative mode)',
    parameters: {
      value: { type: 'number', description: 'Original value', required: true },
      domain: { type: 'string', description: 'Domain: melody, rhythm, harmony, timbre, dynamics, effects', required: false }
    },
    execute: async (input) => {
      const originalValue = Number(input.value);
      const domain = input.domain ? String(input.domain) : undefined;
      const variedValue = reproducibilityManager.applyCreativeVariation(originalValue, domain);
      
      return JSON.stringify({
        original: originalValue,
        varied: variedValue,
        difference: variedValue - originalValue,
        percentChange: ((variedValue - originalValue) / originalValue) * 100,
        mode: reproducibilityManager.getMode()
      });
    }
  },
  {
    name: 'set_reproducibility_seed',
    description: 'Set master seed for deterministic reproduction of all operations',
    parameters: {
      seed: { type: 'string', description: 'Master seed string', required: true },
      seed_mode: { type: 'string', description: 'Seed mode: fixed, timestamp, or custom', required: false }
    },
    execute: async (input) => {
      const manager = new ReproducibilityManager({
        seedMode: (input.seed_mode as 'fixed' | 'timestamp' | 'custom') || 'custom',
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
      const state = await reproducibilityManager.recordState(
        String(input.operation),
        input.input as Record<string, unknown>,
        input.parameters as Record<string, unknown>,
        input.output as Record<string, unknown>
      );
      return JSON.stringify({ 
        success: true, 
        stateId: state.id, 
        state,
        mode: reproducibilityManager.getMode()
      });
    }
  },
  {
    name: 'reproduce_generation',
    description: 'Reproduce a previous generation with exact same parameters and seeds (best results in production mode)',
    parameters: {
      state_id: { type: 'string', description: 'State ID to reproduce', required: true },
      force_production: { type: 'boolean', description: 'Force production mode for reproduction', required: false }
    },
    execute: async (input) => {
      // Optionally force production mode for reproduction
      if (input.force_production) {
        reproducibilityManager.setMode('production');
      }
      
      const result = await reproducibilityManager.reproduce(String(input.state_id));
      return JSON.stringify({
        ...result,
        mode: reproducibilityManager.getMode()
      });
    }
  },
  {
    name: 'export_reproducibility_session',
    description: 'Export current session state for later exact reproduction',
    parameters: {},
    execute: async () => {
      const sessionData = await reproducibilityManager.exportSession();
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
      await reproducibilityManager.importSession(String(input.session_data));
      return JSON.stringify({ 
        success: true, 
        message: 'Session imported successfully',
        report: reproducibilityManager.getReport()
      });
    }
  },
  {
    name: 'get_reproducibility_report',
    description: 'Get report on reproducibility status of current session including mode info',
    parameters: {},
    execute: async () => {
      const report = reproducibilityManager.getReport();
      return JSON.stringify({
        ...report,
        currentMode: reproducibilityManager.getMode(),
        variationFactor: reproducibilityManager.getVariationFactor()
      });
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
        differences: originalHash !== newHash ? ['Hashes do not match'] : [],
        mode: reproducibilityManager.getMode(),
        note: reproducibilityManager.getMode() === 'creative' 
          ? 'Creative mode may intentionally produce variations' 
          : 'Production mode should produce identical outputs'
      });
    }
  }
];

// Export singleton
export const reproducibilityManager = new ReproducibilityManager();
