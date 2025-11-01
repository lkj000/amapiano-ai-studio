import type { DSPParameter, DSPModule } from './types';

export function getReverbParams(): DSPParameter[] {
  return [
    {
      id: 'reverbSize',
      label: 'Space Size',
      type: 'float',
      default: 0.6,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Reverb',
      description: 'Room size for spatial depth'
    },
    {
      id: 'damping',
      label: 'Damping',
      type: 'float',
      default: 0.5,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Reverb'
    },
    {
      id: 'width',
      label: 'Stereo Width',
      type: 'float',
      default: 0.8,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Reverb'
    },
    {
      id: 'mix',
      label: 'Wet/Dry',
      type: 'float',
      default: 0.25,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Reverb'
    }
  ];
}

export function generateReverbCode(framework: 'juce' | 'webaudio', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// Amapiano-style reverb with ducking
juce::dsp::Reverb reverb;
juce::dsp::DryWetMixer<float> reverbMixer;

void setupReverb() {
    juce::dsp::Reverb::Parameters reverbParams;
    reverbParams.roomSize = parameters.getRawParameterValue("reverbSize")->load();
    reverbParams.damping = parameters.getRawParameterValue("damping")->load();
    reverbParams.width = parameters.getRawParameterValue("width")->load();
    reverbParams.wetLevel = 1.0f;
    reverbParams.dryLevel = 0.0f;
    reverb.setParameters(reverbParams);
}

void processReverb(juce::AudioBuffer<float>& buffer) {
    auto mix = parameters.getRawParameterValue("mix")->load();
    
    reverbMixer.setWetMixProportion(mix);
    reverbMixer.pushDrySamples(juce::dsp::AudioBlock<float>(buffer));
    
    juce::dsp::AudioBlock<float> block(buffer);
    reverb.process(juce::dsp::ProcessContextReplacing<float>(block));
    
    reverbMixer.mixWetSamples(block);
}`;
  } else {
    return `
// Web Audio Convolver Reverb
const convolver = context.createConvolver();
const reverbGain = context.createGain();
const dryGain = context.createGain();

// Create impulse response for Amapiano-style space
function createImpulseResponse(duration, decay, context) {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const impulse = context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
    }
    return impulse;
}

const reverbSize = params.reverbSize || 0.6;
const damping = params.damping || 0.5;
convolver.buffer = createImpulseResponse(reverbSize * 3, 2 + damping * 3, context);

// Wet/Dry mix
reverbGain.gain.value = params.mix || 0.25;
dryGain.gain.value = 1 - (params.mix || 0.25);

source.connect(convolver);
convolver.connect(reverbGain);
source.connect(dryGain);`;
  }
}

export const ReverbModule: DSPModule = {
  id: 'reverb',
  name: 'Spatial Reverb',
  category: 'time',
  parameters: getReverbParams(),
  generateCode: generateReverbCode
};
