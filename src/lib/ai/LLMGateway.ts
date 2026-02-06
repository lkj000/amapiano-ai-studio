/**
 * LLM Gateway - LLM-Agnostic Multi-Model Architecture
 * 
 * Provides unified interface for multiple LLM providers with:
 * 1. Provider abstraction - swap models without code changes
 * 2. Cost optimization - route by cost/quality tradeoff
 * 3. Resilience - automatic fallback on provider failures
 * 4. Multi-modal support - text, audio, image, video
 * 5. Load balancing - distribute across providers
 * 6. Caching - reduce redundant API calls
 */

import { supabase } from '@/integrations/supabase/client';

export type LLMProvider = 
  | 'lovable-ai'     // Lovable AI Gateway (Gemini, GPT-5)
  | 'openai'         // Direct OpenAI
  | 'anthropic'      // Claude models
  | 'google'         // Vertex AI
  | 'replicate'      // Open source models
  | 'local';         // Local ONNX models

export type ModelCapability = 
  | 'text-generation'
  | 'chat'
  | 'reasoning'
  | 'code'
  | 'vision'
  | 'audio-understanding'
  | 'audio-generation'
  | 'image-generation'
  | 'embedding'
  | 'function-calling';

export type RoutingStrategy = 
  | 'lowest-cost'
  | 'highest-quality'
  | 'lowest-latency'
  | 'balanced'
  | 'round-robin'
  | 'fallback-chain';

export interface ModelConfig {
  id: string;
  provider: LLMProvider;
  modelName: string;
  capabilities: ModelCapability[];
  costPer1kTokens: number;
  maxTokens: number;
  latencyMs: number;  // Average latency
  qualityScore: number;  // 0-1, higher is better
  available: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | MultiModalContent[];
  }>;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  requiredCapabilities?: ModelCapability[];
  preferredProvider?: LLMProvider;
  routingStrategy?: RoutingStrategy;
  fallbackEnabled?: boolean;
}

export interface MultiModalContent {
  type: 'text' | 'image_url' | 'audio_url';
  text?: string;
  image_url?: { url: string };
  audio_url?: { url: string };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface LLMResponse {
  id: string;
  provider: LLMProvider;
  model: string;
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  latency: number;
  cached: boolean;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface StreamingResponse {
  id: string;
  provider: LLMProvider;
  model: string;
  onDelta: (callback: (delta: string) => void) => void;
  onToolCall: (callback: (toolCall: ToolCall) => void) => void;
  onDone: (callback: (response: LLMResponse) => void) => void;
  onError: (callback: (error: Error) => void) => void;
  abort: () => void;
}

// Registered model configurations
const MODEL_REGISTRY: ModelConfig[] = [
  // Lovable AI Gateway models
  {
    id: 'gemini-2.5-flash',
    provider: 'lovable-ai',
    modelName: 'google/gemini-2.5-flash',
    capabilities: ['text-generation', 'chat', 'reasoning', 'vision', 'function-calling'],
    costPer1kTokens: 0.001,
    maxTokens: 32768,
    latencyMs: 500,
    qualityScore: 0.85,
    available: true,
    rateLimit: { requestsPerMinute: 60, tokensPerMinute: 100000 }
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'lovable-ai',
    modelName: 'google/gemini-2.5-pro',
    capabilities: ['text-generation', 'chat', 'reasoning', 'vision', 'audio-understanding', 'function-calling'],
    costPer1kTokens: 0.01,
    maxTokens: 131072,
    latencyMs: 1000,
    qualityScore: 0.95,
    available: true,
    rateLimit: { requestsPerMinute: 30, tokensPerMinute: 50000 }
  },
  {
    id: 'gpt-5',
    provider: 'lovable-ai',
    modelName: 'openai/gpt-5',
    capabilities: ['text-generation', 'chat', 'reasoning', 'code', 'vision', 'function-calling'],
    costPer1kTokens: 0.03,
    maxTokens: 128000,
    latencyMs: 800,
    qualityScore: 0.98,
    available: true,
    rateLimit: { requestsPerMinute: 30, tokensPerMinute: 50000 }
  },
  {
    id: 'gpt-5-mini',
    provider: 'lovable-ai',
    modelName: 'openai/gpt-5-mini',
    capabilities: ['text-generation', 'chat', 'reasoning', 'function-calling'],
    costPer1kTokens: 0.003,
    maxTokens: 64000,
    latencyMs: 400,
    qualityScore: 0.88,
    available: true,
    rateLimit: { requestsPerMinute: 60, tokensPerMinute: 100000 }
  },
  // Local model (for edge inference)
  {
    id: 'local-onnx',
    provider: 'local',
    modelName: 'onnx/phi-3-mini',
    capabilities: ['text-generation', 'chat'],
    costPer1kTokens: 0,
    maxTokens: 4096,
    latencyMs: 200,
    qualityScore: 0.65,
    available: false, // Enable when ONNX runtime loaded
    rateLimit: { requestsPerMinute: 1000, tokensPerMinute: 1000000 }
  },
];

// Response cache
const responseCache = new Map<string, { response: LLMResponse; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * LLM Gateway - Central routing for all LLM requests
 */
export class LLMGateway {
  private static instance: LLMGateway;
  private providerStats: Map<LLMProvider, { requests: number; failures: number; totalLatency: number }>;
  private roundRobinIndex: number = 0;

  private constructor() {
    this.providerStats = new Map();
    for (const provider of ['lovable-ai', 'openai', 'anthropic', 'google', 'replicate', 'local'] as LLMProvider[]) {
      this.providerStats.set(provider, { requests: 0, failures: 0, totalLatency: 0 });
    }
  }

  static getInstance(): LLMGateway {
    if (!LLMGateway.instance) {
      LLMGateway.instance = new LLMGateway();
    }
    return LLMGateway.instance;
  }

  /**
   * Send request to LLM with automatic routing and fallback
   */
  async request(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.response, cached: true };
    }

    // Select model based on routing strategy
    const model = this.selectModel(request);
    if (!model) {
      throw new Error('No suitable model available for the requested capabilities');
    }

    try {
      const response = await this.executeRequest(model, request);
      
      // Cache response
      responseCache.set(cacheKey, { response, timestamp: Date.now() });
      
      // Update stats
      const stats = this.providerStats.get(model.provider)!;
      stats.requests++;
      stats.totalLatency += response.latency;
      
      return response;
    } catch (error) {
      // Update failure stats
      const stats = this.providerStats.get(model.provider)!;
      stats.failures++;
      
      // Attempt fallback
      if (request.fallbackEnabled !== false) {
        return this.executeFallback(request, model, error);
      }
      
      throw error;
    }
  }

  /**
   * Stream response from LLM
   */
  async stream(request: LLMRequest): Promise<StreamingResponse> {
    const model = this.selectModel(request);
    if (!model) {
      throw new Error('No suitable model available');
    }

    const abortController = new AbortController();
    const callbacks = {
      delta: [] as ((delta: string) => void)[],
      toolCall: [] as ((toolCall: ToolCall) => void)[],
      done: [] as ((response: LLMResponse) => void)[],
      error: [] as ((error: Error) => void)[]
    };

    // Execute streaming request
    this.executeStreamingRequest(model, request, callbacks, abortController);

    return {
      id: `stream_${Date.now()}`,
      provider: model.provider,
      model: model.modelName,
      onDelta: (cb) => callbacks.delta.push(cb),
      onToolCall: (cb) => callbacks.toolCall.push(cb),
      onDone: (cb) => callbacks.done.push(cb),
      onError: (cb) => callbacks.error.push(cb),
      abort: () => abortController.abort()
    };
  }

  /**
   * Select best model based on routing strategy
   */
  private selectModel(request: LLMRequest): ModelConfig | null {
    const strategy = request.routingStrategy || 'balanced';
    const requiredCapabilities = request.requiredCapabilities || ['text-generation'];
    
    // Filter available models with required capabilities
    let candidates = MODEL_REGISTRY.filter(model => 
      model.available && 
      requiredCapabilities.every(cap => model.capabilities.includes(cap))
    );

    // Prefer specified provider
    if (request.preferredProvider) {
      const preferred = candidates.filter(m => m.provider === request.preferredProvider);
      if (preferred.length > 0) candidates = preferred;
    }

    if (candidates.length === 0) return null;

    switch (strategy) {
      case 'lowest-cost':
        return candidates.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens)[0];
      
      case 'highest-quality':
        return candidates.sort((a, b) => b.qualityScore - a.qualityScore)[0];
      
      case 'lowest-latency':
        return candidates.sort((a, b) => a.latencyMs - b.latencyMs)[0];
      
      case 'round-robin':
        this.roundRobinIndex = (this.roundRobinIndex + 1) % candidates.length;
        return candidates[this.roundRobinIndex];
      
      case 'fallback-chain':
        // Return first available in quality order
        return candidates.sort((a, b) => b.qualityScore - a.qualityScore)[0];
      
      case 'balanced':
      default:
        // Balance cost, quality, and latency
        return candidates.sort((a, b) => {
          const scoreA = a.qualityScore * 0.4 + (1 - a.costPer1kTokens / 0.1) * 0.3 + (1 - a.latencyMs / 2000) * 0.3;
          const scoreB = b.qualityScore * 0.4 + (1 - b.costPer1kTokens / 0.1) * 0.3 + (1 - b.latencyMs / 2000) * 0.3;
          return scoreB - scoreA;
        })[0];
    }
  }

  /**
   * Execute request against selected model
   */
  private async executeRequest(model: ModelConfig, request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    switch (model.provider) {
      case 'lovable-ai':
        return this.executeLovableAI(model, request, startTime);
      
      case 'local':
        return this.executeLocal(model, request, startTime);
      
      default:
        // Route all other providers through Lovable AI Gateway as proxy
        return this.executeLovableAI(model, request, startTime);
    }
  }

  /**
   * Execute via Lovable AI Gateway
   */
  private async executeLovableAI(model: ModelConfig, request: LLMRequest, startTime: number): Promise<LLMResponse> {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: request.messages,
        model: model.modelName,
        tools: request.tools,
        tool_choice: request.toolChoice,
        temperature: request.temperature,
        max_tokens: request.maxTokens
      }
    });

    if (error) throw new Error(error.message);

    const latency = Date.now() - startTime;
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
    
    return {
      id: data.id || `llm_${Date.now()}`,
      provider: model.provider,
      model: model.modelName,
      content: data.choices?.[0]?.message?.content || data.content || '',
      toolCalls: data.choices?.[0]?.message?.tool_calls,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.prompt_tokens + usage.completion_tokens,
        cost: ((usage.prompt_tokens + usage.completion_tokens) / 1000) * model.costPer1kTokens
      },
      latency,
      cached: false
    };
  }

  /**
   * Execute local ONNX model
   */
  private async executeLocal(model: ModelConfig, request: LLMRequest, startTime: number): Promise<LLMResponse> {
    // Placeholder for ONNX Runtime inference
    // Would integrate with src/lib/wasm/OnnxAudioProcessor.ts
    const latency = Date.now() - startTime;
    
    return {
      id: `local_${Date.now()}`,
      provider: model.provider,
      model: model.modelName,
      content: '[Local model inference not yet implemented]',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0
      },
      latency,
      cached: false
    };
  }


  /**
   * Execute streaming request
   */
  private async executeStreamingRequest(
    model: ModelConfig,
    request: LLMRequest,
    callbacks: {
      delta: ((delta: string) => void)[];
      toolCall: ((toolCall: ToolCall) => void)[];
      done: ((response: LLMResponse) => void)[];
      error: ((error: Error) => void)[];
    },
    abortController: AbortController
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: request.messages,
          model: model.modelName,
          stream: true
        }),
        signal: abortController.signal
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              callbacks.delta.forEach(cb => cb(content));
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      const latency = Date.now() - startTime;
      const finalResponse: LLMResponse = {
        id: `stream_${Date.now()}`,
        provider: model.provider,
        model: model.modelName,
        content: fullContent,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0
        },
        latency,
        cached: false
      };

      callbacks.done.forEach(cb => cb(finalResponse));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      callbacks.error.forEach(cb => cb(error instanceof Error ? error : new Error(String(error))));
    }
  }

  /**
   * Execute fallback when primary provider fails
   */
  private async executeFallback(
    request: LLMRequest, 
    failedModel: ModelConfig, 
    error: unknown
  ): Promise<LLMResponse> {
    console.warn(`[LLMGateway] Provider ${failedModel.provider} failed, attempting fallback`, error);
    
    // Find alternative model
    const alternatives = MODEL_REGISTRY.filter(m => 
      m.available && 
      m.id !== failedModel.id &&
      (request.requiredCapabilities || ['text-generation']).every(cap => m.capabilities.includes(cap))
    ).sort((a, b) => b.qualityScore - a.qualityScore);

    if (alternatives.length === 0) {
      throw error;
    }

    return this.executeRequest(alternatives[0], request);
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(request: LLMRequest): string {
    const key = JSON.stringify({
      messages: request.messages,
      tools: request.tools,
      temperature: request.temperature
    });
    return btoa(key).slice(0, 64);
  }

  /**
   * Get provider statistics
   */
  getStats(): Record<LLMProvider, { requests: number; failures: number; avgLatency: number; successRate: number }> {
    const result: any = {};
    for (const [provider, stats] of this.providerStats) {
      result[provider] = {
        requests: stats.requests,
        failures: stats.failures,
        avgLatency: stats.requests > 0 ? stats.totalLatency / stats.requests : 0,
        successRate: stats.requests > 0 ? 1 - (stats.failures / stats.requests) : 1
      };
    }
    return result;
  }

  /**
   * Get available models
   */
  getAvailableModels(): ModelConfig[] {
    return MODEL_REGISTRY.filter(m => m.available);
  }

  /**
   * Enable/disable a model
   */
  setModelAvailability(modelId: string, available: boolean): void {
    const model = MODEL_REGISTRY.find(m => m.id === modelId);
    if (model) model.available = available;
  }
}

// Singleton export
export const llmGateway = LLMGateway.getInstance();
