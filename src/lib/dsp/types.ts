// DSP Parameter Metadata Types
export interface DSPParameter {
  id: string;
  label: string;
  type: 'float' | 'int' | 'bool' | 'enum';
  default: number | boolean | string;
  min?: number;
  max?: number;
  unit?: string;
  affects: string;
  description?: string;
}

export interface DSPModule {
  id: string;
  name: string;
  category: 'dynamics' | 'eq' | 'time' | 'modulation' | 'distortion' | 'utility';
  parameters: DSPParameter[];
  generateCode: (framework: 'juce' | 'webaudio', params: DSPParameter[]) => string;
}

export interface EffectChain {
  modules: DSPModule[];
  routing: 'serial' | 'parallel' | 'hybrid';
}

export interface PresetDefinition {
  name: string;
  description: string;
  genre?: string;
  parameters: Record<string, number | boolean | string>;
}
