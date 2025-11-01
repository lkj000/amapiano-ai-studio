// Central DSP module registry - Phase 0, 1 & 2 Enhanced
export * from './types';
export * from './eq';
export * from './compressor';
export * from './gate';
export * from './reverb';
export * from './delay';
export * from './distortion';
export * from './presets';
export * from './ParameterParser';
export * from './WasmCompiler';
export * from './AudioContextManager';
export * from './ParameterOptimizer';
// Phase 2 Advanced DSP Modules
export * from './multiband';
export * from './limiter';
export * from './chorus';
export * from './phaser';

import { EQModule } from './eq';
import { CompressorModule } from './compressor';
import { GateModule } from './gate';
import { ReverbModule } from './reverb';
import { DelayModule } from './delay';
import { DistortionModule } from './distortion';
import { MultibandModule } from './multiband';
import { LimiterModule } from './limiter';
import { ChorusModule } from './chorus';
import { PhaserModule } from './phaser';
import type { DSPModule, EffectChain } from './types';

export const DSPModules: Record<string, DSPModule> = {
  eq: EQModule,
  compressor: CompressorModule,
  gate: GateModule,
  reverb: ReverbModule,
  delay: DelayModule,
  distortion: DistortionModule,
  multiband: MultibandModule,
  limiter: LimiterModule,
  chorus: ChorusModule,
  phaser: PhaserModule
};

export function createAmapianorizerChain(): EffectChain {
  return {
    modules: [
      EQModule,
      CompressorModule,
      GateModule,
      ReverbModule,
      DelayModule,
      DistortionModule
    ],
    routing: 'serial'
  };
}

export function generateChainCode(chain: EffectChain, framework: 'juce' | 'webaudio'): string {
  const moduleCodes = chain.modules.map(module => 
    module.generateCode(framework, module.parameters)
  );
  
  if (framework === 'juce') {
    return `
// Amapianorizer Effect Chain - ${chain.routing} routing
class AmapianorizerProcessor : public juce::AudioProcessor {
public:
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override {
        ${moduleCodes.join('\n        ')}
    }
    
private:
    ${chain.modules.map(m => `${m.name.replace(/\s+/g, '')} ${m.id};`).join('\n    ')}
};`;
  } else {
    return `
// Amapianorizer Web Audio Chain - ${chain.routing} routing
class AmapianorizerEffect {
    constructor(context) {
        this.context = context;
        ${moduleCodes.join('\n        ')}
        
        // Connect chain
        ${chain.routing === 'serial' 
          ? 'this.connectSerial();' 
          : 'this.connectParallel();'}
    }
}`;
  }
}
