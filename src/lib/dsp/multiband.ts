/**
 * Phase 2: Advanced DSP - Multiband Processing
 */

import type { DSPParameter, DSPModule } from './types';

export function getMultibandParams(): DSPParameter[] {
  return [
    {
      id: 'lowMidCrossover',
      label: 'Low-Mid Crossover',
      type: 'float',
      default: 250,
      min: 20,
      max: 1000,
      unit: 'Hz',
      affects: 'Frequency Splitting',
      category: 'control',
      automatable: false,
      description: 'Crossover frequency between low and mid bands'
    },
    {
      id: 'midHighCrossover',
      label: 'Mid-High Crossover',
      type: 'float',
      default: 2500,
      min: 1000,
      max: 10000,
      unit: 'Hz',
      affects: 'Frequency Splitting',
      category: 'control',
      automatable: false,
      description: 'Crossover frequency between mid and high bands'
    },
    {
      id: 'lowThreshold',
      label: 'Low Band Threshold',
      type: 'float',
      default: -18,
      min: -60,
      max: 0,
      unit: 'dB',
      affects: 'Low Band Dynamics',
      category: 'control',
      automatable: true
    },
    {
      id: 'midThreshold',
      label: 'Mid Band Threshold',
      type: 'float',
      default: -12,
      min: -60,
      max: 0,
      unit: 'dB',
      affects: 'Mid Band Dynamics',
      category: 'control',
      automatable: true
    },
    {
      id: 'highThreshold',
      label: 'High Band Threshold',
      type: 'float',
      default: -15,
      min: -60,
      max: 0,
      unit: 'dB',
      affects: 'High Band Dynamics',
      category: 'control',
      automatable: true
    },
    {
      id: 'lowRatio',
      label: 'Low Band Ratio',
      type: 'float',
      default: 3,
      min: 1,
      max: 20,
      step: 0.1,
      unit: ':1',
      affects: 'Low Band Dynamics',
      category: 'control',
      automatable: false
    },
    {
      id: 'midRatio',
      label: 'Mid Band Ratio',
      type: 'float',
      default: 4,
      min: 1,
      max: 20,
      step: 0.1,
      unit: ':1',
      affects: 'Mid Band Dynamics',
      category: 'control',
      automatable: false
    },
    {
      id: 'highRatio',
      label: 'High Band Ratio',
      type: 'float',
      default: 2,
      min: 1,
      max: 20,
      step: 0.1,
      unit: ':1',
      affects: 'High Band Dynamics',
      category: 'control',
      automatable: false
    }
  ];
}

export function generateMultibandCode(framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// 3-band multiband compressor with Linkwitz-Riley crossovers
class MultibandCompressor {
private:
    juce::dsp::ProcessorChain<
        juce::dsp::LinkwitzRileyFilter<float>,  // Low-Mid crossover
        juce::dsp::LinkwitzRileyFilter<float>   // Mid-High crossover
    > crossovers;
    
    juce::dsp::Compressor<float> lowCompressor;
    juce::dsp::Compressor<float> midCompressor;
    juce::dsp::Compressor<float> highCompressor;
    
public:
    void prepare(const juce::dsp::ProcessSpec& spec) {
        crossovers.prepare(spec);
        lowCompressor.prepare(spec);
        midCompressor.prepare(spec);
        highCompressor.prepare(spec);
    }
    
    void setCrossovers(float lowMid, float midHigh, float sampleRate) {
        auto& lowMidFilter = crossovers.get<0>();
        auto& midHighFilter = crossovers.get<1>();
        
        lowMidFilter.setCutoffFrequency(lowMid);
        midHighFilter.setCutoffFrequency(midHigh);
    }
    
    void processBlock(juce::AudioBuffer<float>& buffer) {
        const int numSamples = buffer.getNumSamples();
        const int numChannels = buffer.getNumChannels();
        
        // Create band buffers
        juce::AudioBuffer<float> lowBand(numChannels, numSamples);
        juce::AudioBuffer<float> midBand(numChannels, numSamples);
        juce::AudioBuffer<float> highBand(numChannels, numSamples);
        
        // Split into bands using crossovers
        splitBands(buffer, lowBand, midBand, highBand);
        
        // Process each band independently
        juce::dsp::AudioBlock<float> lowBlock(lowBand);
        lowCompressor.process(juce::dsp::ProcessContextReplacing<float>(lowBlock));
        
        juce::dsp::AudioBlock<float> midBlock(midBand);
        midCompressor.process(juce::dsp::ProcessContextReplacing<float>(midBlock));
        
        juce::dsp::AudioBlock<float> highBlock(highBand);
        highCompressor.process(juce::dsp::ProcessContextReplacing<float>(highBlock));
        
        // Recombine bands
        for (int ch = 0; ch < numChannels; ++ch) {
            for (int i = 0; i < numSamples; ++i) {
                buffer.setSample(ch, i, 
                    lowBand.getSample(ch, i) + 
                    midBand.getSample(ch, i) + 
                    highBand.getSample(ch, i)
                );
            }
        }
    }
    
private:
    void splitBands(const juce::AudioBuffer<float>& input,
                   juce::AudioBuffer<float>& low,
                   juce::AudioBuffer<float>& mid,
                   juce::AudioBuffer<float>& high) {
        // Linkwitz-Riley crossover implementation
        // Low band: lowpass at lowMidCrossover
        // Mid band: highpass at lowMidCrossover, lowpass at midHighCrossover  
        // High band: highpass at midHighCrossover
    }
};`;
  } else if (framework === 'webaudio') {
    return `
// Web Audio multiband compressor
class MultibandCompressor {
    constructor(context, lowMidCrossover = 250, midHighCrossover = 2500) {
        this.context = context;
        
        // Create band filters (Linkwitz-Riley 4th order)
        this.lowFilter = context.createBiquadFilter();
        this.lowFilter.type = 'lowpass';
        this.lowFilter.frequency.value = lowMidCrossover;
        this.lowFilter.Q.value = 0.707; // Butterworth
        
        this.midLowFilter = context.createBiquadFilter();
        this.midLowFilter.type = 'highpass';
        this.midLowFilter.frequency.value = lowMidCrossover;
        this.midLowFilter.Q.value = 0.707;
        
        this.midHighFilter = context.createBiquadFilter();
        this.midHighFilter.type = 'lowpass';
        this.midHighFilter.frequency.value = midHighCrossover;
        this.midHighFilter.Q.value = 0.707;
        
        this.highFilter = context.createBiquadFilter();
        this.highFilter.type = 'highpass';
        this.highFilter.frequency.value = midHighCrossover;
        this.highFilter.Q.value = 0.707;
        
        // Create compressors for each band
        this.lowCompressor = context.createDynamicsCompressor();
        this.midCompressor = context.createDynamicsCompressor();
        this.highCompressor = context.createDynamicsCompressor();
        
        // Create splitter and merger
        this.splitter = context.createChannelSplitter(2);
        this.merger = context.createChannelMerger(2);
        
        this.output = context.createGain();
        
        this.setupRouting();
    }
    
    setupRouting() {
        // Low band path
        this.splitter.connect(this.lowFilter);
        this.lowFilter.connect(this.lowCompressor);
        this.lowCompressor.connect(this.merger, 0, 0);
        
        // Mid band path
        this.splitter.connect(this.midLowFilter);
        this.midLowFilter.connect(this.midHighFilter);
        this.midHighFilter.connect(this.midCompressor);
        this.midCompressor.connect(this.merger, 0, 1);
        
        // High band path
        this.splitter.connect(this.highFilter);
        this.highFilter.connect(this.highCompressor);
        this.highCompressor.connect(this.output);
        
        this.merger.connect(this.output);
    }
    
    setCompression(band, threshold, ratio, attack, release) {
        const compressor = band === 'low' ? this.lowCompressor :
                          band === 'mid' ? this.midCompressor :
                          this.highCompressor;
        
        compressor.threshold.value = threshold;
        compressor.ratio.value = ratio;
        compressor.attack.value = attack / 1000;
        compressor.release.value = release / 1000;
    }
    
    connect(destination) {
        this.output.connect(destination);
    }
}`;
  } else {
    return `// WASM multiband compressor bindings would go here`;
  }
}

export const MultibandModule: DSPModule = {
  id: 'multiband',
  name: 'Multiband Compressor',
  category: 'dynamics',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  parameters: getMultibandParams(),
  generateCode: generateMultibandCode
};
