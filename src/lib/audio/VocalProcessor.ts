/**
 * Vocal Processor - Real Implementation
 * 
 * Professional vocal processing using Tone.js:
 * - Pitch Shifting (Demon Pitch: -12 semitones)
 * - Formant Control (independent throat shifting)
 * - Effects Chain (reverb, delay, distortion)
 * - Sgija Vocal Style presets
 */

import * as Tone from 'tone';

export interface VocalProcessorSettings {
  // Pitch
  pitchShift: number;        // Semitones (-24 to +24)
  formantShift: number;      // Percent (-100 to +100)
  
  // Effects
  reverbMix: number;         // 0-1
  reverbDecay: number;       // 0.1-10 seconds
  delayTime: string;         // "8n", "4n", etc.
  delayFeedback: number;     // 0-1
  distortion: number;        // 0-1
  
  // Sgija specific
  demonMode: boolean;        // Enable -12 semitone + formant shift
  whisperMode: boolean;      // Breathy vocal effect
  choirMode: boolean;        // Multi-voice harmonics
}

export interface VocalPreset {
  name: string;
  description: string;
  settings: Partial<VocalProcessorSettings>;
}

export const VOCAL_PRESETS: Record<string, VocalPreset> = {
  'xduppy-demon': {
    name: 'Xduppy Demon',
    description: 'Deep, menacing Sgija vocal with -12 semitone drop',
    settings: {
      pitchShift: -12,
      formantShift: -15,
      reverbMix: 0.2,
      reverbDecay: 1.5,
      distortion: 0.1,
      demonMode: true
    }
  },
  'mellow-whisper': {
    name: 'Mellow Whisper',
    description: 'Soft, intimate vocal styling',
    settings: {
      pitchShift: 0,
      formantShift: 5,
      reverbMix: 0.35,
      reverbDecay: 2.5,
      whisperMode: true
    }
  },
  'kabza-choir': {
    name: 'Kabza Choir',
    description: 'Layered harmonic vocal effect',
    settings: {
      pitchShift: 0,
      formantShift: 0,
      reverbMix: 0.4,
      reverbDecay: 3,
      delayTime: '4n',
      delayFeedback: 0.3,
      choirMode: true
    }
  },
  'sgija-raw': {
    name: 'Sgija Raw',
    description: 'Gritty, unpolished street sound',
    settings: {
      pitchShift: -5,
      formantShift: -8,
      distortion: 0.25,
      reverbMix: 0.1,
      demonMode: false
    }
  },
  'private-school': {
    name: 'Private School Polish',
    description: 'Clean, polished vocal treatment',
    settings: {
      pitchShift: 0,
      formantShift: 3,
      reverbMix: 0.25,
      reverbDecay: 2,
      delayTime: '8n',
      delayFeedback: 0.15
    }
  }
};

/**
 * Real Vocal Processor using Tone.js
 */
export class VocalProcessor {
  private pitchShift: Tone.PitchShift;
  private formantShift: Tone.FrequencyShifter;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private distortion: Tone.Distortion;
  private compressor: Tone.Compressor;
  private limiter: Tone.Limiter;
  private eq: Tone.EQ3;
  private gainNode: Tone.Gain;
  
  private settings: VocalProcessorSettings;
  private isConnected: boolean = false;
  private choirVoices: Tone.PitchShift[] = [];

  constructor(settings?: Partial<VocalProcessorSettings>) {
    this.settings = {
      pitchShift: 0,
      formantShift: 0,
      reverbMix: 0.2,
      reverbDecay: 1.5,
      delayTime: '8n',
      delayFeedback: 0.2,
      distortion: 0,
      demonMode: false,
      whisperMode: false,
      choirMode: false,
      ...settings
    };

    // Initialize Tone.js nodes
    this.pitchShift = new Tone.PitchShift({
      pitch: this.settings.pitchShift,
      windowSize: 0.1,
      delayTime: 0
    });

    this.formantShift = new Tone.FrequencyShifter({
      frequency: this.settings.formantShift * 10 // Convert percent to Hz offset
    });

    this.reverb = new Tone.Reverb({
      decay: this.settings.reverbDecay,
      wet: this.settings.reverbMix
    });

    this.delay = new Tone.FeedbackDelay({
      delayTime: this.settings.delayTime,
      feedback: this.settings.delayFeedback,
      wet: 0.3
    });

    this.distortion = new Tone.Distortion({
      distortion: this.settings.distortion,
      wet: this.settings.distortion > 0 ? 1 : 0
    });

    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });

    this.limiter = new Tone.Limiter(-0.5);

    this.eq = new Tone.EQ3({
      low: 0,
      mid: 2,
      high: 1
    });

    this.gainNode = new Tone.Gain(1);

    // Build signal chain
    this.buildChain();

    console.log('[VocalProcessor] Real processor initialized with Tone.js');
  }

  private buildChain(): void {
    // Signal flow: Input -> PitchShift -> FormantShift -> Distortion -> 
    //              Compressor -> EQ -> Reverb -> Delay -> Limiter -> Output
    
    this.pitchShift.chain(
      this.formantShift,
      this.distortion,
      this.compressor,
      this.eq,
      this.reverb,
      this.delay,
      this.limiter,
      this.gainNode
    );
  }

  /**
   * Apply preset to processor
   */
  applyPreset(presetName: string): void {
    const preset = VOCAL_PRESETS[presetName];
    if (!preset) {
      console.warn(`[VocalProcessor] Preset "${presetName}" not found`);
      return;
    }

    this.updateSettings(preset.settings);
    console.log(`[VocalProcessor] Applied preset: ${preset.name}`);
  }

  /**
   * Update processor settings
   */
  updateSettings(newSettings: Partial<VocalProcessorSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Apply demon mode if enabled
    if (this.settings.demonMode) {
      this.pitchShift.pitch = -12;
      this.formantShift.frequency.value = -150; // Deep formant drop
      this.distortion.distortion = Math.max(0.1, this.settings.distortion);
    } else {
      this.pitchShift.pitch = this.settings.pitchShift;
      this.formantShift.frequency.value = this.settings.formantShift * 10;
    }

    // Update effects
    this.reverb.decay = this.settings.reverbDecay;
    this.reverb.wet.value = this.settings.reverbMix;
    
    this.delay.delayTime.value = this.settings.delayTime;
    this.delay.feedback.value = this.settings.delayFeedback;
    
    this.distortion.distortion = this.settings.distortion;
    this.distortion.wet.value = this.settings.distortion > 0 ? 1 : 0;

    // Whisper mode: reduce low frequencies, boost highs, add air
    if (this.settings.whisperMode) {
      this.eq.low.value = -12;
      this.eq.mid.value = -3;
      this.eq.high.value = 6;
    } else {
      this.eq.low.value = 0;
      this.eq.mid.value = 2;
      this.eq.high.value = 1;
    }

    // Choir mode: create parallel pitch-shifted voices
    this.updateChoirMode();
  }

  private updateChoirMode(): void {
    // Dispose existing choir voices
    this.choirVoices.forEach(voice => voice.dispose());
    this.choirVoices = [];

    if (this.settings.choirMode) {
      // Create harmonizing voices at +7 and +12 semitones
      const harmonies = [7, 12, -5];
      
      for (const harmony of harmonies) {
        const voice = new Tone.PitchShift({
          pitch: harmony,
          windowSize: 0.15
        });
        
        voice.connect(this.reverb);
        this.choirVoices.push(voice);
      }
    }
  }

  /**
   * Process an AudioBuffer through the vocal chain
   */
  async processBuffer(inputBuffer: AudioBuffer): Promise<AudioBuffer> {
    await Tone.start();
    await this.reverb.ready;

    // Use Tone.Offline for rendering
    const duration = inputBuffer.duration;
    
    const renderedBuffer = await Tone.Offline(async ({ transport, destination }) => {
      // Create a new player for offline rendering
      const offlinePlayer = new Tone.Player(inputBuffer);
      
      // Create offline effects chain
      const offlinePitch = new Tone.PitchShift({
        pitch: this.settings.demonMode ? -12 : this.settings.pitchShift,
        windowSize: 0.1
      });
      
      const offlineReverb = new Tone.Reverb({
        decay: this.settings.reverbDecay,
        wet: this.settings.reverbMix
      });
      await offlineReverb.ready;
      
      const offlineDistortion = new Tone.Distortion({
        distortion: this.settings.distortion,
        wet: this.settings.distortion > 0 ? 1 : 0
      });
      
      const offlineLimiter = new Tone.Limiter(-0.5);
      
      // Chain effects
      offlinePlayer.chain(
        offlinePitch,
        offlineDistortion,
        offlineReverb,
        offlineLimiter,
        destination
      );
      
      // Add choir voices if enabled
      if (this.settings.choirMode) {
        const harmonies = [7, 12, -5];
        for (const harmony of harmonies) {
          const voice = new Tone.PitchShift({ pitch: harmony, windowSize: 0.15 });
          const voiceGain = new Tone.Gain(0.3);
          offlinePlayer.connect(voice);
          voice.connect(voiceGain);
          voiceGain.connect(offlineReverb);
        }
      }
      
      offlinePlayer.start(0);
    }, duration);

    // Convert ToneAudioBuffer to AudioBuffer
    const audioContext = new AudioContext();
    const nativeBuffer = audioContext.createBuffer(
      renderedBuffer.numberOfChannels,
      renderedBuffer.length,
      renderedBuffer.sampleRate
    );
    
    for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
      const channelData = renderedBuffer.getChannelData(channel);
      // Create a new Float32Array to avoid type issues
      const copiedData = new Float32Array(channelData.length);
      copiedData.set(channelData);
      nativeBuffer.copyToChannel(copiedData, channel);
    }
    
    return nativeBuffer;
  }

  /**
   * Process audio from URL
   */
  async processFromUrl(url: string): Promise<AudioBuffer> {
    const player = new Tone.Player(url);
    await player.load(url);
    
    if (!player.buffer) {
      throw new Error('Failed to load audio buffer');
    }

    return this.processBuffer(player.buffer.get()!);
  }

  /**
   * Get input node for live processing
   */
  getInput(): Tone.PitchShift {
    return this.pitchShift;
  }

  /**
   * Get output node for routing
   */
  getOutput(): Tone.Gain {
    return this.gainNode;
  }

  /**
   * Connect to destination
   */
  toDestination(): this {
    this.gainNode.toDestination();
    this.isConnected = true;
    return this;
  }

  /**
   * Connect to another node
   */
  connect(destination: Tone.InputNode): this {
    this.gainNode.connect(destination);
    this.isConnected = true;
    return this;
  }

  /**
   * Set output gain
   */
  setGain(gain: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(2, gain));
  }

  /**
   * Get current settings
   */
  getSettings(): VocalProcessorSettings {
    return { ...this.settings };
  }

  /**
   * Get available presets
   */
  static getPresets(): VocalPreset[] {
    return Object.values(VOCAL_PRESETS);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.pitchShift.dispose();
    this.formantShift.dispose();
    this.reverb.dispose();
    this.delay.dispose();
    this.distortion.dispose();
    this.compressor.dispose();
    this.limiter.dispose();
    this.eq.dispose();
    this.gainNode.dispose();
    
    this.choirVoices.forEach(voice => voice.dispose());
    this.choirVoices = [];
    
    console.log('[VocalProcessor] Disposed');
  }
}

/**
 * Create a vocal processor with preset
 */
export function createVocalProcessor(presetName?: string): VocalProcessor {
  const processor = new VocalProcessor();
  
  if (presetName && VOCAL_PRESETS[presetName]) {
    processor.applyPreset(presetName);
  }
  
  return processor;
}
