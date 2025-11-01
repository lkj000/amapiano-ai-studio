import type { DSPParameter, DSPModule } from './types';

export function getCompressorParams(): DSPParameter[] {
  return [
    {
      id: 'pumpIntensity',
      label: 'Pump Intensity',
      type: 'float',
      default: 0.62,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Compressor',
      description: 'Controls pumping effect strength (ratio + attack/release)'
    },
    {
      id: 'threshold',
      label: 'Threshold',
      type: 'float',
      default: -20,
      min: -60,
      max: 0,
      unit: 'dB',
      affects: 'Compressor'
    },
    {
      id: 'sidechain',
      label: 'Sidechain',
      type: 'bool',
      default: true,
      affects: 'Compressor',
      description: 'Enable sidechain-style pumping'
    },
    {
      id: 'makeup',
      label: 'Makeup Gain',
      type: 'float',
      default: 0.5,
      min: 0,
      max: 1,
      unit: 'dB',
      affects: 'Compressor'
    }
  ];
}

export function generateCompressorCode(framework: 'juce' | 'webaudio', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// Amapiano-style pumping compressor
juce::dsp::Compressor<float> compressor;

void setupCompressor() {
    auto pumpIntensity = parameters.getRawParameterValue("pumpIntensity")->load();
    
    // Map pump intensity to ratio and timing
    float ratio = 2.0f + (pumpIntensity * 8.0f);  // 2:1 to 10:1
    float attack = 5.0f + (pumpIntensity * 15.0f);  // 5-20ms
    float release = 80.0f + (pumpIntensity * 170.0f);  // 80-250ms
    
    compressor.setThreshold(parameters.getRawParameterValue("threshold")->load());
    compressor.setRatio(ratio);
    compressor.setAttack(attack);
    compressor.setRelease(release);
}

void processCompressor(juce::AudioBuffer<float>& buffer) {
    auto pumpIntensity = parameters.getRawParameterValue("pumpIntensity")->load();
    auto makeup = parameters.getRawParameterValue("makeup")->load();
    
    // Dynamic ratio based on pump intensity
    float ratio = 2.0f + (pumpIntensity * 8.0f);
    compressor.setRatio(ratio);
    
    juce::dsp::AudioBlock<float> block(buffer);
    compressor.process(juce::dsp::ProcessContextReplacing<float>(block));
    
    // Apply makeup gain
    buffer.applyGain(juce::Decibels::decibelsToGain(makeup * 12.0f));
}`;
  } else {
    return `
// Web Audio Dynamics Compressor with Amapiano pump
const compressor = context.createDynamicsCompressor();

function setupCompressor(params) {
    const pumpIntensity = params.pumpIntensity;
    
    // Map pump to ratio and timing
    compressor.ratio.value = 2 + (pumpIntensity * 8);  // 2:1 to 10:1
    compressor.attack.value = (5 + pumpIntensity * 15) / 1000;  // 5-20ms
    compressor.release.value = (80 + pumpIntensity * 170) / 1000;  // 80-250ms
    compressor.threshold.value = params.threshold;
    compressor.knee.value = 5;
}

// Sidechain-style envelope follower
const sidechainOsc = context.createOscillator();
sidechainOsc.frequency.value = 120 / 60;  // 120 BPM in Hz
const sidechainGain = context.createGain();
sidechainGain.gain.value = params.pumpIntensity * 0.5;

sidechainOsc.connect(sidechainGain);
sidechainGain.connect(compressor);`;
  }
}

export const CompressorModule: DSPModule = {
  id: 'compressor',
  name: 'Pumping Compressor',
  category: 'dynamics',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  parameters: getCompressorParams(),
  generateCode: generateCompressorCode
};
