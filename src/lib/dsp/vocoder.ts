// Vocoder DSP Module - Phase 2
import type { DSPModule, DSPParameter } from './types';

export const VocoderModule: DSPModule = {
  id: 'vocoder',
  name: 'Vocoder',
  category: 'modulation',
  version: '1.0.0',
  inputs: 4, // 2 for carrier, 2 for modulator
  outputs: 2,
  latency: 512,
  
  parameters: [
    {
      id: 'bands',
      label: 'Bands',
      type: 'int',
      default: 16,
      min: 8,
      max: 32,
      step: 1,
      unit: '',
      affects: 'Frequency resolution',
      description: 'Number of frequency bands',
      category: 'control',
      automatable: false
    },
    {
      id: 'formantShift',
      label: 'Formant Shift',
      type: 'float',
      default: 0,
      min: -12,
      max: 12,
      step: 0.1,
      unit: 'semitones',
      affects: 'Pitch shift',
      description: 'Formant frequency shift',
      category: 'control',
      automatable: true
    },
    {
      id: 'attack',
      label: 'Attack',
      type: 'float',
      default: 5.0,
      min: 0.1,
      max: 100.0,
      step: 0.1,
      unit: 'ms',
      affects: 'Envelope follower',
      description: 'Envelope attack time',
      category: 'control',
      automatable: false
    },
    {
      id: 'release',
      label: 'Release',
      type: 'float',
      default: 50.0,
      min: 1.0,
      max: 500.0,
      step: 1.0,
      unit: 'ms',
      affects: 'Envelope follower',
      description: 'Envelope release time',
      category: 'control',
      automatable: false
    },
    {
      id: 'mix',
      label: 'Mix',
      type: 'float',
      default: 100,
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
// Vocoder Effect
class Vocoder {
private:
    struct Band {
        juce::IIRFilter analyzerFilter;
        juce::IIRFilter synthFilter;
        float envelope = 0.0f;
    };

    std::vector<Band> bands;
    float sampleRate = 44100.0f;
    int numBands = 16;
    float attack = 5.0f;
    float release = 50.0f;
    float formantShift = 0.0f;

    float attackCoeff = 0.0f;
    float releaseCoeff = 0.0f;

public:
    void prepare(double sr, int numChannels) {
        sampleRate = static_cast<float>(sr);
        bands.resize(numBands);
        
        // Calculate filter coefficients for each band
        float minFreq = 80.0f;
        float maxFreq = 8000.0f;
        
        for (int i = 0; i < numBands; ++i) {
            // Logarithmic spacing
            float ratio = static_cast<float>(i) / (numBands - 1);
            float freq = minFreq * std::pow(maxFreq / minFreq, ratio);
            float bandwidth = freq * 0.2f; // 20% bandwidth
            
            // Create bandpass filters
            auto coeffs = juce::IIRCoefficients::makeBandPass(sr, freq, bandwidth / freq);
            bands[i].analyzerFilter.setCoefficients(coeffs);
            
            // Shifted frequency for carrier
            float shiftedFreq = freq * std::pow(2.0f, formantShift / 12.0f);
            auto synthCoeffs = juce::IIRCoefficients::makeBandPass(sr, shiftedFreq, bandwidth / shiftedFreq);
            bands[i].synthFilter.setCoefficients(synthCoeffs);
        }
        
        // Envelope follower coefficients
        attackCoeff = std::exp(-1.0f / (attack * 0.001f * sampleRate));
        releaseCoeff = std::exp(-1.0f / (release * 0.001f * sampleRate));
    }

    void process(const float* modulator, const float* carrier, float* output, int numSamples) {
        for (int i = 0; i < numSamples; ++i) {
            float sum = 0.0f;
            
            for (auto& band : bands) {
                // Analyze modulator
                float modulatorBand = band.analyzerFilter.processSingleSampleRaw(modulator[i]);
                float modulatorEnv = std::abs(modulatorBand);
                
                // Envelope follower
                if (modulatorEnv > band.envelope) {
                    band.envelope = modulatorEnv + attackCoeff * (band.envelope - modulatorEnv);
                } else {
                    band.envelope = modulatorEnv + releaseCoeff * (band.envelope - modulatorEnv);
                }
                
                // Filter carrier and apply envelope
                float carrierBand = band.synthFilter.processSingleSampleRaw(carrier[i]);
                sum += carrierBand * band.envelope;
            }
            
            output[i] = sum;
        }
    }
};`;
    } else if (framework === 'webaudio') {
      return `
// Web Audio Vocoder (simplified)
const createVocoder = (context, numBands = 16) => {
  const modulatorInput = context.createGain();
  const carrierInput = context.createGain();
  const output = context.createGain();
  
  const bands = [];
  const minFreq = 80;
  const maxFreq = 8000;
  
  for (let i = 0; i < numBands; i++) {
    const ratio = i / (numBands - 1);
    const freq = minFreq * Math.pow(maxFreq / minFreq, ratio);
    const bandwidth = freq * 0.2;
    
    // Modulator analysis
    const modFilter = context.createBiquadFilter();
    modFilter.type = 'bandpass';
    modFilter.frequency.value = freq;
    modFilter.Q.value = freq / bandwidth;
    
    // Carrier synthesis
    const carrierFilter = context.createBiquadFilter();
    carrierFilter.type = 'bandpass';
    carrierFilter.frequency.value = freq;
    carrierFilter.Q.value = freq / bandwidth;
    
    // Envelope follower (simplified with gain)
    const envelope = context.createGain();
    envelope.gain.value = 0;
    
    // Connect
    modulatorInput.connect(modFilter);
    carrierInput.connect(carrierFilter);
    carrierFilter.connect(envelope);
    envelope.connect(output);
    
    bands.push({ modFilter, carrierFilter, envelope });
  }
  
  return { 
    modulatorInput, 
    carrierInput, 
    output, 
    bands 
  };
};`;
    }
    return '';
  },

  validateParameters: (params: Record<string, any>) => {
    if (params.bands < 8 || params.bands > 32) return false;
    if (params.formantShift < -12 || params.formantShift > 12) return false;
    if (params.attack < 0.1 || params.attack > 100) return false;
    if (params.release < 1 || params.release > 500) return false;
    return true;
  }
};
