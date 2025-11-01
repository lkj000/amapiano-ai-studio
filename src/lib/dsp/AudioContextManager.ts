/**
 * Phase 0 Sprint 1: Audio Context Management
 * Handles Web Audio API context lifecycle and buffer management
 */

export interface AudioContextConfig {
  sampleRate?: number;
  latencyHint?: 'interactive' | 'balanced' | 'playback';
  channels?: number;
}

export interface AudioBufferConfig {
  bufferSize: number;
  inputChannels: number;
  outputChannels: number;
}

export class AudioContextManager {
  private context: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;
  
  /**
   * Initialize audio context with optimal settings
   */
  async initialize(config: AudioContextConfig = {}): Promise<void> {
    if (this.isInitialized) {
      console.warn('Audio context already initialized');
      return;
    }
    
    try {
      this.context = new AudioContext({
        sampleRate: config.sampleRate || 48000,
        latencyHint: config.latencyHint || 'interactive'
      });
      
      // Create gain node for volume control
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      
      this.isInitialized = true;
      console.log(`Audio context initialized: ${this.context.sampleRate}Hz`);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }
  
  /**
   * Load and register AudioWorklet processor
   */
  async loadWorklet(workletUrl: string, processorName: string): Promise<void> {
    if (!this.context) {
      throw new Error('Audio context not initialized');
    }
    
    try {
      await this.context.audioWorklet.addModule(workletUrl);
      
      this.workletNode = new AudioWorkletNode(this.context, processorName, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2]
      });
      
      this.workletNode.connect(this.gainNode!);
      console.log(`AudioWorklet loaded: ${processorName}`);
    } catch (error) {
      console.error('Failed to load AudioWorklet:', error);
      throw error;
    }
  }
  
  /**
   * Create audio buffer from raw data
   */
  createBuffer(data: Float32Array, channels: number = 2): AudioBuffer {
    if (!this.context) {
      throw new Error('Audio context not initialized');
    }
    
    const buffer = this.context.createBuffer(
      channels,
      data.length / channels,
      this.context.sampleRate
    );
    
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = data[i * channels + channel];
      }
    }
    
    return buffer;
  }
  
  /**
   * Resume audio context (required for user interaction)
   */
  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }
  
  /**
   * Suspend audio context to save resources
   */
  async suspend(): Promise<void> {
    if (this.context?.state === 'running') {
      await this.context.suspend();
    }
  }
  
  /**
   * Send parameter update to worklet
   */
  setWorkletParameter(parameterId: string, value: number): void {
    if (!this.workletNode) {
      throw new Error('AudioWorklet not loaded');
    }
    
    this.workletNode.port.postMessage({
      type: 'parameter',
      id: parameterId,
      value
    });
  }
  
  /**
   * Get current audio context state
   */
  getState(): {
    initialized: boolean;
    state?: AudioContextState;
    sampleRate?: number;
    currentTime?: number;
    baseLatency?: number;
  } {
    return {
      initialized: this.isInitialized,
      state: this.context?.state,
      sampleRate: this.context?.sampleRate,
      currentTime: this.context?.currentTime,
      baseLatency: this.context?.baseLatency
    };
  }
  
  /**
   * Cleanup and dispose resources
   */
  async dispose(): Promise<void> {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    this.isInitialized = false;
  }
  
  /**
   * Get audio context instance
   */
  getContext(): AudioContext | null {
    return this.context;
  }
  
  /**
   * Get worklet node instance
   */
  getWorkletNode(): AudioWorkletNode | null {
    return this.workletNode;
  }
}

// Singleton instance
export const audioContextManager = new AudioContextManager();
