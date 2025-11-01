/**
 * Phase 2: Advanced DSP - Chorus Effect
 */

import type { DSPParameter, DSPModule } from './types';

export function getChorusParams(): DSPParameter[] {
  return [
    {
      id: 'rate',
      label: 'Rate',
      type: 'float',
      default: 0.5,
      min: 0.1,
      max: 10,
      unit: 'Hz',
      affects: 'Modulation',
      category: 'control',
      automatable: true,
      description: 'LFO frequency for pitch modulation'
    },
    {
      id: 'depth',
      label: 'Depth',
      type: 'float',
      default: 0.3,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Modulation',
      category: 'control',
      automatable: true,
      description: 'Amount of pitch modulation'
    },
    {
      id: 'voices',
      label: 'Voices',
      type: 'int',
      default: 3,
      min: 1,
      max: 8,
      affects: 'Thickness',
      category: 'control',
      automatable: false,
      description: 'Number of delayed voices'
    },
    {
      id: 'stereoWidth',
      label: 'Stereo Width',
      type: 'float',
      default: 0.7,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Stereo Image',
      category: 'control',
      automatable: false,
      description: 'Spread voices across stereo field'
    },
    {
      id: 'feedback',
      label: 'Feedback',
      type: 'float',
      default: 0.2,
      min: 0,
      max: 0.9,
      unit: '%',
      affects: 'Resonance',
      category: 'control',
      automatable: true,
      description: 'Feed output back to input for richer sound'
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

export function generateChorusCode(framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// Multi-voice chorus with stereo spreading
class ChorusEffect {
private:
    static constexpr int maxVoices = 8;
    static constexpr int maxDelay = 96000; // 2s at 48kHz
    
    juce::dsp::DelayLine<float> delayLines[maxVoices];
    juce::dsp::Oscillator<float> lfos[maxVoices];
    juce::dsp::DryWetMixer<float> mixer;
    
    int numVoices = 3;
    float depth = 0.3f;
    float feedback = 0.2f;
    
public:
    void prepare(const juce::dsp::ProcessSpec& spec) {
        for (int i = 0; i < maxVoices; ++i) {
            delayLines[i].prepare(spec);
            delayLines[i].setMaximumDelayInSamples(maxDelay);
            
            lfos[i].prepare(spec);
            lfos[i].initialise([](float x) { return std::sin(x); }, 128);
            
            // Phase offset each LFO for richer modulation
            lfos[i].setFrequency(0.5f, true);
            lfos[i].reset();
            for (int p = 0; p < i * 16; ++p) {
                lfos[i].processSample(0.0f);
            }
        }
        
        mixer.prepare(spec);
    }
    
    void setRate(float rateHz) {
        for (int i = 0; i < numVoices; ++i) {
            // Slight frequency variation per voice
            float variation = 1.0f + (i * 0.1f);
            lfos[i].setFrequency(rateHz * variation);
        }
    }
    
    void processBlock(juce::AudioBuffer<float>& buffer, float stereoWidth) {
        const int numSamples = buffer.getNumSamples();
        const int numChannels = buffer.getNumChannels();
        
        mixer.pushDrySamples(juce::dsp::AudioBlock<float>(buffer));
        
        juce::AudioBuffer<float> wetBuffer(numChannels, numSamples);
        wetBuffer.clear();
        
        for (int voice = 0; voice < numVoices; ++voice) {
            // Pan each voice across stereo field
            float pan = (voice / (float)(numVoices - 1)) * stereoWidth;
            float leftGain = std::cos(pan * juce::MathConstants<float>::halfPi);
            float rightGain = std::sin(pan * juce::MathConstants<float>::halfPi);
            
            for (int i = 0; i < numSamples; ++i) {
                // Generate LFO modulation
                float lfoValue = lfos[voice].processSample(0.0f);
                
                // Calculate delay time (5-20ms range)
                float delayMs = 5.0f + (lfoValue * 0.5f + 0.5f) * 15.0f * depth;
                float delaySamples = delayMs * getSampleRate() / 1000.0f;
                
                delayLines[voice].setDelay(delaySamples);
                
                // Process stereo
                if (numChannels == 2) {
                    float leftIn = buffer.getSample(0, i);
                    float rightIn = buffer.getSample(1, i);
                    
                    float delayedL = delayLines[voice].popSample(0);
                    float delayedR = delayLines[voice].popSample(1);
                    
                    delayLines[voice].pushSample(0, leftIn + delayedL * feedback);
                    delayLines[voice].pushSample(1, rightIn + delayedR * feedback);
                    
                    wetBuffer.addSample(0, i, delayedL * leftGain);
                    wetBuffer.addSample(1, i, delayedR * rightGain);
                }
            }
        }
        
        mixer.mixWetSamples(juce::dsp::AudioBlock<float>(wetBuffer));
        buffer.makeCopyOf(wetBuffer);
    }
};`;
  } else {
    return `
// Web Audio chorus effect
class ChorusEffect {
    constructor(context, voices = 3) {
        this.context = context;
        this.voices = voices;
        this.delays = [];
        this.lfos = [];
        this.gains = [];
        
        this.input = context.createGain();
        this.output = context.createGain();
        this.wetGain = context.createGain();
        this.dryGain = context.createGain();
        
        this.createVoices();
    }
    
    createVoices() {
        for (let i = 0; i < this.voices; i++) {
            // Create delay line
            const delay = this.context.createDelay(0.1);
            delay.delayTime.value = 0.01 + (i * 0.005);
            
            // Create LFO
            const lfo = this.context.createOscillator();
            lfo.frequency.value = 0.5 + (i * 0.1);
            lfo.type = 'sine';
            
            // Create LFO gain (modulation depth)
            const lfoGain = this.context.createGain();
            lfoGain.gain.value = 0.005; // 5ms modulation depth
            
            // Create voice gain (pan)
            const voiceGain = this.context.createGain();
            const pan = i / (this.voices - 1);
            voiceGain.gain.value = 0.5;
            
            // Connect LFO to delay time
            lfo.connect(lfoGain);
            lfoGain.connect(delay.delayTime);
            lfo.start();
            
            // Connect audio path
            this.input.connect(delay);
            delay.connect(voiceGain);
            voiceGain.connect(this.wetGain);
            
            this.delays.push(delay);
            this.lfos.push(lfo);
            this.gains.push(voiceGain);
        }
        
        // Mix wet and dry
        this.input.connect(this.dryGain);
        this.dryGain.connect(this.output);
        this.wetGain.connect(this.output);
        
        this.setMix(0.5);
    }
    
    setRate(rateHz) {
        this.lfos.forEach((lfo, i) => {
            lfo.frequency.value = rateHz * (1 + i * 0.1);
        });
    }
    
    setDepth(depth) {
        // Depth affects LFO modulation amount
        this.wetGain.gain.value = depth;
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

export const ChorusModule: DSPModule = {
  id: 'chorus',
  name: 'Multi-Voice Chorus',
  category: 'modulation',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  parameters: getChorusParams(),
  generateCode: generateChorusCode
};
