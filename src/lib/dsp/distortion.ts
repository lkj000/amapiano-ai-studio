import type { DSPParameter, DSPModule } from './types';

export function getDistortionParams(): DSPParameter[] {
  return [
    {
      id: 'warmth',
      label: 'Warmth',
      type: 'float',
      default: 0.3,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Distortion',
      description: 'Subtle analog-style saturation'
    },
    {
      id: 'drive',
      label: 'Drive',
      type: 'float',
      default: 1.5,
      min: 1,
      max: 10,
      unit: 'x',
      affects: 'Distortion'
    },
    {
      id: 'mix',
      label: 'Wet/Dry',
      type: 'float',
      default: 0.4,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Distortion'
    }
  ];
}

export function generateDistortionCode(framework: 'juce' | 'webaudio', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// Analog-style waveshaping for warmth
class WarmthProcessor {
public:
    float processSample(float input, float drive, float amount) {
        // Soft clipping with even harmonics
        float driven = input * drive;
        float clipped = std::tanh(driven);
        
        // Add subtle even harmonics for warmth
        float evenHarmonics = 0.1f * driven * driven;
        
        return input * (1.0f - amount) + (clipped + evenHarmonics) * amount;
    }
};

void processWarmth(juce::AudioBuffer<float>& buffer) {
    auto warmth = parameters.getRawParameterValue("warmth")->load();
    auto drive = parameters.getRawParameterValue("drive")->load();
    auto mix = parameters.getRawParameterValue("mix")->load();
    
    WarmthProcessor processor;
    
    for (int ch = 0; ch < buffer.getNumChannels(); ++ch) {
        auto* channelData = buffer.getWritePointer(ch);
        for (int i = 0; i < buffer.getNumSamples(); ++i) {
            float input = channelData[i];
            float processed = processor.processSample(input, drive, warmth);
            channelData[i] = input * (1.0f - mix) + processed * mix;
        }
    }
}`;
  } else {
    return `
// Web Audio Waveshaper for analog warmth
const waveshaper = context.createWaveShaper();
const driveGain = context.createGain();
const wetGain = context.createGain();
const dryGain = context.createGain();

function makeWarmthCurve(amount, drive) {
    const samples = 65536;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        const driven = x * drive;
        
        // Soft clipping with even harmonics
        const clipped = Math.tanh(driven);
        const evenHarmonics = 0.1 * driven * driven;
        
        curve[i] = x * (1 - amount) + (clipped + evenHarmonics) * amount;
    }
    return curve;
}

const warmth = params.warmth || 0.3;
const drive = params.drive || 1.5;
waveshaper.curve = makeWarmthCurve(warmth, drive);
waveshaper.oversample = '4x';

// Mix
wetGain.gain.value = params.mix || 0.4;
dryGain.gain.value = 1 - (params.mix || 0.4);

source.connect(waveshaper);
waveshaper.connect(wetGain);
source.connect(dryGain);`;
  }
}

export const DistortionModule: DSPModule = {
  id: 'distortion',
  name: 'Analog Warmth',
  category: 'distortion',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  parameters: getDistortionParams(),
  generateCode: generateDistortionCode
};
