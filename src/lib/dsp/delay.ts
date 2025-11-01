import type { DSPParameter, DSPModule } from './types';

export function getDelayParams(): DSPParameter[] {
  return [
    {
      id: 'delayTime',
      label: 'Delay Time',
      type: 'float',
      default: 0.375,
      min: 0.0625,
      max: 2.0,
      unit: 'beats',
      affects: 'Delay',
      description: 'Dotted 8th note (3/16) default'
    },
    {
      id: 'feedback',
      label: 'Feedback',
      type: 'float',
      default: 0.4,
      min: 0,
      max: 0.95,
      unit: '%',
      affects: 'Delay'
    },
    {
      id: 'filterCutoff',
      label: 'Filter Cutoff',
      type: 'float',
      default: 3000,
      min: 200,
      max: 10000,
      unit: 'Hz',
      affects: 'Delay',
      description: 'Filter in feedback path'
    },
    {
      id: 'pingPong',
      label: 'Ping Pong',
      type: 'bool',
      default: true,
      affects: 'Delay'
    },
    {
      id: 'mix',
      label: 'Wet/Dry',
      type: 'float',
      default: 0.3,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Delay'
    }
  ];
}

export function generateDelayCode(framework: 'juce' | 'webaudio', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// Filtered ping-pong delay
juce::dsp::DelayLine<float> delayLineL { 96000 };
juce::dsp::DelayLine<float> delayLineR { 96000 };
juce::dsp::IIR::Filter<float> feedbackFilter;

void setupDelay() {
    auto cutoff = parameters.getRawParameterValue("filterCutoff")->load();
    *feedbackFilter.coefficients = *juce::dsp::IIR::Coefficients<float>::makeLowPass(
        getSampleRate(), cutoff, 0.7f
    );
}

void processDelay(juce::AudioBuffer<float>& buffer, float bpm) {
    auto delayBeats = parameters.getRawParameterValue("delayTime")->load();
    auto feedback = parameters.getRawParameterValue("feedback")->load();
    auto mix = parameters.getRawParameterValue("mix")->load();
    auto pingPong = parameters.getRawParameterValue("pingPong")->load() > 0.5f;
    
    // Convert beats to samples
    float samplesPerBeat = (60.0f / bpm) * getSampleRate();
    int delaySamples = static_cast<int>(delayBeats * samplesPerBeat);
    
    delayLineL.setDelay(delaySamples);
    delayLineR.setDelay(delaySamples);
    
    for (int i = 0; i < buffer.getNumSamples(); ++i) {
        float inputL = buffer.getSample(0, i);
        float inputR = buffer.getNumChannels() > 1 ? buffer.getSample(1, i) : inputL;
        
        // Read delayed samples
        float delayedL = delayLineL.popSample(0);
        float delayedR = delayLineR.popSample(0);
        
        // Apply filter to feedback
        float filteredL = feedbackFilter.processSample(delayedL);
        float filteredR = feedbackFilter.processSample(delayedR);
        
        // Ping pong: cross feedback
        if (pingPong) {
            delayLineL.pushSample(0, inputL + filteredR * feedback);
            delayLineR.pushSample(0, inputR + filteredL * feedback);
        } else {
            delayLineL.pushSample(0, inputL + filteredL * feedback);
            delayLineR.pushSample(0, inputR + filteredR * feedback);
        }
        
        // Mix wet and dry
        buffer.setSample(0, i, inputL * (1.0f - mix) + delayedL * mix);
        if (buffer.getNumChannels() > 1) {
            buffer.setSample(1, i, inputR * (1.0f - mix) + delayedR * mix);
        }
    }
}`;
  } else {
    return `
// Web Audio Ping-Pong Delay with filter
const delayL = context.createDelay(2.0);
const delayR = context.createDelay(2.0);
const feedbackL = context.createGain();
const feedbackR = context.createGain();
const filter = context.createBiquadFilter();
const wetGain = context.createGain();
const dryGain = context.createGain();

// Setup delay time (dotted 8th = 3/16 beats)
const bpm = 120;
const delayBeats = params.delayTime || 0.375;
const delayTime = (60 / bpm) * delayBeats;

delayL.delayTime.value = delayTime;
delayR.delayTime.value = delayTime;
feedbackL.gain.value = params.feedback || 0.4;
feedbackR.gain.value = params.feedback || 0.4;

// Feedback filter
filter.type = 'lowpass';
filter.frequency.value = params.filterCutoff || 3000;
filter.Q.value = 0.7;

// Ping-pong routing
delayL.connect(filter);
filter.connect(feedbackR);
feedbackR.connect(delayR);

delayR.connect(filter);
filter.connect(feedbackL);
feedbackL.connect(delayL);

// Mix
wetGain.gain.value = params.mix || 0.3;
dryGain.gain.value = 1 - (params.mix || 0.3);

source.connect(delayL);
source.connect(delayR);
delayL.connect(wetGain);
delayR.connect(wetGain);
source.connect(dryGain);`;
  }
}

export const DelayModule: DSPModule = {
  id: 'delay',
  name: 'Filtered Delay',
  category: 'time',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  parameters: getDelayParams(),
  generateCode: generateDelayCode
};
