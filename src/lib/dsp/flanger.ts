// Flanger DSP Module - Phase 2
import type { DSPModule, DSPParameter } from './types';

export const FlangerModule: DSPModule = {
  id: 'flanger',
  name: 'Flanger',
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
      default: 0.5,
      min: 0.01,
      max: 10.0,
      step: 0.01,
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
      id: 'feedback',
      label: 'Feedback',
      type: 'float',
      default: 30,
      min: -95,
      max: 95,
      step: 1,
      unit: '%',
      affects: 'Resonance',
      description: 'Feedback amount',
      category: 'control',
      automatable: true
    },
    {
      id: 'delay',
      label: 'Base Delay',
      type: 'float',
      default: 2.0,
      min: 0.1,
      max: 10.0,
      step: 0.1,
      unit: 'ms',
      affects: 'Delay time',
      description: 'Base delay time',
      category: 'control',
      automatable: true
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
      description: 'Wet/dry mix',
      category: 'output',
      automatable: true
    }
  ],

  generateCode: (framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]) => {
    if (framework === 'juce') {
      return `
// Flanger Effect
class Flanger {
private:
    std::vector<float> delayBuffer;
    int writePos = 0;
    float lfoPhase = 0.0f;
    float sampleRate = 44100.0f;
    
    float rate = 0.5f;
    float depth = 0.5f;
    float feedback = 0.3f;
    float baseDelay = 2.0f;
    float mix = 0.5f;

public:
    void prepare(double sr, int maxDelaySamples) {
        sampleRate = static_cast<float>(sr);
        delayBuffer.resize(maxDelaySamples, 0.0f);
    }

    float process(float input) {
        // Calculate LFO
        float lfo = std::sin(lfoPhase * 2.0f * M_PI);
        lfoPhase += rate / sampleRate;
        if (lfoPhase >= 1.0f) lfoPhase -= 1.0f;

        // Calculate delay time in samples
        float delayMs = baseDelay + (depth * 5.0f * (lfo + 1.0f) * 0.5f);
        float delaySamples = (delayMs / 1000.0f) * sampleRate;
        
        // Read from delay buffer with interpolation
        float readPos = writePos - delaySamples;
        while (readPos < 0) readPos += delayBuffer.size();
        
        int pos1 = static_cast<int>(readPos);
        int pos2 = (pos1 + 1) % delayBuffer.size();
        float frac = readPos - pos1;
        
        float delayed = delayBuffer[pos1] * (1.0f - frac) + delayBuffer[pos2] * frac;
        
        // Apply feedback
        float toWrite = input + delayed * feedback;
        delayBuffer[writePos] = toWrite;
        
        writePos = (writePos + 1) % delayBuffer.size();
        
        // Mix
        return input * (1.0f - mix) + delayed * mix;
    }
};`;
    } else if (framework === 'webaudio') {
      return `
// Web Audio Flanger
const createFlanger = (context) => {
  const input = context.createGain();
  const output = context.createGain();
  const delay = context.createDelay(0.05);
  const feedback = context.createGain();
  const dry = context.createGain();
  const wet = context.createGain();
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();

  // Setup LFO
  lfo.frequency.value = 0.5; // rate param
  lfoGain.gain.value = 0.002; // depth param
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);
  
  // Base delay
  delay.delayTime.value = 0.002; // 2ms base
  
  // Feedback path
  feedback.gain.value = 0.3;
  delay.connect(feedback);
  feedback.connect(delay);
  
  // Wet/dry mix
  dry.gain.value = 0.5;
  wet.gain.value = 0.5;
  
  // Connect
  input.connect(dry);
  input.connect(delay);
  delay.connect(wet);
  dry.connect(output);
  wet.connect(output);
  
  lfo.start();
  
  return { input, output, delay, feedback, lfo, lfoGain, dry, wet };
};`;
    }
    return '';
  },

  validateParameters: (params: Record<string, any>) => {
    if (params.rate < 0.01 || params.rate > 10) return false;
    if (params.depth < 0 || params.depth > 100) return false;
    if (params.feedback < -95 || params.feedback > 95) return false;
    if (params.delay < 0.1 || params.delay > 10) return false;
    return true;
  }
};
