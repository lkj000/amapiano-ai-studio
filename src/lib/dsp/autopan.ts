// Auto-Pan DSP Module - Phase 2
import type { DSPModule, DSPParameter } from './types';

export const AutoPanModule: DSPModule = {
  id: 'autopan',
  name: 'Auto-Pan',
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
      default: 2.0,
      min: 0.01,
      max: 20.0,
      step: 0.01,
      unit: 'Hz',
      affects: 'Pan speed',
      description: 'Panning modulation rate',
      category: 'control',
      automatable: true
    },
    {
      id: 'depth',
      label: 'Depth',
      type: 'float',
      default: 75,
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      affects: 'Pan width',
      description: 'Panning depth',
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
      id: 'panLaw',
      label: 'Pan Law',
      type: 'float',
      default: -3.0,
      min: -6.0,
      max: 0.0,
      step: 0.5,
      unit: 'dB',
      affects: 'Center attenuation',
      description: 'Pan law compensation',
      category: 'control',
      automatable: false
    }
  ],

  generateCode: (framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]) => {
    if (framework === 'juce') {
      return `
// Auto-Pan Effect
class AutoPan {
private:
    float phase = 0.0f;
    float sampleRate = 44100.0f;
    float rate = 2.0f;
    float depth = 0.75f;
    float panLaw = -3.0f;
    int waveform = 0;

    float getLFO(float ph) {
        switch (waveform) {
            case 0: return std::sin(ph * 2.0f * M_PI);
            case 1: return 2.0f * std::abs(2.0f * (ph - std::floor(ph + 0.5f))) - 1.0f;
            case 2: return ph < 0.5f ? 1.0f : -1.0f;
            case 3: return (static_cast<float>(rand()) / RAND_MAX) * 2.0f - 1.0f;
            default: return 0.0f;
        }
    }

public:
    void setSampleRate(double sr) { sampleRate = static_cast<float>(sr); }

    void process(float* left, float* right, int numSamples) {
        for (int i = 0; i < numSamples; ++i) {
            // Get LFO value (-1 to 1)
            float lfo = getLFO(phase) * depth;
            
            // Convert to pan position (0 = left, 1 = right)
            float pan = (lfo + 1.0f) * 0.5f;
            
            // Apply constant power panning with pan law
            float angle = pan * M_PI * 0.5f;
            float leftGain = std::cos(angle);
            float rightGain = std::sin(angle);
            
            // Apply pan law compensation
            float compensation = std::pow(10.0f, panLaw / 20.0f);
            float centerBoost = 1.0f + (1.0f - std::abs(lfo)) * (1.0f - compensation);
            
            float mono = (left[i] + right[i]) * 0.5f;
            left[i] = mono * leftGain * centerBoost;
            right[i] = mono * rightGain * centerBoost;
            
            phase += rate / sampleRate;
            if (phase >= 1.0f) phase -= 1.0f;
        }
    }
};`;
    } else if (framework === 'webaudio') {
      return `
// Web Audio Auto-Pan
const createAutoPan = (context) => {
  const input = context.createGain();
  const output = context.createGain();
  const splitter = context.createChannelSplitter(2);
  const merger = context.createChannelMerger(2);
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  const pannerL = context.createGain();
  const pannerR = context.createGain();

  // Setup LFO
  lfo.type = 'sine';
  lfo.frequency.value = 2.0; // rate param
  lfoGain.gain.value = 0.75; // depth param

  // Connect LFO to gains
  lfo.connect(lfoGain);
  
  // Invert for left channel
  const inverter = context.createGain();
  inverter.gain.value = -1;
  lfoGain.connect(inverter);
  inverter.connect(pannerL.gain);
  lfoGain.connect(pannerR.gain);

  // Connect audio path
  input.connect(splitter);
  splitter.connect(pannerL, 0);
  splitter.connect(pannerR, 1);
  pannerL.connect(merger, 0, 0);
  pannerR.connect(merger, 0, 1);
  merger.connect(output);

  lfo.start();

  return { input, output, lfo, lfoGain, pannerL, pannerR };
};`;
    }
    return '';
  },

  validateParameters: (params: Record<string, any>) => {
    if (params.rate < 0.01 || params.rate > 20) return false;
    if (params.depth < 0 || params.depth > 100) return false;
    if (params.panLaw < -6 || params.panLaw > 0) return false;
    return true;
  }
};
