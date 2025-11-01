/**
 * Phase 2: Advanced DSP - Phaser Effect
 */

import type { DSPParameter, DSPModule } from './types';

export function getPhaserParams(): DSPParameter[] {
  return [
    {
      id: 'rate',
      label: 'Rate',
      type: 'float',
      default: 0.4,
      min: 0.05,
      max: 5,
      unit: 'Hz',
      affects: 'Modulation',
      category: 'control',
      automatable: true
    },
    {
      id: 'depth',
      label: 'Depth',
      type: 'float',
      default: 0.7,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Modulation',
      category: 'control',
      automatable: true
    },
    {
      id: 'stages',
      label: 'Stages',
      type: 'int',
      default: 6,
      min: 2,
      max: 12,
      affects: 'Character',
      category: 'control',
      automatable: false,
      description: 'Number of all-pass filter stages'
    },
    {
      id: 'feedback',
      label: 'Feedback',
      type: 'float',
      default: 0.5,
      min: -0.95,
      max: 0.95,
      unit: '%',
      affects: 'Resonance',
      category: 'control',
      automatable: true
    },
    {
      id: 'centerFreq',
      label: 'Center Frequency',
      type: 'float',
      default: 1000,
      min: 200,
      max: 5000,
      unit: 'Hz',
      affects: 'Tone',
      category: 'control',
      automatable: false
    },
    {
      id: 'mix',
      label: 'Wet/Dry',
      type: 'float',
      default: 0.5,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Blend',
      category: 'control',
      automatable: true
    }
  ];
}

export function generatePhaserCode(framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// Classic phaser with all-pass filter cascade
class PhaserEffect {
private:
    static constexpr int maxStages = 12;
    
    juce::dsp::IIR::Filter<float> allpassFilters[maxStages][2]; // Stereo
    juce::dsp::Oscillator<float> lfo;
    juce::dsp::DryWetMixer<float> mixer;
    
    int numStages = 6;
    float centerFreq = 1000.0f;
    float depth = 0.7f;
    float feedback = 0.5f;
    float lastOutput[2] = {0.0f, 0.0f};
    
public:
    void prepare(const juce::dsp::ProcessSpec& spec) {
        for (int stage = 0; stage < maxStages; ++stage) {
            for (int ch = 0; ch < 2; ++ch) {
                allpassFilters[stage][ch].prepare(spec);
            }
        }
        
        lfo.prepare(spec);
        lfo.initialise([](float x) { return std::sin(x); }, 128);
        lfo.setFrequency(0.4f);
        
        mixer.prepare(spec);
    }
    
    void setRate(float rateHz) {
        lfo.setFrequency(rateHz);
    }
    
    void processBlock(juce::AudioBuffer<float>& buffer) {
        const int numSamples = buffer.getNumSamples();
        const int numChannels = buffer.getNumChannels();
        
        mixer.pushDrySamples(juce::dsp::AudioBlock<float>(buffer));
        
        for (int i = 0; i < numSamples; ++i) {
            // Generate LFO value
            float lfoValue = lfo.processSample(0.0f);
            
            // Calculate frequency sweep (200Hz to 5kHz)
            float sweepFreq = centerFreq * std::pow(10.0f, lfoValue * depth);
            
            // Update all-pass filter coefficients
            for (int stage = 0; stage < numStages; ++stage) {
                for (int ch = 0; ch < numChannels; ++ch) {
                    *allpassFilters[stage][ch].coefficients = 
                        *juce::dsp::IIR::Coefficients<float>::makeAllPass(
                            getSampleRate(), sweepFreq
                        );
                }
            }
            
            // Process each channel through filter cascade
            for (int ch = 0; ch < numChannels; ++ch) {
                float sample = buffer.getSample(ch, i);
                
                // Add feedback from previous output
                sample += lastOutput[ch] * feedback;
                
                // Pass through all-pass filter cascade
                for (int stage = 0; stage < numStages; ++stage) {
                    sample = allpassFilters[stage][ch].processSample(sample);
                }
                
                lastOutput[ch] = sample;
                buffer.setSample(ch, i, sample);
            }
        }
        
        mixer.mixWetSamples(juce::dsp::AudioBlock<float>(buffer));
    }
};`;
  } else {
    return `
// Web Audio phaser using BiquadFilters
class PhaserEffect {
    constructor(context, stages = 6) {
        this.context = context;
        this.stages = stages;
        
        // Create filter stages
        this.filters = [];
        for (let i = 0; i < stages; i++) {
            const filter = context.createBiquadFilter();
            filter.type = 'allpass';
            filter.frequency.value = 1000;
            filter.Q.value = 1;
            this.filters.push(filter);
        }
        
        // Create LFO
        this.lfo = context.createOscillator();
        this.lfo.frequency.value = 0.4;
        this.lfo.type = 'sine';
        
        // Create LFO gain for modulation depth
        this.lfoGain = context.createGain();
        this.lfoGain.gain.value = 1000; // Frequency modulation range
        
        // Create feedback path
        this.feedbackGain = context.createGain();
        this.feedbackGain.gain.value = 0.5;
        
        // Create mix controls
        this.input = context.createGain();
        this.output = context.createGain();
        this.wetGain = context.createGain();
        this.dryGain = context.createGain();
        
        this.setupRouting();
    }
    
    setupRouting() {
        // Connect filter chain
        let currentNode = this.input;
        for (const filter of this.filters) {
            currentNode.connect(filter);
            currentNode = filter;
        }
        
        // Connect feedback
        currentNode.connect(this.feedbackGain);
        this.feedbackGain.connect(this.filters[0]);
        
        // Connect LFO to all filter frequencies
        this.lfo.connect(this.lfoGain);
        for (const filter of this.filters) {
            this.lfoGain.connect(filter.frequency);
        }
        
        // Connect wet/dry mix
        currentNode.connect(this.wetGain);
        this.input.connect(this.dryGain);
        this.wetGain.connect(this.output);
        this.dryGain.connect(this.output);
        
        this.lfo.start();
        this.setMix(0.5);
    }
    
    setRate(rateHz) {
        this.lfo.frequency.value = rateHz;
    }
    
    setDepth(depth) {
        this.lfoGain.gain.value = depth * 2000; // Max 2kHz modulation
    }
    
    setFeedback(feedback) {
        this.feedbackGain.gain.value = feedback;
    }
    
    setMix(mix) {
        this.wetGain.gain.value = mix;
        this.dryGain.gain.value = 1 - mix;
    }
    
    connect(destination) {
        this.output.connect(destination);
    }
}`;
  }
}

export const PhaserModule: DSPModule = {
  id: 'phaser',
  name: 'Classic Phaser',
  category: 'modulation',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  parameters: getPhaserParams(),
  generateCode: generatePhaserCode
};
