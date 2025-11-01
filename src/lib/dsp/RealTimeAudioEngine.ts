/**
 * Real-Time Audio Engine using Web Audio API + AudioWorklet
 * Provides professional-grade DSP processing in the browser
 */

export interface AudioPluginConfig {
  pluginType: 'effect' | 'instrument' | 'analyzer';
  parameters: Record<string, number>;
  sampleRate?: number;
  blockSize?: number;
}

export interface ProcessingStats {
  latency: number;
  cpuLoad: number;
  dropouts: number;
  sampleRate: number;
}

export class RealTimeAudioEngine {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isInitialized = false;
  private stats: ProcessingStats = {
    latency: 0,
    cpuLoad: 0,
    dropouts: 0,
    sampleRate: 44100
  };

  async initialize(context?: AudioContext): Promise<void> {
    if (this.isInitialized) {
      console.log('[Audio Engine] Already initialized');
      return;
    }

    try {
      // Create or use provided audio context
      this.audioContext = context || new AudioContext({
        latencyHint: 'interactive',
        sampleRate: 48000
      });

      // Load AudioWorklet module
      await this.audioContext.audioWorklet.addModule('/audio-dsp-processor.worklet.js');

      // Create analyser for visualization
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.connect(this.audioContext.destination);

      this.stats.sampleRate = this.audioContext.sampleRate;
      this.isInitialized = true;

      console.log('[Audio Engine] Initialized successfully', {
        sampleRate: this.audioContext.sampleRate,
        baseLatency: this.audioContext.baseLatency,
        outputLatency: this.audioContext.outputLatency
      });
    } catch (error) {
      console.error('[Audio Engine] Initialization failed:', error);
      throw error;
    }
  }

  async createPlugin(config: AudioPluginConfig): Promise<AudioWorkletNode> {
    if (!this.audioContext) {
      throw new Error('Audio engine not initialized');
    }

    // Create AudioWorklet node with DSP processor
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      'dsp-processor',
      {
        processorOptions: {
          pluginType: config.pluginType,
          parameters: config.parameters
        }
      }
    );

    // Connect to analyser and output
    if (this.analyserNode) {
      this.workletNode.connect(this.analyserNode);
    }

    // Monitor processing performance
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'stats') {
        this.updateStats(event.data);
      }
    };

    console.log('[Audio Engine] Plugin created:', config.pluginType);
    return this.workletNode;
  }

  setParameter(parameterId: string, value: number): void {
    if (!this.workletNode) {
      console.warn('[Audio Engine] No plugin loaded');
      return;
    }

    this.workletNode.port.postMessage({
      type: 'setParameter',
      id: parameterId,
      value: value
    });
  }

  async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio engine not initialized');
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  createBufferSource(buffer: AudioBuffer): AudioBufferSourceNode {
    if (!this.audioContext) {
      throw new Error('Audio engine not initialized');
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    if (this.workletNode) {
      source.connect(this.workletNode);
    } else if (this.analyserNode) {
      source.connect(this.analyserNode);
    }

    return source;
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(0);
    }

    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  getTimeDomainData(): Float32Array {
    if (!this.analyserNode) {
      return new Float32Array(0);
    }

    const data = new Float32Array(this.analyserNode.fftSize);
    this.analyserNode.getFloatTimeDomainData(data);
    return data;
  }

  getStats(): ProcessingStats {
    if (this.audioContext) {
      // Update latency from audio context
      this.stats.latency = (this.audioContext.baseLatency + (this.audioContext.outputLatency || 0)) * 1000;
    }
    return { ...this.stats };
  }

  private updateStats(data: any): void {
    if (data.cpuLoad !== undefined) {
      this.stats.cpuLoad = data.cpuLoad;
    }
    if (data.dropouts !== undefined) {
      this.stats.dropouts = data.dropouts;
    }
  }

  async suspend(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
      console.log('[Audio Engine] Suspended');
    }
  }

  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('[Audio Engine] Resumed');
    }
  }

  dispose(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;
    console.log('[Audio Engine] Disposed');
  }

  get context(): AudioContext | null {
    return this.audioContext;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const audioEngine = new RealTimeAudioEngine();
