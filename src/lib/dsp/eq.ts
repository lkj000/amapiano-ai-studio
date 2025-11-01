import type { DSPParameter, DSPModule } from './types';

export function getEQParams(): DSPParameter[] {
  return [
    {
      id: 'lowBoost',
      label: 'Low-End Boost',
      type: 'float',
      default: 0.5,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'EQ',
      description: 'Boost 40-60Hz for Amapiano sub bass'
    },
    {
      id: 'lowFreq',
      label: 'Low Frequency',
      type: 'float',
      default: 50,
      min: 20,
      max: 200,
      unit: 'Hz',
      affects: 'EQ'
    },
    {
      id: 'midCut',
      label: 'Mid Cut',
      type: 'float',
      default: 0.3,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'EQ',
      description: 'Cut muddy mids around 300Hz'
    },
    {
      id: 'percBoost',
      label: 'Percussion Enhance',
      type: 'float',
      default: 0.4,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'EQ',
      description: 'Boost 800-2kHz for log drums'
    },
    {
      id: 'highShelf',
      label: 'High Shelf',
      type: 'float',
      default: 0.2,
      min: -1,
      max: 1,
      unit: 'dB',
      affects: 'EQ'
    }
  ];
}

export function generateEQCode(framework: 'juce' | 'webaudio', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// Amapiano-style EQ with genre-specific shaping
juce::dsp::ProcessorChain<
    juce::dsp::IIR::Filter<float>,  // Low shelf
    juce::dsp::IIR::Filter<float>,  // Mid cut
    juce::dsp::IIR::Filter<float>,  // Percussion boost
    juce::dsp::IIR::Filter<float>   // High shelf
> eqChain;

void processEQ(juce::AudioBuffer<float>& buffer) {
    auto lowBoost = parameters.getRawParameterValue("lowBoost")->load();
    auto midCut = parameters.getRawParameterValue("midCut")->load();
    auto percBoost = parameters.getRawParameterValue("percBoost")->load();
    auto highShelf = parameters.getRawParameterValue("highShelf")->load();
    
    // Low shelf at 50Hz for sub bass
    auto& lowFilter = eqChain.get<0>();
    *lowFilter.coefficients = *juce::dsp::IIR::Coefficients<float>::makeLowShelf(
        getSampleRate(), 50.0f, 0.7f, juce::Decibels::decibelsToGain(lowBoost * 12.0f)
    );
    
    // Mid cut at 300Hz for clarity
    auto& midFilter = eqChain.get<1>();
    *midFilter.coefficients = *juce::dsp::IIR::Coefficients<float>::makePeakFilter(
        getSampleRate(), 300.0f, 1.2f, juce::Decibels::decibelsToGain(-midCut * 6.0f)
    );
    
    // Percussion boost at 1.5kHz
    auto& percFilter = eqChain.get<2>();
    *percFilter.coefficients = *juce::dsp::IIR::Coefficients<float>::makePeakFilter(
        getSampleRate(), 1500.0f, 1.0f, juce::Decibels::decibelsToGain(percBoost * 8.0f)
    );
    
    // High shelf at 8kHz
    auto& highFilter = eqChain.get<3>();
    *highFilter.coefficients = *juce::dsp::IIR::Coefficients<float>::makeHighShelf(
        getSampleRate(), 8000.0f, 0.7f, juce::Decibels::decibelsToGain(highShelf * 6.0f)
    );
    
    juce::dsp::AudioBlock<float> block(buffer);
    eqChain.process(juce::dsp::ProcessContextReplacing<float>(block));
}`;
  } else {
    return `
// Web Audio API EQ Chain
const lowShelf = context.createBiquadFilter();
lowShelf.type = 'lowshelf';
lowShelf.frequency.value = 50;
lowShelf.gain.value = params.lowBoost * 12;

const midCut = context.createBiquadFilter();
midCut.type = 'peaking';
midCut.frequency.value = 300;
midCut.Q.value = 1.2;
midCut.gain.value = -params.midCut * 6;

const percBoost = context.createBiquadFilter();
percBoost.type = 'peaking';
percBoost.frequency.value = 1500;
percBoost.Q.value = 1.0;
percBoost.gain.value = params.percBoost * 8;

const highShelf = context.createBiquadFilter();
highShelf.type = 'highshelf';
highShelf.frequency.value = 8000;
highShelf.gain.value = params.highShelf * 6;

// Connect chain
source.connect(lowShelf)
      .connect(midCut)
      .connect(percBoost)
      .connect(highShelf)
      .connect(destination);`;
  }
}

export const EQModule: DSPModule = {
  id: 'eq',
  name: 'Amapiano EQ',
  category: 'eq',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  parameters: getEQParams(),
  generateCode: generateEQCode
};
