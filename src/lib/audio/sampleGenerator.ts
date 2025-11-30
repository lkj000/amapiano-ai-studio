/**
 * Sample Generator - Creates placeholder audio samples for testing
 * 
 * For PhD Research: This generates synthetic samples for initial testing
 * while real Amapiano samples are being curated and collected.
 */

export interface SampleConfig {
  frequency: number;
  duration: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFreq?: number;
  resonance?: number;
}

export class SampleGenerator {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Generate a log drum sample with specific characteristics
   */
  generateLogDrum(config: SampleConfig): AudioBuffer {
    const { frequency, duration, attack, decay, sustain, release } = config;
    const sampleRate = this.audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    
    const buffer = this.audioContext.createBuffer(2, numSamples, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < numSamples; i++) {
        const time = i / sampleRate;
        const progress = i / numSamples;
        
        // ADSR Envelope
        let envelope = 0;
        const totalEnvTime = attack + decay + release;
        const sustainTime = duration - totalEnvTime;
        
        if (time < attack) {
          envelope = time / attack;
        } else if (time < attack + decay) {
          const decayProgress = (time - attack) / decay;
          envelope = 1 - (1 - sustain) * decayProgress;
        } else if (time < attack + decay + sustainTime) {
          envelope = sustain;
        } else {
          const releaseProgress = (time - attack - decay - sustainTime) / release;
          envelope = sustain * (1 - releaseProgress);
        }
        
        // Multi-harmonic synthesis for richer sound
        let sample = 0;
        sample += Math.sin(2 * Math.PI * frequency * time); // Fundamental
        sample += 0.5 * Math.sin(2 * Math.PI * frequency * 2 * time); // 2nd harmonic
        sample += 0.25 * Math.sin(2 * Math.PI * frequency * 3 * time); // 3rd harmonic
        sample += 0.125 * Math.sin(2 * Math.PI * frequency * 5 * time); // 5th harmonic
        
        // Add noise for attack transient (first 20ms)
        if (time < 0.02) {
          const noiseAmount = (0.02 - time) / 0.02;
          sample += (Math.random() * 2 - 1) * 0.3 * noiseAmount;
        }
        
        // Apply envelope and normalize
        sample = sample * envelope * 0.25;
        
        // Simple lowpass filter
        if (config.filterFreq) {
          const filterAmount = Math.exp(-2 * Math.PI * config.filterFreq * time);
          sample *= filterAmount;
        }
        
        channelData[i] = sample;
      }
    }
    
    return buffer;
  }

  /**
   * Generate percussion sample (shaker, conga, etc.)
   */
  generatePercussion(type: 'shaker' | 'conga' | 'bongo' | 'cowbell' | 'ride' | 'tambourine'): AudioBuffer {
    const configs: Record<string, SampleConfig> = {
      shaker: {
        frequency: 8000,
        duration: 0.15,
        attack: 0.001,
        decay: 0.05,
        sustain: 0.3,
        release: 0.1,
        filterFreq: 12000
      },
      conga: {
        frequency: 200,
        duration: 0.8,
        attack: 0.005,
        decay: 0.2,
        sustain: 0.4,
        release: 0.3
      },
      bongo: {
        frequency: 300,
        duration: 0.4,
        attack: 0.003,
        decay: 0.15,
        sustain: 0.3,
        release: 0.2
      },
      cowbell: {
        frequency: 800,
        duration: 0.3,
        attack: 0.001,
        decay: 0.1,
        sustain: 0.2,
        release: 0.15,
        filterFreq: 5000
      },
      ride: {
        frequency: 3000,
        duration: 1.5,
        attack: 0.01,
        decay: 0.3,
        sustain: 0.6,
        release: 0.8,
        filterFreq: 8000
      },
      tambourine: {
        frequency: 6000,
        duration: 0.5,
        attack: 0.002,
        decay: 0.15,
        sustain: 0.4,
        release: 0.2,
        filterFreq: 10000
      }
    };

    const config = configs[type];
    const sampleRate = this.audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * config.duration);
    
    const buffer = this.audioContext.createBuffer(2, numSamples, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < numSamples; i++) {
        const time = i / sampleRate;
        
        // Generate noise-based percussion
        let sample = Math.random() * 2 - 1;
        
        // Filter to target frequency range
        const filterCenter = config.frequency;
        const bandwidth = filterCenter * 0.5;
        const lowcut = filterCenter - bandwidth;
        const highcut = filterCenter + bandwidth;
        
        // Simple envelope
        const envelope = Math.exp(-5 * time / config.duration);
        
        sample *= envelope;
        channelData[i] = sample * 0.3;
      }
    }
    
    return buffer;
  }

  /**
   * Convert AudioBuffer to WAV blob
   */
  bufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const data: number[] = [];
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        data.push(value);
      }
    }

    const dataLength = data.length * bytesPerSample;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      view.setInt16(offset, data[i], true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Generate a complete log drum library set
   */
  generateLogDrumLibrary(): Map<string, Blob> {
    const library = new Map<string, Blob>();
    
    // Generate samples for different regions and styles
    const regions = [
      { name: 'johannesburg', freqMultiplier: 1.0, style: 'deep' },
      { name: 'pretoria', freqMultiplier: 1.1, style: 'jazzy' },
      { name: 'durban', freqMultiplier: 1.15, style: 'energetic' },
      { name: 'cape-town', freqMultiplier: 0.95, style: 'melodic' }
    ];

    const pitches = [
      { name: 'low', freq: 80 },
      { name: 'mid', freq: 150 },
      { name: 'high', freq: 250 }
    ];

    const styles = [
      { name: 'muted', attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.2, duration: 0.8 },
      { name: 'open', attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5, duration: 1.2 },
      { name: 'slap', attack: 0.001, decay: 0.05, sustain: 0.2, release: 0.1, duration: 0.5 },
      { name: 'ghost', attack: 0.002, decay: 0.05, sustain: 0.1, release: 0.08, duration: 0.3 }
    ];

    regions.forEach(region => {
      pitches.forEach(pitch => {
        styles.forEach(style => {
          const filename = `${region.name}-${pitch.name}-${style.name}.wav`;
          
          const buffer = this.generateLogDrum({
            frequency: pitch.freq * region.freqMultiplier,
            duration: style.duration,
            attack: style.attack,
            decay: style.decay,
            sustain: style.sustain,
            release: style.release
          });

          const blob = this.bufferToWav(buffer);
          library.set(filename, blob);
        });
      });
    });

    return library;
  }

  /**
   * Generate percussion library
   */
  generatePercussionLibrary(): Map<string, Blob> {
    const library = new Map<string, Blob>();
    
    const types: Array<'shaker' | 'conga' | 'bongo' | 'cowbell' | 'ride' | 'tambourine'> = [
      'shaker', 'conga', 'bongo', 'cowbell', 'ride', 'tambourine'
    ];

    types.forEach(type => {
      const buffer = this.generatePercussion(type);
      const blob = this.bufferToWav(buffer);
      library.set(`${type}.wav`, blob);
    });

    return library;
  }
}
