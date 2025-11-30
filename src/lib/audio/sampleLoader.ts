/**
 * Audio Sample Loader
 * Handles loading and caching of audio samples for Amapianorization
 */

export interface AudioSampleMetadata {
  id: string;
  name: string;
  url: string;
  duration?: number;
  sampleRate?: number;
}

class AudioSampleLoader {
  private cache: Map<string, AudioBuffer> = new Map();
  private audioContext: AudioContext | null = null;

  /**
   * Initialize the audio context
   */
  initialize(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Load an audio sample from URL and decode it
   */
  async loadSample(url: string): Promise<AudioBuffer> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized. Call initialize() first.');
    }

    try {
      console.log(`[SampleLoader] Loading audio from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Cache the decoded buffer
      this.cache.set(url, audioBuffer);
      
      console.log(`[SampleLoader] Successfully loaded: ${url} (${audioBuffer.duration}s)`);
      return audioBuffer;
    } catch (error) {
      console.error(`[SampleLoader] Failed to load ${url}:`, error);
      throw new Error(`Failed to load audio sample: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load multiple samples in parallel
   */
  async loadSamples(urls: string[]): Promise<AudioBuffer[]> {
    const promises = urls.map(url => this.loadSample(url));
    return Promise.all(promises);
  }

  /**
   * Generate a simple sine wave buffer for testing/placeholder
   */
  generateTestBuffer(frequency: number = 440, duration: number = 1): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
    }

    return buffer;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const audioSampleLoader = new AudioSampleLoader();
