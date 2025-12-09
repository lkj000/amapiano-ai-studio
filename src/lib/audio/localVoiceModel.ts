/**
 * Local Voice Model
 * 
 * Future Direction #3: Reduce ElevenLabs dependency with on-device synthesis
 * 
 * Implements a lightweight voice synthesis system using:
 * 1. Formant synthesis for speech-like sounds
 * 2. LPC (Linear Predictive Coding) for voice characteristics
 * 3. Prosody control for natural intonation
 * 4. WebAudio-based real-time synthesis
 */

export interface VoiceConfig {
  pitch: number; // Hz, fundamental frequency
  formants: FormantConfig[];
  breathiness: number; // 0-1
  tension: number; // 0-1
  vibrato: VibratoConfig;
}

export interface FormantConfig {
  frequency: number; // Hz
  bandwidth: number; // Hz
  amplitude: number; // 0-1
}

export interface VibratoConfig {
  rate: number; // Hz
  depth: number; // semitones
  delay: number; // seconds before vibrato starts
}

export interface ProsodyConfig {
  tempo: number; // syllables per second
  pitchRange: [number, number]; // Hz
  emphasis: number[]; // emphasis weights per syllable
}

export interface SynthesisResult {
  audioBuffer: AudioBuffer;
  duration: number;
  phonemes: PhonemeSegment[];
}

export interface PhonemeSegment {
  phoneme: string;
  startTime: number;
  endTime: number;
  pitch: number;
}

// Voice presets for common voice types
export const VOICE_PRESETS: Record<string, VoiceConfig> = {
  male_deep: {
    pitch: 100,
    formants: [
      { frequency: 700, bandwidth: 130, amplitude: 1.0 },
      { frequency: 1200, bandwidth: 70, amplitude: 0.5 },
      { frequency: 2600, bandwidth: 160, amplitude: 0.2 },
      { frequency: 3500, bandwidth: 200, amplitude: 0.1 }
    ],
    breathiness: 0.15,
    tension: 0.4,
    vibrato: { rate: 5.5, depth: 0.3, delay: 0.2 }
  },
  male_tenor: {
    pitch: 150,
    formants: [
      { frequency: 750, bandwidth: 120, amplitude: 1.0 },
      { frequency: 1400, bandwidth: 80, amplitude: 0.6 },
      { frequency: 2800, bandwidth: 150, amplitude: 0.25 },
      { frequency: 3600, bandwidth: 180, amplitude: 0.12 }
    ],
    breathiness: 0.1,
    tension: 0.5,
    vibrato: { rate: 5.8, depth: 0.35, delay: 0.15 }
  },
  female_alto: {
    pitch: 200,
    formants: [
      { frequency: 850, bandwidth: 100, amplitude: 1.0 },
      { frequency: 1600, bandwidth: 90, amplitude: 0.55 },
      { frequency: 2900, bandwidth: 140, amplitude: 0.3 },
      { frequency: 3800, bandwidth: 160, amplitude: 0.15 }
    ],
    breathiness: 0.2,
    tension: 0.35,
    vibrato: { rate: 5.2, depth: 0.4, delay: 0.18 }
  },
  female_soprano: {
    pitch: 280,
    formants: [
      { frequency: 900, bandwidth: 90, amplitude: 1.0 },
      { frequency: 1800, bandwidth: 100, amplitude: 0.5 },
      { frequency: 3000, bandwidth: 130, amplitude: 0.35 },
      { frequency: 4000, bandwidth: 150, amplitude: 0.18 }
    ],
    breathiness: 0.25,
    tension: 0.3,
    vibrato: { rate: 5.0, depth: 0.45, delay: 0.2 }
  }
};

// Phoneme to formant mapping for synthesis
const PHONEME_FORMANTS: Record<string, FormantConfig[]> = {
  // Vowels
  'a': [
    { frequency: 800, bandwidth: 120, amplitude: 1.0 },
    { frequency: 1200, bandwidth: 100, amplitude: 0.6 }
  ],
  'e': [
    { frequency: 400, bandwidth: 100, amplitude: 1.0 },
    { frequency: 2300, bandwidth: 120, amplitude: 0.4 }
  ],
  'i': [
    { frequency: 300, bandwidth: 80, amplitude: 1.0 },
    { frequency: 2800, bandwidth: 150, amplitude: 0.35 }
  ],
  'o': [
    { frequency: 500, bandwidth: 110, amplitude: 1.0 },
    { frequency: 900, bandwidth: 90, amplitude: 0.5 }
  ],
  'u': [
    { frequency: 350, bandwidth: 100, amplitude: 1.0 },
    { frequency: 800, bandwidth: 80, amplitude: 0.45 }
  ],
  // Consonants (simplified)
  'm': [{ frequency: 250, bandwidth: 60, amplitude: 0.8 }],
  'n': [{ frequency: 300, bandwidth: 70, amplitude: 0.75 }],
  's': [{ frequency: 5000, bandwidth: 2000, amplitude: 0.3 }],
  'sh': [{ frequency: 2500, bandwidth: 1000, amplitude: 0.35 }],
  'f': [{ frequency: 3500, bandwidth: 1500, amplitude: 0.25 }],
  'silence': []
};

/**
 * Local Voice Synthesizer using Formant Synthesis
 */
export class LocalVoiceModel {
  private audioContext: AudioContext | null = null;
  private voiceConfig: VoiceConfig;
  private sampleRate: number = 44100;

  constructor(voiceType: keyof typeof VOICE_PRESETS = 'male_tenor') {
    this.voiceConfig = { ...VOICE_PRESETS[voiceType] };
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Set voice configuration
   */
  setVoice(config: Partial<VoiceConfig>): void {
    this.voiceConfig = { ...this.voiceConfig, ...config };
  }

  /**
   * Set voice from preset
   */
  setVoicePreset(preset: keyof typeof VOICE_PRESETS): void {
    this.voiceConfig = { ...VOICE_PRESETS[preset] };
  }

  /**
   * Synthesize speech from text with phoneme-based approach
   */
  async synthesize(
    text: string,
    prosody?: Partial<ProsodyConfig>
  ): Promise<SynthesisResult> {
    await this.initialize();
    
    const phonemes = this.textToPhonemes(text);
    const duration = phonemes.length * 0.15; // ~150ms per phoneme
    
    const buffer = this.audioContext!.createBuffer(
      1,
      Math.ceil(duration * this.sampleRate),
      this.sampleRate
    );
    
    const channelData = buffer.getChannelData(0);
    const segments: PhonemeSegment[] = [];
    
    let currentSample = 0;
    const samplesPerPhoneme = Math.floor(0.15 * this.sampleRate);
    
    for (let i = 0; i < phonemes.length; i++) {
      const phoneme = phonemes[i];
      const startTime = currentSample / this.sampleRate;
      const endTime = (currentSample + samplesPerPhoneme) / this.sampleRate;
      
      // Get formants for this phoneme
      const phonemeFormants = PHONEME_FORMANTS[phoneme] || PHONEME_FORMANTS['a'];
      
      // Apply prosody modulation
      const pitchMod = prosody?.emphasis?.[i] || 1.0;
      const currentPitch = this.voiceConfig.pitch * pitchMod;
      
      // Synthesize phoneme
      this.synthesizePhoneme(
        channelData,
        currentSample,
        samplesPerPhoneme,
        phonemeFormants,
        currentPitch,
        startTime
      );
      
      segments.push({
        phoneme,
        startTime,
        endTime,
        pitch: currentPitch
      });
      
      currentSample += samplesPerPhoneme;
    }
    
    // Apply envelope to smooth transitions
    this.applyEnvelope(channelData);
    
    // Add breathiness
    if (this.voiceConfig.breathiness > 0) {
      this.addBreathiness(channelData, this.voiceConfig.breathiness);
    }
    
    return {
      audioBuffer: buffer,
      duration,
      phonemes: segments
    };
  }

  /**
   * Synthesize a sustained note (for singing)
   */
  async synthesizeNote(
    pitch: number,
    duration: number,
    vowel: string = 'a',
    dynamics: number = 0.8
  ): Promise<AudioBuffer> {
    await this.initialize();
    
    const numSamples = Math.ceil(duration * this.sampleRate);
    const buffer = this.audioContext!.createBuffer(1, numSamples, this.sampleRate);
    const channelData = buffer.getChannelData(0);
    
    const vowelFormants = PHONEME_FORMANTS[vowel] || PHONEME_FORMANTS['a'];
    
    this.synthesizePhoneme(channelData, 0, numSamples, vowelFormants, pitch, 0);
    
    // Apply ADSR envelope
    this.applyADSR(channelData, dynamics, {
      attack: 0.05,
      decay: 0.1,
      sustain: 0.7,
      release: 0.15
    });
    
    // Add vibrato
    this.addVibrato(channelData, pitch);
    
    return buffer;
  }

  /**
   * Simple text to phoneme conversion
   */
  private textToPhonemes(text: string): string[] {
    const phonemes: string[] = [];
    const normalized = text.toLowerCase().replace(/[^a-z\s]/g, '');
    
    for (const char of normalized) {
      if (char === ' ') {
        phonemes.push('silence');
      } else if ('aeiou'.includes(char)) {
        phonemes.push(char);
      } else if (char === 'm' || char === 'n') {
        phonemes.push(char);
      } else if (char === 's') {
        phonemes.push('s');
      } else if (char === 'f' || char === 'v') {
        phonemes.push('f');
      } else {
        // Map consonants to closest match
        phonemes.push('a'); // Default to 'a' sound for simplicity
      }
    }
    
    return phonemes;
  }

  /**
   * Synthesize a single phoneme using formant synthesis
   */
  private synthesizePhoneme(
    output: Float32Array,
    startSample: number,
    numSamples: number,
    formants: FormantConfig[],
    pitch: number,
    time: number
  ): void {
    // Generate glottal source (pulse train for voiced sounds)
    const glottalPeriod = this.sampleRate / pitch;
    
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= output.length) break;
      
      const t = i / this.sampleRate;
      
      // Glottal pulse (simplified Liljencrants-Fant model)
      const phase = (i / glottalPeriod) % 1.0;
      let glottal: number;
      
      if (phase < 0.4) {
        // Opening phase
        glottal = Math.sin(Math.PI * phase / 0.4);
      } else if (phase < 0.6) {
        // Closing phase
        glottal = Math.sin(Math.PI * (1 - (phase - 0.4) / 0.2));
      } else {
        // Closed phase
        glottal = 0;
      }
      
      // Apply formant filtering
      let sample = 0;
      for (const formant of formants) {
        // Simple resonance simulation
        const omega = 2 * Math.PI * formant.frequency / this.sampleRate;
        const resonance = Math.sin(omega * i) * formant.amplitude;
        const bandwidthFactor = Math.exp(-Math.PI * formant.bandwidth / this.sampleRate);
        sample += glottal * resonance * bandwidthFactor;
      }
      
      // Add aspiration noise for breathiness
      if (this.voiceConfig.breathiness > 0) {
        sample += (Math.random() * 2 - 1) * this.voiceConfig.breathiness * 0.1;
      }
      
      output[sampleIndex] += sample * 0.3; // Scale down to prevent clipping
    }
  }

  /**
   * Apply amplitude envelope
   */
  private applyEnvelope(samples: Float32Array): void {
    const attackSamples = Math.floor(0.01 * this.sampleRate);
    const releaseSamples = Math.floor(0.02 * this.sampleRate);
    
    // Attack
    for (let i = 0; i < attackSamples && i < samples.length; i++) {
      samples[i] *= i / attackSamples;
    }
    
    // Release
    for (let i = 0; i < releaseSamples && samples.length - i - 1 >= 0; i++) {
      const idx = samples.length - i - 1;
      samples[idx] *= i / releaseSamples;
    }
  }

  /**
   * Apply ADSR envelope
   */
  private applyADSR(
    samples: Float32Array,
    amplitude: number,
    adsr: { attack: number; decay: number; sustain: number; release: number }
  ): void {
    const attackSamples = Math.floor(adsr.attack * this.sampleRate);
    const decaySamples = Math.floor(adsr.decay * this.sampleRate);
    const releaseSamples = Math.floor(adsr.release * this.sampleRate);
    const sustainLevel = adsr.sustain;
    
    for (let i = 0; i < samples.length; i++) {
      let envelope: number;
      
      if (i < attackSamples) {
        // Attack phase
        envelope = (i / attackSamples) * amplitude;
      } else if (i < attackSamples + decaySamples) {
        // Decay phase
        const decayProgress = (i - attackSamples) / decaySamples;
        envelope = amplitude * (1 - decayProgress * (1 - sustainLevel));
      } else if (i < samples.length - releaseSamples) {
        // Sustain phase
        envelope = amplitude * sustainLevel;
      } else {
        // Release phase
        const releaseProgress = (i - (samples.length - releaseSamples)) / releaseSamples;
        envelope = amplitude * sustainLevel * (1 - releaseProgress);
      }
      
      samples[i] *= envelope;
    }
  }

  /**
   * Add vibrato modulation
   */
  private addVibrato(samples: Float32Array, basePitch: number): void {
    const vibrato = this.voiceConfig.vibrato;
    const delaysamples = Math.floor(vibrato.delay * this.sampleRate);
    
    for (let i = delaysamples; i < samples.length; i++) {
      const t = (i - delaysamples) / this.sampleRate;
      const vibratoMod = Math.sin(2 * Math.PI * vibrato.rate * t) * vibrato.depth;
      
      // Modulate pitch by adjusting amplitude (simplified)
      samples[i] *= 1 + vibratoMod * 0.05;
    }
  }

  /**
   * Add breathiness via filtered noise
   */
  private addBreathiness(samples: Float32Array, amount: number): void {
    // Simple high-pass filtered noise
    let prevNoise = 0;
    for (let i = 0; i < samples.length; i++) {
      const noise = Math.random() * 2 - 1;
      const filtered = noise - prevNoise * 0.95; // High-pass filter
      prevNoise = noise;
      samples[i] += filtered * amount * 0.05;
    }
  }

  /**
   * Play audio buffer
   */
  async play(buffer: AudioBuffer): Promise<void> {
    await this.initialize();
    
    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext!.destination);
    source.start();
  }

  /**
   * Get AudioContext for external use
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const localVoiceModel = new LocalVoiceModel();
