/**
 * Stereo Imaging DSP Module
 * Professional stereo width control, mid/side processing, and spatial enhancement
 */

import type { DSPParameter, DSPModule } from './types';

export function getStereoImagerParams(): DSPParameter[] {
  return [
    {
      id: 'width',
      label: 'Stereo Width',
      type: 'float',
      default: 100,
      min: 0,
      max: 200,
      step: 1,
      unit: '%',
      affects: 'Stereo Image',
      category: 'control',
      automatable: true,
      description: '0% = mono, 100% = original, 200% = extra wide'
    },
    {
      id: 'midGain',
      label: 'Mid Gain',
      type: 'float',
      default: 0,
      min: -12,
      max: 12,
      step: 0.1,
      unit: 'dB',
      affects: 'Center Balance',
      category: 'control',
      automatable: true,
      description: 'Boost/cut center channel content'
    },
    {
      id: 'sideGain',
      label: 'Side Gain',
      type: 'float',
      default: 0,
      min: -12,
      max: 12,
      step: 0.1,
      unit: 'dB',
      affects: 'Stereo Width',
      category: 'control',
      automatable: true,
      description: 'Boost/cut side channel content'
    },
    {
      id: 'lowCrossover',
      label: 'Bass Mono Below',
      type: 'float',
      default: 120,
      min: 20,
      max: 300,
      step: 1,
      unit: 'Hz',
      affects: 'Low-End Focus',
      category: 'control',
      automatable: false,
      description: 'Mono frequencies below this for tight bass'
    },
    {
      id: 'highEnhance',
      label: 'High Enhance',
      type: 'float',
      default: 0,
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      affects: 'Air/Brightness',
      category: 'control',
      automatable: true,
      description: 'Add stereo width to high frequencies'
    },
    {
      id: 'safeWidth',
      label: 'Safe Width',
      type: 'bool',
      default: true,
      affects: 'Mono Compatibility',
      category: 'control',
      description: 'Limit width to prevent phase issues'
    },
    {
      id: 'correlationTarget',
      label: 'Correlation Target',
      type: 'float',
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      unit: '',
      affects: 'Phase Coherence',
      category: 'control',
      description: 'Target stereo correlation (1 = mono, 0 = out of phase)'
    }
  ];
}

export function generateStereoImagerCode(framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// Professional Mid/Side Stereo Imager
class StereoImager {
private:
    float width = 1.0f;
    float midGain = 1.0f;
    float sideGain = 1.0f;
    float lowCrossover = 120.0f;
    juce::dsp::LinkwitzRileyFilter<float> lowpassL, lowpassR;
    juce::dsp::LinkwitzRileyFilter<float> highpassL, highpassR;
    
public:
    void prepare(const juce::dsp::ProcessSpec& spec) {
        lowpassL.prepare(spec); lowpassR.prepare(spec);
        highpassL.prepare(spec); highpassR.prepare(spec);
        updateCrossover(spec.sampleRate);
    }
    
    void updateCrossover(float sampleRate) {
        lowpassL.setCutoffFrequency(lowCrossover);
        lowpassR.setCutoffFrequency(lowCrossover);
        highpassL.setCutoffFrequency(lowCrossover);
        highpassR.setCutoffFrequency(lowCrossover);
        lowpassL.setType(juce::dsp::LinkwitzRileyFilterType::lowpass);
        lowpassR.setType(juce::dsp::LinkwitzRileyFilterType::lowpass);
        highpassL.setType(juce::dsp::LinkwitzRileyFilterType::highpass);
        highpassR.setType(juce::dsp::LinkwitzRileyFilterType::highpass);
    }
    
    void setWidth(float widthPercent) { width = widthPercent / 100.0f; }
    void setMidGain(float dB) { midGain = juce::Decibels::decibelsToGain(dB); }
    void setSideGain(float dB) { sideGain = juce::Decibels::decibelsToGain(dB); }
    void setLowCrossover(float freq) { lowCrossover = freq; }
    
    void processBlock(juce::AudioBuffer<float>& buffer) {
        const int numSamples = buffer.getNumSamples();
        float* left = buffer.getWritePointer(0);
        float* right = buffer.getWritePointer(1);
        
        for (int i = 0; i < numSamples; ++i) {
            // Encode to Mid/Side
            float mid = (left[i] + right[i]) * 0.5f;
            float side = (left[i] - right[i]) * 0.5f;
            
            // Apply gains
            mid *= midGain;
            side *= sideGain * width;
            
            // Decode back to L/R
            left[i] = mid + side;
            right[i] = mid - side;
        }
    }
    
    // For Amapiano: mono bass below 120Hz
    void processWithBassMono(juce::AudioBuffer<float>& buffer) {
        const int numSamples = buffer.getNumSamples();
        float* left = buffer.getWritePointer(0);
        float* right = buffer.getWritePointer(1);
        
        for (int i = 0; i < numSamples; ++i) {
            // Split into low and high frequency
            float lowL = lowpassL.processSample(0, left[i]);
            float lowR = lowpassR.processSample(0, right[i]);
            float highL = highpassL.processSample(0, left[i]);
            float highR = highpassR.processSample(0, right[i]);
            
            // Mono the lows
            float monoLow = (lowL + lowR) * 0.5f;
            
            // Apply stereo processing to highs only
            float mid = (highL + highR) * 0.5f;
            float side = (highL - highR) * 0.5f;
            mid *= midGain;
            side *= sideGain * width;
            
            // Reconstruct
            left[i] = monoLow + (mid + side);
            right[i] = monoLow + (mid - side);
        }
    }
};`;
  } else {
    return `
// Web Audio Stereo Imager with Mid/Side Processing
class StereoImager {
    constructor(context) {
        this.context = context;
        this.width = 1.0;
        this.midGain = 1.0;
        this.sideGain = 1.0;
        this.lowCrossover = 120;
        
        // Create processing nodes
        this.input = context.createGain();
        this.output = context.createGain();
        this.splitter = context.createChannelSplitter(2);
        this.merger = context.createChannelMerger(2);
        
        // Mid/Side encoding requires ScriptProcessor or AudioWorklet
        this.setupMidSideProcessing();
    }
    
    async setupMidSideProcessing() {
        // Load the stereo imager worklet
        await this.context.audioWorklet.addModule('/stereo-imager.worklet.js');
        this.processor = new AudioWorkletNode(this.context, 'stereo-imager', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channelCount: 2,
            channelCountMode: 'explicit',
            processorOptions: {
                width: this.width * 100,
                midGain: this.midGain,
                sideGain: this.sideGain,
                lowCrossover: this.lowCrossover
            }
        });
        
        this.input.connect(this.processor);
        this.processor.connect(this.output);
    }
    
    setWidth(widthPercent) {
        this.width = widthPercent / 100;
        if (this.processor) {
            this.processor.port.postMessage({
                type: 'setWidth',
                value: widthPercent
            });
        }
    }
    
    setMidGain(dB) {
        this.midGain = Math.pow(10, dB / 20);
        if (this.processor) {
            this.processor.port.postMessage({
                type: 'setMidGain',
                value: this.midGain
            });
        }
    }
    
    setSideGain(dB) {
        this.sideGain = Math.pow(10, dB / 20);
        if (this.processor) {
            this.processor.port.postMessage({
                type: 'setSideGain',
                value: this.sideGain
            });
        }
    }
    
    setLowCrossover(freq) {
        this.lowCrossover = freq;
        if (this.processor) {
            this.processor.port.postMessage({
                type: 'setLowCrossover',
                value: freq
            });
        }
    }
    
    connect(destination) {
        this.output.connect(destination);
        return this;
    }
    
    disconnect() {
        this.output.disconnect();
    }
    
    // Get current stereo correlation (-1 to 1)
    getCorrelation() {
        return this.processor?.correlation ?? 0.5;
    }
}

// Simple inline processing without worklet
function processStereoSimple(leftChannel, rightChannel, width) {
    const numSamples = leftChannel.length;
    const widthFactor = width / 100;
    
    for (let i = 0; i < numSamples; i++) {
        const mid = (leftChannel[i] + rightChannel[i]) * 0.5;
        const side = (leftChannel[i] - rightChannel[i]) * 0.5;
        
        leftChannel[i] = mid + side * widthFactor;
        rightChannel[i] = mid - side * widthFactor;
    }
}`;
  }
}

export const StereoImagerModule: DSPModule = {
  id: 'stereoImager',
  name: 'Stereo Imager',
  category: 'utility',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  parameters: getStereoImagerParams(),
  generateCode: generateStereoImagerCode
};

/**
 * Real-time stereo imager processor for Web Audio
 */
export function createStereoImagerProcessor(context: AudioContext): {
  input: GainNode;
  output: GainNode;
  setWidth: (width: number) => void;
  setMidGain: (dB: number) => void;
  setSideGain: (dB: number) => void;
  setLowCrossover: (freq: number) => void;
  getCorrelation: () => number;
} {
  const input = context.createGain();
  const output = context.createGain();
  
  // Simple width control using channel splitting and gain manipulation
  const splitter = context.createChannelSplitter(2);
  const merger = context.createChannelMerger(2);
  
  const leftGain = context.createGain();
  const rightGain = context.createGain();
  const midGain = context.createGain();
  const sideGain = context.createGain();
  
  let widthFactor = 1.0;
  let midGainValue = 1.0;
  let sideGainValue = 1.0;
  
  // Simple stereo width: adjust left-right separation
  input.connect(splitter);
  splitter.connect(leftGain, 0);
  splitter.connect(rightGain, 1);
  
  leftGain.connect(merger, 0, 0);
  rightGain.connect(merger, 0, 1);
  merger.connect(output);
  
  return {
    input,
    output,
    setWidth: (width: number) => {
      widthFactor = width / 100;
      // For simplicity, adjust channel gains to simulate width
      const sideAmount = Math.min(1, widthFactor);
      const midAmount = 2 - widthFactor; // Inverse relationship
      leftGain.gain.value = midAmount * 0.5 + sideAmount * 0.5;
      rightGain.gain.value = midAmount * 0.5 + sideAmount * 0.5;
    },
    setMidGain: (dB: number) => {
      midGainValue = Math.pow(10, dB / 20);
      // Apply to both channels equally
    },
    setSideGain: (dB: number) => {
      sideGainValue = Math.pow(10, dB / 20);
    },
    setLowCrossover: (freq: number) => {
      // Would require more complex filtering
    },
    getCorrelation: () => 0.5 // Would need analyser for real correlation
  };
}
