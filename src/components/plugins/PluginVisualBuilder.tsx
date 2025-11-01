import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Grid3x3, Plus, Trash2, Zap, Volume2, Sliders as SlidersIcon } from 'lucide-react';
import { toast } from 'sonner';
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

  const generateCode = () => {
    // Generate code from visual design
    let code = '';

    if (project.framework === 'juce') {
      code = `// Auto-generated JUCE plugin
class ${project.name.replace(/\s+/g, '')}Plugin : public juce::AudioProcessor {
public:
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) override {
        // Generated DSP code
${project.parameters.map(p => `        // Process ${p.name}`).join('\n')}
    }
private:
${project.parameters.map(p => `    float ${p.id} = ${p.defaultValue}f;`).join('\n')}
};`;
    } else {
      code = `// Auto-generated Web Audio plugin
class ${project.name.replace(/\s+/g, '')}Plugin {
    constructor(audioContext) {
        this.audioContext = audioContext;
${project.parameters.map(p => `        this.${p.id} = ${p.defaultValue};`).join('\n')}
    }

    process(input, output) {
        // Generated processing code
    }
}`;
    }

    onChange({ ...project, code });
    toast.success('Code generated from visual design');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5" />
              Visual Plugin Builder
              {wasmEnabled && (
                <Badge variant="default" className="bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Zap className="h-3 w-3 mr-1" />
                  WASM
                </Badge>
              )}
            </CardTitle>
            <Button onClick={generateCode}>
              Generate Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Module Palette */}
          <div className="mb-6">
            <Label className="mb-2 block">Audio Modules</Label>
            <div className="grid grid-cols-3 gap-2">
              {audioModules.map(module => {
                const IconComponent = module.icon;
                return (
                  <Card
                    key={module.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedModule(module.id);
                      toast.info(`Selected: ${module.name}`);
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-2">
                      <div className={`${module.color} p-2 rounded`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{module.name}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Parameters Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Parameters</Label>
              <Button size="sm" onClick={addParameter}>
                <Plus className="h-4 w-4 mr-1" />
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
