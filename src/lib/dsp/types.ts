// DSP Parameter Metadata Types - Enhanced for Phase 0
export interface DSPParameter {
  id: string;
  label: string;
  type: 'float' | 'int' | 'bool' | 'enum';
  default: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  affects: string;
  description?: string;
  category?: 'input' | 'output' | 'control' | 'modulation';
  automatable?: boolean;
  valueStrings?: string[]; // For enum types
}

export interface ParameterMapping {
  parameterId: string;
  wasmIndex: number;
  normalized: boolean;
  scaling: 'linear' | 'logarithmic' | 'exponential';
}

export interface DSPModule {
  id: string;
  name: string;
  category: 'dynamics' | 'eq' | 'time' | 'modulation' | 'distortion' | 'utility';
  version: string;
  parameters: DSPParameter[];
  inputs: number;
  outputs: number;
  latency: number;
  generateCode: (framework: 'juce' | 'webaudio' | 'wasm', params: DSPParameter[]) => string;
  generateWasmBindings?: (params: DSPParameter[]) => string;
  validateParameters?: (params: Record<string, any>) => boolean;
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
