/**
 * Phase 1: Smart Parameter Mapping & Optimization
 * AI-powered parameter range suggestions based on DSP best practices
 */

import type { DSPParameter } from './types';

export interface ParameterSuggestion {
  parameter: DSPParameter;
  reasoning: string;
  alternatives?: Array<{
    value: number;
    description: string;
  }>;
}

export interface OptimizationContext {
  genre?: string;
  targetUse?: 'mixing' | 'mastering' | 'creative' | 'live';
  cpuConstraint?: 'low' | 'medium' | 'high';
  latencyTolerance?: 'strict' | 'relaxed';
}

export class ParameterOptimizer {
  /**
   * Suggest optimal parameter ranges based on effect type and context
   */
  static suggestParameters(
    effectType: string,
    context: OptimizationContext = {}
  ): ParameterSuggestion[] {
    switch (effectType.toLowerCase()) {
      case 'compressor':
        return this.suggestCompressorParams(context);
      case 'eq':
        return this.suggestEQParams(context);
      case 'delay':
        return this.suggestDelayParams(context);
      case 'reverb':
        return this.suggestReverbParams(context);
      case 'distortion':
        return this.suggestDistortionParams(context);
      case 'gate':
        return this.suggestGateParams(context);
      default:
        return [];
    }
  }

  private static suggestCompressorParams(context: OptimizationContext): ParameterSuggestion[] {
    const isMastering = context.targetUse === 'mastering';
    const isAmapiano = context.genre?.toLowerCase().includes('amapiano');

    return [
      {
        parameter: {
          id: 'threshold',
          label: 'Threshold',
          type: 'float',
          default: isMastering ? -12 : -18,
          min: -60,
          max: 0,
          unit: 'dB',
          affects: 'Dynamics',
          category: 'control',
          automatable: true
        },
        reasoning: isMastering 
          ? 'Mastering typically uses gentler threshold around -12dB for transparent compression'
          : 'Standard mixing threshold allows 6-18dB of compression headroom',
        alternatives: [
          { value: -24, description: 'Gentle - for subtle glue compression' },
          { value: -12, description: 'Moderate - standard mixing' },
          { value: -6, description: 'Aggressive - heavy compression/pumping' }
        ]
      },
      {
        parameter: {
          id: 'ratio',
          label: 'Ratio',
          type: 'float',
          default: isAmapiano ? 6 : (isMastering ? 2 : 4),
          min: 1,
          max: 20,
          step: 0.1,
          unit: ':1',
          affects: 'Dynamics',
          category: 'control',
          automatable: false
        },
        reasoning: isAmapiano
          ? 'Amapiano benefits from aggressive 6:1 ratio for characteristic pumping'
          : isMastering
          ? 'Mastering uses gentle 2:1 ratio for transparent gain control'
          : 'Standard 4:1 ratio provides musical compression',
        alternatives: [
          { value: 2, description: 'Subtle - transparent compression' },
          { value: 4, description: 'Standard - musical compression' },
          { value: 8, description: 'Heavy - pumping/limiting effect' }
        ]
      },
      {
        parameter: {
          id: 'attack',
          label: 'Attack',
          type: 'float',
          default: isAmapiano ? 3 : 10,
          min: 0.1,
          max: 100,
          unit: 'ms',
          affects: 'Dynamics',
          category: 'control',
          automatable: true
        },
        reasoning: isAmapiano
          ? 'Fast 3ms attack catches transients for punchy pumping effect'
          : 'Medium 10ms attack preserves transient punch while controlling body'
      },
      {
        parameter: {
          id: 'release',
          label: 'Release',
          type: 'float',
          default: isAmapiano ? 150 : 80,
          min: 10,
          max: 1000,
          unit: 'ms',
          affects: 'Dynamics',
          category: 'control',
          automatable: true
        },
        reasoning: isAmapiano
          ? 'Slower 150ms release creates characteristic Amapiano breathing effect'
          : 'Medium 80ms release provides natural envelope following'
      }
    ];
  }

  private static suggestEQParams(context: OptimizationContext): ParameterSuggestion[] {
    const isMastering = context.targetUse === 'mastering';
    const isCreative = context.targetUse === 'creative';

    return [
      {
        parameter: {
          id: 'lowFreq',
          label: 'Low Frequency',
          type: 'float',
          default: isMastering ? 30 : 80,
          min: 20,
          max: 500,
          unit: 'Hz',
          affects: 'Tone',
          category: 'control',
          automatable: false
        },
        reasoning: isMastering
          ? 'Mastering EQ targets subsonic cleanup at 30Hz'
          : 'Mixing typically focuses on 80Hz to control bass without losing sub',
        alternatives: [
          { value: 40, description: 'Sub bass - EDM/Bass music' },
          { value: 80, description: 'Bass fundamental - most genres' },
          { value: 200, description: 'Warmth region - vocal/guitar' }
        ]
      },
      {
        parameter: {
          id: 'lowQ',
          label: 'Low Q',
          type: 'float',
          default: isMastering ? 0.7 : 1.2,
          min: 0.1,
          max: 10,
          affects: 'Tone',
          category: 'control',
          automatable: false
        },
        reasoning: isMastering
          ? 'Broad Q (0.7) for gentle, musical mastering adjustments'
          : 'Moderate Q (1.2) provides focused control without ringing',
        alternatives: [
          { value: 0.5, description: 'Very broad - musical shaping' },
          { value: 1.5, description: 'Focused - problem solving' },
          { value: 5.0, description: 'Surgical - notch filtering' }
        ]
      },
      {
        parameter: {
          id: 'midFreq',
          label: 'Mid Frequency',
          type: 'float',
          default: isCreative ? 1000 : 500,
          min: 200,
          max: 5000,
          unit: 'Hz',
          affects: 'Tone',
          category: 'control',
          automatable: true
        },
        reasoning: isCreative
          ? '1kHz center for creative effects and telephone-style filtering'
          : '500Hz targets muddy mids in typical mixes'
      }
    ];
  }

  private static suggestDelayParams(context: OptimizationContext): ParameterSuggestion[] {
    return [
      {
        parameter: {
          id: 'delayTime',
          label: 'Delay Time',
          type: 'float',
          default: 0.375, // Dotted 8th
          min: 0.0625, // 1/16 note
          max: 2.0,
          unit: 'beats',
          affects: 'Timing',
          category: 'control',
          automatable: true
        },
        reasoning: 'Dotted 8th (3/16) is the most musical delay time in most genres',
        alternatives: [
          { value: 0.25, description: '1/4 note - standard tempo delay' },
          { value: 0.375, description: 'Dotted 8th - rhythmic interest' },
          { value: 0.5, description: '1/2 note - spacious ambience' }
        ]
      },
      {
        parameter: {
          id: 'feedback',
          label: 'Feedback',
          type: 'float',
          default: 0.4,
          min: 0,
          max: 0.95,
          unit: '%',
          affects: 'Timing',
          category: 'control',
          automatable: true
        },
        reasoning: '40% feedback gives 3-4 audible repeats, ideal for most music',
        alternatives: [
          { value: 0.2, description: 'Subtle - 1-2 repeats' },
          { value: 0.5, description: 'Standard - 4-5 repeats' },
          { value: 0.8, description: 'Heavy - infinite delay effect' }
        ]
      }
    ];
  }

  private static suggestReverbParams(context: OptimizationContext): ParameterSuggestion[] {
    const isMastering = context.targetUse === 'mastering';

    return [
      {
        parameter: {
          id: 'roomSize',
          label: 'Room Size',
          type: 'float',
          default: isMastering ? 0.4 : 0.6,
          min: 0,
          max: 1,
          unit: '%',
          affects: 'Space',
          category: 'control',
          automatable: false
        },
        reasoning: isMastering
          ? 'Smaller room (40%) keeps reverb tight for clarity'
          : 'Medium room (60%) provides depth without overwhelming mix'
      },
      {
        parameter: {
          id: 'predelay',
          label: 'Pre-delay',
          type: 'float',
          default: 20,
          min: 0,
          max: 100,
          unit: 'ms',
          affects: 'Space',
          category: 'control',
          automatable: false
        },
        reasoning: '20ms pre-delay separates direct sound from reverb for clarity'
      }
    ];
  }

  private static suggestDistortionParams(context: OptimizationContext): ParameterSuggestion[] {
    return [
      {
        parameter: {
          id: 'drive',
          label: 'Drive',
          type: 'float',
          default: 1.5,
          min: 1,
          max: 10,
          unit: 'x',
          affects: 'Tone',
          category: 'control',
          automatable: true
        },
        reasoning: '1.5x drive provides subtle saturation without obvious distortion'
      }
    ];
  }

  private static suggestGateParams(context: OptimizationContext): ParameterSuggestion[] {
    return [
      {
        parameter: {
          id: 'threshold',
          label: 'Threshold',
          type: 'float',
          default: -40,
          min: -80,
          max: 0,
          unit: 'dB',
          affects: 'Dynamics',
          category: 'control',
          automatable: true
        },
        reasoning: '-40dB threshold gates noise floor while preserving musical content'
      }
    ];
  }

  /**
   * Validate parameter value against best practices
   */
  static validateParameter(param: DSPParameter, value: number): {
    valid: boolean;
    warning?: string;
    suggestion?: number;
  } {
    if (param.type !== 'float' && param.type !== 'int') {
      return { valid: true };
    }

    // Check if value is in range
    if (param.min !== undefined && value < param.min) {
      return {
        valid: false,
        warning: `Value ${value} is below minimum ${param.min}`,
        suggestion: param.min
      };
    }

    if (param.max !== undefined && value > param.max) {
      return {
        valid: false,
        warning: `Value ${value} is above maximum ${param.max}`,
        suggestion: param.max
      };
    }

    // Check for common anti-patterns
    if (param.id.toLowerCase().includes('threshold') && value > -6) {
      return {
        valid: true,
        warning: 'High threshold may cause over-compression',
        suggestion: -12
      };
    }

    if (param.id.toLowerCase().includes('ratio') && value > 10) {
      return {
        valid: true,
        warning: 'Very high ratio acts as a limiter - consider gentler compression',
        suggestion: 6
      };
    }

    if (param.id.toLowerCase().includes('attack') && value < 1) {
      return {
        valid: true,
        warning: 'Sub-millisecond attack may cause clicks',
        suggestion: 1
      };
    }

    return { valid: true };
  }

  /**
   * Suggest performance optimizations based on CPU constraint
   */
  static suggestOptimizations(
    code: string,
    cpuConstraint: 'low' | 'medium' | 'high' = 'medium'
  ): string[] {
    const suggestions: string[] = [];

    if (cpuConstraint === 'low') {
      suggestions.push('Use simpler filters (1-pole instead of 2-pole)');
      suggestions.push('Reduce oversampling factor');
      suggestions.push('Consider lookup tables for expensive math operations');
    }

    if (code.includes('Math.sin') || code.includes('std::sin')) {
      suggestions.push('Cache sine wave calculations in a wavetable');
    }

    if (code.includes('Math.pow') || code.includes('std::pow')) {
      suggestions.push('Replace pow() with multiplication for small integer exponents');
    }

    if (code.includes('IIR') && cpuConstraint === 'low') {
      suggestions.push('Consider FIR filters if phase is not critical');
    }

    return suggestions;
  }
}
