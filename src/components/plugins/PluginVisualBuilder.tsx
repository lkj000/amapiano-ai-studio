import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid3x3, Plus, Trash2, Zap, Volume2, Sliders as SlidersIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { InteractiveKnob } from './InteractiveKnob';
import { Oscilloscope } from './Oscilloscope';
import { MasterOutput } from './MasterOutput';
import type { PluginProject, PluginParameterDef } from './PluginDevelopmentIDE';

interface PluginVisualBuilderProps {
  project: PluginProject;
  onChange: (project: PluginProject) => void;
  wasmEnabled: boolean;
}

export const PluginVisualBuilder: React.FC<PluginVisualBuilderProps> = ({
  project,
  onChange,
  wasmEnabled
}) => {
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [parameterValues, setParameterValues] = useState<Record<string, number>>({});

  const audioModules = [
    { id: 'oscillator', name: 'Oscillator', icon: Volume2, color: 'bg-blue-500' },
    { id: 'filter', name: 'Filter', icon: SlidersIcon, color: 'bg-purple-500' },
    { id: 'envelope', name: 'Envelope', icon: Grid3x3, color: 'bg-green-500' },
    { id: 'lfo', name: 'LFO', icon: Grid3x3, color: 'bg-orange-500' },
    { id: 'gain', name: 'Gain', icon: Volume2, color: 'bg-red-500' },
    { id: 'delay', name: 'Delay', icon: Grid3x3, color: 'bg-cyan-500' },
    { id: 'reverb', name: 'Reverb', icon: Volume2, color: 'bg-teal-500' },
    { id: 'compressor', name: 'Compressor', icon: SlidersIcon, color: 'bg-pink-500' },
    { id: 'distortion', name: 'Distortion', icon: Grid3x3, color: 'bg-red-600' },
    { id: 'chorus', name: 'Chorus', icon: Volume2, color: 'bg-indigo-500' },
    { id: 'phaser', name: 'Phaser', icon: Grid3x3, color: 'bg-violet-500' },
    { id: 'flanger', name: 'Flanger', icon: Volume2, color: 'bg-fuchsia-500' },
    { id: 'eq', name: 'EQ', icon: SlidersIcon, color: 'bg-amber-500' },
    { id: 'limiter', name: 'Limiter', icon: Volume2, color: 'bg-rose-500' },
    { id: 'gate', name: 'Gate', icon: Grid3x3, color: 'bg-lime-500' },
    { id: 'vocoder', name: 'Vocoder', icon: Volume2, color: 'bg-sky-500' },
    { id: 'sampler', name: 'Sampler', icon: Grid3x3, color: 'bg-emerald-500' },
    { id: 'arpeggiator', name: 'Arpeggiator', icon: Grid3x3, color: 'bg-yellow-500' },
    { id: 'waveshaper', name: 'Waveshaper', icon: Volume2, color: 'bg-orange-600' },
    { id: 'ring-mod', name: 'Ring Mod', icon: Grid3x3, color: 'bg-purple-600' },
  ];

  // Define parameters for each module type
  const getModuleParameters = (moduleId: string): PluginParameterDef[] => {
    const timestamp = Date.now();
    const paramMap: Record<string, PluginParameterDef[]> = {
      oscillator: [
        { id: `freq_${timestamp}`, name: 'Frequency', type: 'float', defaultValue: 440, min: 20, max: 20000, unit: 'Hz' },
        { id: `wave_${timestamp}`, name: 'Waveform', type: 'enum', defaultValue: 0, min: 0, max: 3, unit: '' },
        { id: `detune_${timestamp}`, name: 'Detune', type: 'float', defaultValue: 0, min: -100, max: 100, unit: 'cents' },
      ],
      filter: [
        { id: `cutoff_${timestamp}`, name: 'Cutoff', type: 'float', defaultValue: 1000, min: 20, max: 20000, unit: 'Hz' },
        { id: `resonance_${timestamp}`, name: 'Resonance', type: 'float', defaultValue: 1, min: 0.1, max: 30, unit: 'Q' },
        { id: `type_${timestamp}`, name: 'Filter Type', type: 'enum', defaultValue: 0, min: 0, max: 3, unit: '' },
      ],
      envelope: [
        { id: `attack_${timestamp}`, name: 'Attack', type: 'float', defaultValue: 0.01, min: 0.001, max: 2, unit: 's' },
        { id: `decay_${timestamp}`, name: 'Decay', type: 'float', defaultValue: 0.1, min: 0.001, max: 2, unit: 's' },
        { id: `sustain_${timestamp}`, name: 'Sustain', type: 'float', defaultValue: 0.7, min: 0, max: 1, unit: '' },
        { id: `release_${timestamp}`, name: 'Release', type: 'float', defaultValue: 0.5, min: 0.001, max: 5, unit: 's' },
      ],
      lfo: [
        { id: `rate_${timestamp}`, name: 'Rate', type: 'float', defaultValue: 2, min: 0.01, max: 20, unit: 'Hz' },
        { id: `depth_${timestamp}`, name: 'Depth', type: 'float', defaultValue: 0.5, min: 0, max: 1, unit: '' },
        { id: `wave_${timestamp}`, name: 'Waveform', type: 'enum', defaultValue: 0, min: 0, max: 3, unit: '' },
      ],
      gain: [
        { id: `gain_${timestamp}`, name: 'Gain', type: 'float', defaultValue: 1, min: 0, max: 2, unit: '' },
        { id: `pan_${timestamp}`, name: 'Pan', type: 'float', defaultValue: 0, min: -1, max: 1, unit: '' },
      ],
      delay: [
        { id: `time_${timestamp}`, name: 'Delay Time', type: 'float', defaultValue: 0.25, min: 0.001, max: 2, unit: 's' },
        { id: `feedback_${timestamp}`, name: 'Feedback', type: 'float', defaultValue: 0.3, min: 0, max: 0.95, unit: '' },
        { id: `mix_${timestamp}`, name: 'Wet/Dry', type: 'float', defaultValue: 0.3, min: 0, max: 1, unit: '' },
      ],
      reverb: [
        { id: `roomsize_${timestamp}`, name: 'Room Size', type: 'float', defaultValue: 0.5, min: 0, max: 1, unit: '' },
        { id: `damping_${timestamp}`, name: 'Damping', type: 'float', defaultValue: 0.5, min: 0, max: 1, unit: '' },
        { id: `mix_${timestamp}`, name: 'Wet/Dry', type: 'float', defaultValue: 0.3, min: 0, max: 1, unit: '' },
      ],
      compressor: [
        { id: `threshold_${timestamp}`, name: 'Threshold', type: 'float', defaultValue: -24, min: -60, max: 0, unit: 'dB' },
        { id: `ratio_${timestamp}`, name: 'Ratio', type: 'float', defaultValue: 4, min: 1, max: 20, unit: ':1' },
        { id: `attack_${timestamp}`, name: 'Attack', type: 'float', defaultValue: 0.003, min: 0.0001, max: 1, unit: 's' },
        { id: `release_${timestamp}`, name: 'Release', type: 'float', defaultValue: 0.25, min: 0.01, max: 3, unit: 's' },
      ],
      distortion: [
        { id: `drive_${timestamp}`, name: 'Drive', type: 'float', defaultValue: 10, min: 0, max: 100, unit: 'dB' },
        { id: `tone_${timestamp}`, name: 'Tone', type: 'float', defaultValue: 3000, min: 100, max: 10000, unit: 'Hz' },
        { id: `mix_${timestamp}`, name: 'Wet/Dry', type: 'float', defaultValue: 1, min: 0, max: 1, unit: '' },
      ],
      chorus: [
        { id: `rate_${timestamp}`, name: 'Rate', type: 'float', defaultValue: 1.5, min: 0.1, max: 10, unit: 'Hz' },
        { id: `depth_${timestamp}`, name: 'Depth', type: 'float', defaultValue: 0.5, min: 0, max: 1, unit: '' },
        { id: `mix_${timestamp}`, name: 'Wet/Dry', type: 'float', defaultValue: 0.5, min: 0, max: 1, unit: '' },
      ],
      phaser: [
        { id: `rate_${timestamp}`, name: 'Rate', type: 'float', defaultValue: 0.5, min: 0.01, max: 10, unit: 'Hz' },
        { id: `depth_${timestamp}`, name: 'Depth', type: 'float', defaultValue: 0.7, min: 0, max: 1, unit: '' },
        { id: `feedback_${timestamp}`, name: 'Feedback', type: 'float', defaultValue: 0.3, min: 0, max: 0.95, unit: '' },
      ],
      flanger: [
        { id: `rate_${timestamp}`, name: 'Rate', type: 'float', defaultValue: 0.3, min: 0.01, max: 10, unit: 'Hz' },
        { id: `depth_${timestamp}`, name: 'Depth', type: 'float', defaultValue: 0.5, min: 0, max: 1, unit: '' },
        { id: `feedback_${timestamp}`, name: 'Feedback', type: 'float', defaultValue: 0.5, min: 0, max: 0.95, unit: '' },
      ],
      eq: [
        { id: `low_${timestamp}`, name: 'Low', type: 'float', defaultValue: 0, min: -12, max: 12, unit: 'dB' },
        { id: `mid_${timestamp}`, name: 'Mid', type: 'float', defaultValue: 0, min: -12, max: 12, unit: 'dB' },
        { id: `high_${timestamp}`, name: 'High', type: 'float', defaultValue: 0, min: -12, max: 12, unit: 'dB' },
      ],
      limiter: [
        { id: `threshold_${timestamp}`, name: 'Threshold', type: 'float', defaultValue: -3, min: -20, max: 0, unit: 'dB' },
        { id: `release_${timestamp}`, name: 'Release', type: 'float', defaultValue: 0.01, min: 0.001, max: 1, unit: 's' },
      ],
      gate: [
        { id: `threshold_${timestamp}`, name: 'Threshold', type: 'float', defaultValue: -40, min: -60, max: 0, unit: 'dB' },
        { id: `attack_${timestamp}`, name: 'Attack', type: 'float', defaultValue: 0.001, min: 0.0001, max: 0.1, unit: 's' },
        { id: `release_${timestamp}`, name: 'Release', type: 'float', defaultValue: 0.1, min: 0.01, max: 2, unit: 's' },
      ],
      vocoder: [
        { id: `bands_${timestamp}`, name: 'Bands', type: 'int', defaultValue: 16, min: 4, max: 32, unit: '' },
        { id: `mix_${timestamp}`, name: 'Wet/Dry', type: 'float', defaultValue: 1, min: 0, max: 1, unit: '' },
      ],
      sampler: [
        { id: `pitch_${timestamp}`, name: 'Pitch', type: 'float', defaultValue: 0, min: -24, max: 24, unit: 'semitones' },
        { id: `loop_${timestamp}`, name: 'Loop', type: 'bool', defaultValue: 0, min: 0, max: 1, unit: '' },
      ],
      arpeggiator: [
        { id: `rate_${timestamp}`, name: 'Rate', type: 'float', defaultValue: 8, min: 1, max: 32, unit: 'steps' },
        { id: `octaves_${timestamp}`, name: 'Octaves', type: 'int', defaultValue: 1, min: 1, max: 4, unit: '' },
      ],
      waveshaper: [
        { id: `amount_${timestamp}`, name: 'Amount', type: 'float', defaultValue: 20, min: 0, max: 100, unit: '' },
        { id: `oversample_${timestamp}`, name: 'Oversample', type: 'enum', defaultValue: 1, min: 0, max: 2, unit: '' },
      ],
      'ring-mod': [
        { id: `freq_${timestamp}`, name: 'Frequency', type: 'float', defaultValue: 440, min: 20, max: 5000, unit: 'Hz' },
        { id: `mix_${timestamp}`, name: 'Wet/Dry', type: 'float', defaultValue: 0.5, min: 0, max: 1, unit: '' },
      ],
    };
    return paramMap[moduleId] || [];
  };

  // Generate DSP code for each module type
  const generateModuleDSP = (moduleId: string, params: PluginParameterDef[], framework: string): string => {
    if (framework === 'juce') {
      const dspMap: Record<string, string> = {
        oscillator: `    // Oscillator DSP
    for (int channel = 0; channel < buffer.getNumChannels(); ++channel) {
        auto* channelData = buffer.getWritePointer(channel);
        for (int sample = 0; sample < buffer.getNumSamples(); ++sample) {
            float phase = (float)sample / buffer.getNumSamples();
            channelData[sample] = std::sin(2.0f * M_PI * ${params[0]?.id || 'freq'} * phase);
        }
    }`,
        filter: `    // Filter DSP
    filterProcessor.setCoefficients(
        juce::IIRCoefficients::makeLowPass(
            getSampleRate(), 
            ${params[0]?.id || 'cutoff'}, 
            ${params[1]?.id || 'resonance'}
        )
    );
    filterProcessor.process(juce::dsp::ProcessContextReplacing<float>(buffer));`,
        gain: `    // Gain DSP
    buffer.applyGain(${params[0]?.id || 'gain'});`,
        delay: `    // Delay DSP
    delayLine.setDelay(${params[0]?.id || 'time'} * getSampleRate());
    for (int channel = 0; channel < buffer.getNumChannels(); ++channel) {
        auto* data = buffer.getWritePointer(channel);
        for (int sample = 0; sample < buffer.getNumSamples(); ++sample) {
            float delayed = delayLine.popSample(channel);
            float output = data[sample] + delayed * ${params[1]?.id || 'feedback'};
            delayLine.pushSample(channel, output);
            data[sample] = data[sample] * (1.0f - ${params[2]?.id || 'mix'}) + delayed * ${params[2]?.id || 'mix'};
        }
    }`,
      };
      return dspMap[moduleId] || `    // ${moduleId} processing`;
    } else {
      const dspMap: Record<string, string> = {
        oscillator: `    process(input, output) {
        const osc = this.audioContext.createOscillator();
        osc.frequency.value = this.${params[0]?.id || 'freq'};
        osc.type = ['sine', 'square', 'sawtooth', 'triangle'][this.${params[1]?.id || 'wave'} || 0];
        osc.connect(output);
        osc.start();
    }`,
        filter: `    process(input, output) {
        const filter = this.audioContext.createBiquadFilter();
        filter.frequency.value = this.${params[0]?.id || 'cutoff'};
        filter.Q.value = this.${params[1]?.id || 'resonance'};
        input.connect(filter);
        filter.connect(output);
    }`,
        gain: `    process(input, output) {
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.${params[0]?.id || 'gain'};
        input.connect(gainNode);
        gainNode.connect(output);
    }`,
        delay: `    process(input, output) {
        const delay = this.audioContext.createDelay();
        const feedback = this.audioContext.createGain();
        const wet = this.audioContext.createGain();
        
        delay.delayTime.value = this.${params[0]?.id || 'time'};
        feedback.gain.value = this.${params[1]?.id || 'feedback'};
        wet.gain.value = this.${params[2]?.id || 'mix'};
        
        input.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wet);
        wet.connect(output);
    }`,
      };
      return dspMap[moduleId] || `    // ${moduleId} processing`;
    }
  };

  const addParameter = () => {
    const newParam: PluginParameterDef = {
      id: `param_${Date.now()}`,
      name: 'New Parameter',
      type: 'float',
      defaultValue: 0.5,
      min: 0,
      max: 1,
      unit: ''
    };

    onChange({
      ...project,
      parameters: [...project.parameters, newParam]
    });

    toast.success('Parameter added');
  };

  const removeParameter = (paramId: string) => {
    onChange({
      ...project,
      parameters: project.parameters.filter(p => p.id !== paramId)
    });
    toast.success('Parameter removed');
  };

  const updateParameter = (paramId: string, updates: Partial<PluginParameterDef>) => {
    onChange({
      ...project,
      parameters: project.parameters.map(p => 
        p.id === paramId ? { ...p, ...updates } : p
      )
    });
  };

  const addModuleToProject = (moduleId: string) => {
    const newParams = getModuleParameters(moduleId);
    const moduleName = audioModules.find(m => m.id === moduleId)?.name || moduleId;
    
    onChange({
      ...project,
      parameters: [...project.parameters, ...newParams]
    });
    
    toast.success(`${moduleName} added with ${newParams.length} parameters`);
  };

  const generateCode = () => {
    // Generate code from visual design
    let code = '';

    if (project.framework === 'juce') {
      const dspCode = selectedModule ? generateModuleDSP(selectedModule, project.parameters, 'juce') : 
        project.parameters.map(p => `        // Process ${p.name}`).join('\n');
      
      code = `// Auto-generated JUCE plugin
class ${project.name.replace(/\s+/g, '')}Plugin : public juce::AudioProcessor {
public:
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) override {
${dspCode}
    }

    void prepareToPlay(double sampleRate, int samplesPerBlock) override {
        // Initialize DSP components
    }

private:
${project.parameters.map(p => `    ${p.type === 'int' ? 'int' : 'float'} ${p.id} = ${p.defaultValue}${p.type === 'float' ? 'f' : ''};`).join('\n')}
};`;
    } else {
      const dspCode = selectedModule ? generateModuleDSP(selectedModule, project.parameters, 'webaudio') :
        '        // Generated processing code';
        
      code = `// Auto-generated Web Audio plugin
class ${project.name.replace(/\s+/g, '')}Plugin {
    constructor(audioContext) {
        this.audioContext = audioContext;
${project.parameters.map(p => `        this.${p.id} = ${p.defaultValue};`).join('\n')}
    }

${dspCode}
}`;
    }

    onChange({ ...project, code });
    toast.success('Code generated from visual design');
  };

  // Get parameter values for visualization
  const getParameterValues = () => {
    return project.parameters.map(param => ({
      value: parameterValues[param.id] ?? param.defaultValue,
      min: param.min || 0,
      max: param.max || 1
    }));
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg bg-primary/10 backdrop-blur">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Interactive Visual Builder
                  {wasmEnabled && (
                    <Badge variant="default" className="bg-gradient-to-r from-cyan-500 to-blue-500">
                      <Zap className="h-3 w-3 mr-1" />
                      WASM
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Design your plugin with real-time visualization and auditory feedback
                </p>
              </div>
            </CardTitle>
            <Button onClick={generateCode} size="lg" className="gap-2">
              <Zap className="h-4 w-4" />
              Generate Code
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Audio Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Oscilloscope 
                width={600} 
                height={200}
                parameters={getParameterValues()}
              />
            </div>
            <div>
              <MasterOutput />
            </div>
          </div>

          {/* Interactive Control Surface */}
          {project.parameters.length > 0 && (
            <Card className="mb-6 bg-gradient-to-br from-background to-muted/20 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <SlidersIcon className="h-5 w-5 text-primary" />
                  Interactive Controls
                  <Badge variant="outline" className="ml-2">
                    Drag to adjust
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-6">
                  {project.parameters.slice(0, 8).map((param) => (
                    <InteractiveKnob
                      key={param.id}
                      value={parameterValues[param.id] ?? param.defaultValue}
                      min={param.min || 0}
                      max={param.max || 1}
                      label={param.name}
                      unit={param.unit}
                      onChange={(value) => {
                        setParameterValues(prev => ({ ...prev, [param.id]: value }));
                        updateParameter(param.id, { defaultValue: value });
                      }}
                    />
                  ))}
                </div>
                {project.parameters.length > 8 && (
                  <div className="text-center text-sm text-muted-foreground mt-4">
                    Showing first 8 parameters. See full list below.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Module Palette */}
          <div className="mb-6">
            <Label className="mb-3 text-base font-semibold flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Audio Modules
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {audioModules.map(module => {
                const IconComponent = module.icon;
                const isSelected = selectedModule === module.id;
                return (
                  <Card
                    key={module.id}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
                    }`}
                    onClick={() => {
                      setSelectedModule(module.id);
                      addModuleToProject(module.id);
                    }}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                      <div className={`${module.color} p-3 rounded-lg shadow-md`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium">{module.name}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Parameters Configuration */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <SlidersIcon className="h-4 w-4" />
                Parameter Configuration
              </Label>
              <Button size="sm" onClick={addParameter} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Parameter
              </Button>
            </div>

            <div className="space-y-3">
              {project.parameters.map(param => (
                <Card key={param.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={param.name}
                        onChange={(e) => updateParameter(param.id, { name: e.target.value })}
                        className="font-semibold max-w-xs"
                      />
                      <div className="flex items-center gap-2">
                        <Badge>{param.type}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParameter(param.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={param.type}
                          onValueChange={(value: any) => updateParameter(param.id, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="float">Float</SelectItem>
                            <SelectItem value="int">Integer</SelectItem>
                            <SelectItem value="bool">Boolean</SelectItem>
                            <SelectItem value="enum">Enum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Input
                          value={param.unit || ''}
                          onChange={(e) => updateParameter(param.id, { unit: e.target.value })}
                          placeholder="Hz, dB, %..."
                        />
                      </div>
                    </div>

                    {(param.type === 'float' || param.type === 'int') && (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Min</Label>
                          <Input
                            type="number"
                            value={param.min}
                            onChange={(e) => updateParameter(param.id, { min: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max</Label>
                          <Input
                            type="number"
                            value={param.max}
                            onChange={(e) => updateParameter(param.id, { max: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Default</Label>
                          <Input
                            type="number"
                            value={param.defaultValue}
                            onChange={(e) => updateParameter(param.id, { defaultValue: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {project.parameters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <SlidersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No parameters yet</p>
                  <p className="text-sm">Click "Add Parameter" to get started</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
