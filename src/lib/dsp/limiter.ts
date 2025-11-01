/**
 * Phase 2: Advanced DSP - Brickwall Limiter
 */

import type { DSPParameter, DSPModule } from './types';

export function getLimiterParams(): DSPParameter[] {
  return [
    {
      id: 'ceiling',
      label: 'Ceiling',
      type: 'float',
      default: -0.3,
      min: -12,
      max: 0,
      step: 0.1,
      unit: 'dB',
      affects: 'Output Level',
      category: 'control',
      automatable: false,
      description: 'Maximum output level - leaves headroom for codec artifacts'
    },
    {
      id: 'release',
      label: 'Release',
      type: 'float',
      default: 50,
      min: 1,
      max: 1000,
      unit: 'ms',
      affects: 'Dynamics',
      category: 'control',
      automatable: true,
      description: 'How quickly limiting recovers after peaks'
    },
    {
      id: 'lookahead',
      label: 'Lookahead',
      type: 'float',
      default: 5,
      min: 0,
      max: 20,
      unit: 'ms',
      affects: 'Transient Handling',
      category: 'control',
      automatable: false,
      description: 'Preview buffer for transparent peak catching'
    },
    {
      id: 'linkChannels',
      label: 'Link Channels',
      type: 'bool',
      default: true,
      affects: 'Stereo Image',
      category: 'control',
      automatable: false,
      description: 'Process L/R together to preserve stereo image'
    }
  ];
}

export function generateLimiterCode(framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// True peak brickwall limiter with lookahead
class BrickwallLimiter {
private:
    juce::dsp::DelayLine<float> lookaheadDelay { 48000 };
    std::vector<float> envelope;
    float ceiling = 1.0f;
    float release = 0.05f;
    int lookaheadSamples = 240; // 5ms at 48kHz
    float currentGainReduction = 1.0f;
    
public:
    void prepare(const juce::dsp::ProcessSpec& spec) {
        lookaheadDelay.prepare(spec);
        lookaheadDelay.setDelay(lookaheadSamples);
        envelope.resize(spec.maximumBlockSize, 0.0f);
    }
    
    void setCeiling(float ceilingDb) {
        ceiling = juce::Decibels::decibelsToGain(ceilingDb);
    }
    
    void setRelease(float releaseMs, float sampleRate) {
        release = 1.0f - std::exp(-1.0f / (releaseMs * sampleRate / 1000.0f));
    }
    
    void processBlock(juce::AudioBuffer<float>& buffer, bool linkChannels) {
        const int numSamples = buffer.getNumSamples();
        const int numChannels = buffer.getNumChannels();
        
        // Calculate envelope from lookahead buffer
        for (int i = 0; i < numSamples; ++i) {
            float peakLevel = 0.0f;
            
            // Find peak across all channels
            for (int ch = 0; ch < numChannels; ++ch) {
                float sample = std::abs(buffer.getSample(ch, i));
                peakLevel = std::max(peakLevel, sample);
            }
            
            // Calculate required gain reduction
            float targetGain = (peakLevel > ceiling) ? ceiling / peakLevel : 1.0f;
            
            // Smooth envelope with release
            if (targetGain < currentGainReduction) {
                currentGainReduction = targetGain; // Instant attack
            } else {
                currentGainReduction += release * (targetGain - currentGainReduction);
            }
            
            envelope[i] = currentGainReduction;
        }
        
        // Apply gain reduction with lookahead delay
        for (int ch = 0; ch < numChannels; ++ch) {
            for (int i = 0; i < numSamples; ++i) {
                float delayed = lookaheadDelay.popSample(ch);
                lookaheadDelay.pushSample(ch, buffer.getSample(ch, i));
                
                buffer.setSample(ch, i, delayed * envelope[i]);
            }
        }
    }
    
    float getCurrentGainReduction() const {
        return juce::Decibels::gainToDecibels(currentGainReduction);
    }
};`;
  } else {
    return `
// Web Audio brickwall limiter with lookahead
class BrickwallLimiter {
    constructor(context, ceilingDb = -0.3, releaseMs = 50, lookaheadMs = 5) {
        this.context = context;
        this.ceiling = Math.pow(10, ceilingDb / 20);
        this.release = releaseMs;
        this.lookaheadSamples = Math.floor(lookaheadMs * context.sampleRate / 1000);
        
        // Use AudioWorklet for true lookahead limiting
        this.processor = null;
        this.loadProcessor();
    }
    
    async loadProcessor() {
        await this.context.audioWorklet.addModule('/limiter-processor.js');
        this.processor = new AudioWorkletNode(this.context, 'limiter-processor', {
            processorOptions: {
                ceiling: this.ceiling,
                release: this.release,
                lookahead: this.lookaheadSamples
            }
        });
    }
    
    setCeiling(ceilingDb) {
        this.ceiling = Math.pow(10, ceilingDb / 20);
        if (this.processor) {
            this.processor.port.postMessage({
                type: 'setCeiling',
                value: this.ceiling
            });
        }
    }
    
    setRelease(releaseMs) {
        this.release = releaseMs;
        if (this.processor) {
            this.processor.port.postMessage({
                type: 'setRelease',
                value: releaseMs
            });
        }
    }
    
    connect(destination) {
        if (this.processor) {
            this.processor.connect(destination);
        }
    }
}`;
  }
}

export const LimiterModule: DSPModule = {
  id: 'limiter',
  name: 'Brickwall Limiter',
  category: 'dynamics',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 5, // 5ms lookahead
  parameters: getLimiterParams(),
  generateCode: generateLimiterCode
};
