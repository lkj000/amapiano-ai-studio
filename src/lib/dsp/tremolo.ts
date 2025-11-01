// Tremolo DSP Module - Phase 2
import type { DSPModule, DSPParameter } from './types';

export const TremoloModule: DSPModule = {
  id: 'tremolo',
  name: 'Tremolo',
  category: 'modulation',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  
  parameters: [
    {
      id: 'rate',
      label: 'Rate',
      type: 'float',
      default: 4.0,
      min: 0.1,
      max: 20.0,
      step: 0.1,
      unit: 'Hz',
      affects: 'LFO speed',
      description: 'Modulation rate',
      category: 'control',
      automatable: true
    },
    {
      id: 'depth',
      label: 'Depth',
      type: 'float',
      default: 50,
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      affects: 'Modulation amount',
      description: 'Modulation depth',
      category: 'control',
      automatable: true
    },
    {
      id: 'waveform',
      label: 'Waveform',
      type: 'enum',
      default: 'sine',
      affects: 'LFO shape',
      description: 'LFO waveform type',
      category: 'control',
      automatable: false,
      valueStrings: ['sine', 'triangle', 'square', 'random']
    },
    {
      id: 'stereoPhase',
      label: 'Stereo Phase',
      type: 'float',
      default: 0,
      min: 0,
      max: 180,
      step: 1,
      unit: '°',
      affects: 'Stereo width',
      description: 'Phase offset between channels',
      category: 'control',
      automatable: true
    }
  ],

  generateCode: (framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]) => {
    if (framework === 'juce') {
      return `
// Tremolo Effect
class Tremolo {
private:
    float phase = 0.0f;
    float sampleRate = 44100.0f;
    float rate = 4.0f;
    float depth = 0.5f;
    float stereoPhase = 0.0f;
    int waveform = 0; // 0=sine, 1=tri, 2=square, 3=random

public:
    void setSampleRate(double sr) { sampleRate = static_cast<float>(sr); }
    
    float getLFO(float ph) {
        switch (waveform) {
            case 0: // Sine
                return std::sin(ph * 2.0f * M_PI);
            case 1: // Triangle
                return 2.0f * std::abs(2.0f * (ph - std::floor(ph + 0.5f))) - 1.0f;
            case 2: // Square
                return ph < 0.5f ? 1.0f : -1.0f;
            case 3: // Random
                return (static_cast<float>(rand()) / RAND_MAX) * 2.0f - 1.0f;
            default:
                return 0.0f;
        }
    }

    void process(float* left, float* right, int numSamples) {
        for (int i = 0; i < numSamples; ++i) {
            float lfoL = getLFO(phase);
            float lfoR = getLFO(phase + stereoPhase / 360.0f);
            
            float modulationL = 1.0f - (depth * 0.5f * (1.0f - lfoL));
            float modulationR = 1.0f - (depth * 0.5f * (1.0f - lfoR));
            
            left[i] *= modulationL;
            right[i] *= modulationR;
            
            phase += rate / sampleRate;
            if (phase >= 1.0f) phase -= 1.0f;
        }
    }
};`;
    } else if (framework === 'webaudio') {
      return `
// Web Audio Tremolo
const createTremolo = (context) => {
  const input = context.createGain();
  const output = context.createGain();
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  const dcOffset = context.createGain();

  // Setup LFO
  lfo.type = 'sine';
  lfo.frequency.value = 4.0; // rate param
  
  // LFO depth control
  lfoGain.gain.value = 0.5; // depth param
  
  // DC offset to keep signal always positive
  dcOffset.gain.value = 1.0;
  
  // Connect
  lfo.connect(lfoGain);
  lfoGain.connect(input.gain);
  input.connect(output);
  
  // Start LFO
  lfo.start();
  
  return { input, output, lfo, lfoGain };
};`;
    }
    return '';
  },

  validateParameters: (params: Record<string, any>) => {
    if (params.rate < 0.1 || params.rate > 20) return false;
    if (params.depth < 0 || params.depth > 100) return false;
    if (params.stereoPhase < 0 || params.stereoPhase > 180) return false;
    return true;
  }
};
