import type { DSPParameter, DSPModule } from './types';

export function getGateParams(): DSPParameter[] {
  return [
    {
      id: 'gatePattern',
      label: 'Gate Pattern',
      type: 'enum',
      default: 'logDrumPulse',
      affects: 'Gate',
      description: 'Rhythmic gating pattern'
    },
    {
      id: 'gateDepth',
      label: 'Gate Depth',
      type: 'float',
      default: 0.7,
      min: 0,
      max: 1,
      unit: '%',
      affects: 'Gate'
    },
    {
      id: 'swing',
      label: 'Swing',
      type: 'float',
      default: 0.62,
      min: 0.5,
      max: 0.75,
      unit: '%',
      affects: 'Gate',
      description: 'Amapiano groove swing (default 62%)'
    },
    {
      id: 'bpmSync',
      label: 'BPM Sync',
      type: 'bool',
      default: true,
      affects: 'Gate'
    }
  ];
}

export function generateGateCode(framework: 'juce' | 'webaudio', params: DSPParameter[]): string {
  if (framework === 'juce') {
    return `
// Rhythmic gate with swing and patterns
class RhythmicGate {
public:
    enum Pattern {
        LogDrumPulse,      // ■□■■ ■□■■
        SyncopatedChop,    // ■□□■ □■□■
        HouseGroove,       // ■■□■ ■■□■
        BrokenBeat         // ■□■□ □■■□
    };
    
    void setPattern(Pattern p) { currentPattern = p; }
    void setSwing(float amount) { swing = juce::jlimit(0.5f, 0.75f, amount); }
    void setBPM(float bpm) { tempo = bpm; }
    
    void processGate(juce::AudioBuffer<float>& buffer) {
        auto gateDepth = parameters.getRawParameterValue("gateDepth")->load();
        auto swingAmount = parameters.getRawParameterValue("swing")->load();
        
        const int numSamples = buffer.getNumSamples();
        const float samplesPerBeat = (60.0f / tempo) * getSampleRate();
        const float sixteenthNote = samplesPerBeat / 4.0f;
        
        for (int i = 0; i < numSamples; ++i) {
            float phase = std::fmod(phaseAccumulator, sixteenthNote * 16.0f);
            int step = static_cast<int>(phase / sixteenthNote);
            
            // Apply swing to odd steps
            if (step % 2 == 1) {
                phase += sixteenthNote * (swingAmount - 0.5f) * 2.0f;
            }
            
            bool gateOpen = getPatternValue(currentPattern, step % 16);
            float gateGain = gateOpen ? 1.0f : (1.0f - gateDepth);
            
            for (int ch = 0; ch < buffer.getNumChannels(); ++ch) {
                buffer.setSample(ch, i, buffer.getSample(ch, i) * gateGain);
            }
            
            phaseAccumulator += 1.0f;
        }
    }
    
private:
    bool getPatternValue(Pattern p, int step) {
        static const bool patterns[][16] = {
            {1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1},  // Log Drum Pulse
            {1,0,0,1, 0,1,0,1, 1,0,0,1, 0,1,0,1},  // Syncopated Chop
            {1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1},  // House Groove
            {1,0,1,0, 0,1,1,0, 1,0,1,0, 0,1,1,0}   // Broken Beat
        };
        return patterns[p][step];
    }
    
    Pattern currentPattern = LogDrumPulse;
    float swing = 0.62f;
    float tempo = 120.0f;
    float phaseAccumulator = 0.0f;
};`;
  } else {
    return `
// Web Audio Rhythmic Gate
class RhythmicGate {
    constructor(context, bpm = 120) {
        this.context = context;
        this.bpm = bpm;
        this.patterns = {
            logDrumPulse: [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1],
            syncopatedChop: [1,0,0,1, 0,1,0,1, 1,0,0,1, 0,1,0,1],
            houseGroove: [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1],
            brokenBeat: [1,0,1,0, 0,1,1,0, 1,0,1,0, 0,1,1,0]
        };
        this.currentPattern = 'logDrumPulse';
        this.swing = 0.62;
        this.gateDepth = 0.7;
    }
    
    createGateNode() {
        const gain = this.context.createGain();
        const sixteenthNote = (60 / this.bpm) / 4;
        let step = 0;
        
        const scheduleGate = (time) => {
            const pattern = this.patterns[this.currentPattern];
            const isOpen = pattern[step % 16];
            
            // Apply swing to odd steps
            let duration = sixteenthNote;
            if (step % 2 === 1) {
                duration *= (1 + (this.swing - 0.5) * 0.5);
            }
            
            const gateValue = isOpen ? 1.0 : (1.0 - this.gateDepth);
            gain.gain.setValueAtTime(gateValue, time);
            
            step++;
            setTimeout(() => scheduleGate(this.context.currentTime + duration), duration * 1000);
        };
        
        scheduleGate(this.context.currentTime);
        return gain;
    }
}`;
  }
}

export const GateModule: DSPModule = {
  id: 'gate',
  name: 'Rhythmic Gate',
  category: 'dynamics',
  version: '1.0.0',
  inputs: 2,
  outputs: 2,
  latency: 0,
  parameters: getGateParams(),
  generateCode: generateGateCode
};
