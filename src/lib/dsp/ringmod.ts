// Ring Modulator DSP Module - Phase 2
import type { DSPModule, DSPParameter } from './types';

export const RingModulatorModule: DSPModule = {
  id: 'ringmod',
  name: 'Ring Modulator',
  category: 'modulation',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  
  parameters: [
    {
      id: 'frequency',
      label: 'Frequency',
      type: 'float',
      default: 440,
      min: 20,
      max: 5000,
      step: 1,
      unit: 'Hz',
      affects: 'Carrier frequency',
      description: 'Modulation frequency',
      category: 'control',
      automatable: true
    },
    {
      id: 'waveform',
      label: 'Waveform',
      type: 'enum',
      default: 'sine',
      affects: 'Carrier waveform',
      description: 'Carrier oscillator waveform',
      category: 'control',
      automatable: false,
      valueStrings: ['sine', 'square', 'triangle', 'sawtooth']
    },
    {
      id: 'mix',
      label: 'Mix',
      type: 'float',
      default: 50,
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      affects: 'Wet/dry balance',
      description: 'Effect mix',
      category: 'output',
      automatable: true
    }
  ],

  generateCode: (framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]) => {
    if (framework === 'juce') {
      return `
// Ring Modulator Effect
class RingModulator {
private:
    float phase = 0.0f;
    float sampleRate = 44100.0f;
    float frequency = 440.0f;
    float mix = 0.5f;
    int waveform = 0;

    float getOscillator(float ph) {
        switch (waveform) {
            case 0: // Sine
                return std::sin(ph * 2.0f * M_PI);
            case 1: // Square
                return ph < 0.5f ? 1.0f : -1.0f;
            case 2: // Triangle
                return 2.0f * std::abs(2.0f * (ph - std::floor(ph + 0.5f))) - 1.0f;
            case 3: // Sawtooth
                return 2.0f * (ph - std::floor(ph + 0.5f));
            default:
                return 0.0f;
        }
    }

public:
    void setSampleRate(double sr) { sampleRate = static_cast<float>(sr); }

    float process(float input) {
        float carrier = getOscillator(phase);
        float modulated = input * carrier;
        
        phase += frequency / sampleRate;
        if (phase >= 1.0f) phase -= 1.0f;
        
        return input * (1.0f - mix) + modulated * mix;
    }
};`;
    } else if (framework === 'webaudio') {
      return `
// Web Audio Ring Modulator
const createRingModulator = (context) => {
  const input = context.createGain();
  const output = context.createGain();
  const carrier = context.createOscillator();
  const modulator = context.createGain();
  const dry = context.createGain();
  const wet = context.createGain();

  // Setup carrier oscillator
  carrier.type = 'sine';
  carrier.frequency.value = 440;

  // Modulation
  carrier.connect(modulator.gain);
  input.connect(modulator);
  
  // Mix
  dry.gain.value = 0.5;
  wet.gain.value = 0.5;
  input.connect(dry);
  modulator.connect(wet);
  dry.connect(output);
  wet.connect(output);

  carrier.start();

  return { input, output, carrier, modulator, dry, wet };
};`;
    }
    return '';
  },

  validateParameters: (params: Record<string, any>) => {
    if (params.frequency < 20 || params.frequency > 5000) return false;
    if (params.mix < 0 || params.mix > 100) return false;
    return true;
  }
};
