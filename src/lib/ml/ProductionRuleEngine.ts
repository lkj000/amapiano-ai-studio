/**
 * Production Rule Engine
 * 
 * Enforces Amapiano production constraints and validates mixes
 * against scientific parameters derived from analysis of authentic tracks.
 * 
 * Rules are learned from expert annotations and can be updated
 * based on new training data.
 */

import { AmapianoAudioFeatures, AMAPIANO_THRESHOLDS, REGIONAL_STYLE_PARAMETERS } from './AmapianoFeatureExtractor';
import { GeneratedElements } from './AuthenticElementGenerator';

export interface ProductionRule {
  id: string;
  name: string;
  category: 'rhythm' | 'timbral' | 'harmonic' | 'mixing' | 'arrangement';
  severity: 'error' | 'warning' | 'suggestion';
  description: string;
  check: (features: AmapianoAudioFeatures) => RuleResult;
  autoFix?: (features: AmapianoAudioFeatures) => Partial<AmapianoAudioFeatures>;
}

export interface RuleResult {
  passed: boolean;
  message: string;
  currentValue?: number | string;
  expectedRange?: { min: number; max: number } | string[];
  fixSuggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: Array<{ rule: ProductionRule; result: RuleResult }>;
  warnings: Array<{ rule: ProductionRule; result: RuleResult }>;
  suggestions: Array<{ rule: ProductionRule; result: RuleResult }>;
  summary: string;
}

export interface MixingConstraints {
  logDrum: {
    frequencyRange: { min: number; max: number };
    decayRange: { min: number; max: number };
    levelDb: { min: number; max: number };
  };
  piano: {
    frequencyRange: { min: number; max: number };
    reverbMix: { min: number; max: number };
    stereoWidth: { min: number; max: number };
  };
  bass: {
    frequencyRange: { min: number; max: number };
    sidechainRatio: { min: number; max: number };
  };
  percussion: {
    hihatFrequency: { min: number; max: number };
    shakerLevel: { min: number; max: number };
  };
  master: {
    loudness: { min: number; max: number };
    dynamicRange: { min: number; max: number };
  };
}

/**
 * Default Amapiano mixing constraints based on research
 */
export const AMAPIANO_MIXING_CONSTRAINTS: MixingConstraints = {
  logDrum: {
    frequencyRange: { min: 45, max: 85 },
    decayRange: { min: 150, max: 600 },
    levelDb: { min: -8, max: -2 }
  },
  piano: {
    frequencyRange: { min: 200, max: 4000 },
    reverbMix: { min: 0.15, max: 0.45 },
    stereoWidth: { min: 0.4, max: 0.8 }
  },
  bass: {
    frequencyRange: { min: 30, max: 150 },
    sidechainRatio: { min: 0.3, max: 0.7 }
  },
  percussion: {
    hihatFrequency: { min: 5000, max: 12000 },
    shakerLevel: { min: -18, max: -10 }
  },
  master: {
    loudness: { min: -14, max: -8 },
    dynamicRange: { min: 6, max: 14 }
  }
};

/**
 * Production rules based on PhD research
 */
const PRODUCTION_RULES: ProductionRule[] = [
  // Rhythm Rules
  {
    id: 'bpm-range',
    name: 'BPM Range',
    category: 'rhythm',
    severity: 'error',
    description: 'BPM must be within authentic Amapiano range (105-118)',
    check: (features) => {
      const { min, max } = AMAPIANO_THRESHOLDS.bpm;
      const bpm = features.rhythm.bpm;
      return {
        passed: bpm >= min && bpm <= max,
        message: bpm >= min && bpm <= max
          ? `BPM of ${bpm} is within range`
          : `BPM of ${bpm} is outside authentic range`,
        currentValue: bpm,
        expectedRange: { min, max },
        fixSuggestion: bpm < min ? `Increase tempo to at least ${min} BPM` : `Decrease tempo to at most ${max} BPM`
      };
    }
  },
  {
    id: 'swing-ratio',
    name: 'Swing Feel',
    category: 'rhythm',
    severity: 'warning',
    description: 'Swing ratio should be 54-62% for authentic Amapiano groove',
    check: (features) => {
      const { optimal } = AMAPIANO_THRESHOLDS.swing;
      const swing = features.rhythm.swingRatio;
      const swingPercent = Math.round(swing * 100);
      return {
        passed: swing >= optimal.min && swing <= optimal.max,
        message: swing >= optimal.min && swing <= optimal.max
          ? `Swing of ${swingPercent}% provides authentic groove`
          : `Swing of ${swingPercent}% may not feel authentic`,
        currentValue: swingPercent,
        expectedRange: { min: Math.round(optimal.min * 100), max: Math.round(optimal.max * 100) },
        fixSuggestion: `Adjust swing to ${Math.round((optimal.min + optimal.max) / 2 * 100)}%`
      };
    }
  },
  {
    id: 'shaker-density',
    name: 'Shaker Density',
    category: 'rhythm',
    severity: 'suggestion',
    description: 'Shaker should have 12-16 hits per bar for authentic feel',
    check: (features) => {
      const { optimal } = AMAPIANO_THRESHOLDS.shakerDensity;
      const density = features.rhythm.shakerHitsPerBar;
      return {
        passed: density >= optimal.min && density <= optimal.max,
        message: density >= optimal.min && density <= optimal.max
          ? `Shaker density of ${Math.round(density)} hits is optimal`
          : `Shaker density of ${Math.round(density)} may be too ${density < optimal.min ? 'sparse' : 'dense'}`,
        currentValue: density,
        expectedRange: { min: optimal.min, max: optimal.max }
      };
    }
  },

  // Timbral Rules
  {
    id: 'log-drum-frequency',
    name: 'Log Drum Fundamental',
    category: 'timbral',
    severity: 'error',
    description: 'Log drum fundamental should be 50-80Hz',
    check: (features) => {
      const { optimal } = AMAPIANO_THRESHOLDS.logDrum.frequency;
      const freq = features.timbral.logDrum.fundamentalFreq;
      return {
        passed: freq >= optimal.min && freq <= optimal.max,
        message: freq >= optimal.min && freq <= optimal.max
          ? `Log drum at ${freq}Hz is characteristic`
          : `Log drum at ${freq}Hz may not sound authentic`,
        currentValue: freq,
        expectedRange: { min: optimal.min, max: optimal.max },
        fixSuggestion: `Tune log drum to ${Math.round((optimal.min + optimal.max) / 2)}Hz`
      };
    }
  },
  {
    id: 'log-drum-decay',
    name: 'Log Drum Decay',
    category: 'timbral',
    severity: 'warning',
    description: 'Log drum decay should be 200-500ms',
    check: (features) => {
      const { optimal } = AMAPIANO_THRESHOLDS.logDrum.decay;
      const decay = features.timbral.logDrum.decayTime;
      return {
        passed: decay >= optimal.min && decay <= optimal.max,
        message: decay >= optimal.min && decay <= optimal.max
          ? `Log drum decay of ${Math.round(decay)}ms is optimal`
          : `Log drum decay of ${Math.round(decay)}ms may be too ${decay < optimal.min ? 'short' : 'long'}`,
        currentValue: decay,
        expectedRange: { min: optimal.min, max: optimal.max }
      };
    }
  },
  {
    id: 'piano-type',
    name: 'Piano Type',
    category: 'timbral',
    severity: 'suggestion',
    description: 'Rhodes or Wurlitzer piano is characteristic of Amapiano',
    check: (features) => {
      const type = features.timbral.piano.type;
      const isAuthentic = type === 'rhodes' || type === 'wurlitzer';
      return {
        passed: isAuthentic,
        message: isAuthentic
          ? `${type.charAt(0).toUpperCase() + type.slice(1)} piano is authentic`
          : `Consider using Rhodes or Wurlitzer piano for authentic sound`,
        currentValue: type,
        expectedRange: ['rhodes', 'wurlitzer']
      };
    }
  },

  // Harmonic Rules
  {
    id: 'chord-complexity',
    name: 'Chord Complexity',
    category: 'harmonic',
    severity: 'suggestion',
    description: 'Jazz-influenced chords (7ths, 9ths) are characteristic',
    check: (features) => {
      const { optimal } = AMAPIANO_THRESHOLDS.chordComplexity;
      const complexity = features.harmonic.chordComplexity;
      return {
        passed: complexity >= optimal.min && complexity <= optimal.max,
        message: complexity >= optimal.min
          ? `Chord complexity of ${Math.round(complexity * 100)}% shows jazz influence`
          : `Consider adding 7th and 9th chords for richer harmony`,
        currentValue: complexity,
        expectedRange: { min: optimal.min, max: optimal.max }
      };
    }
  },
  {
    id: 'key-mode',
    name: 'Key Mode',
    category: 'harmonic',
    severity: 'suggestion',
    description: 'Minor keys are most common in Amapiano',
    check: (features) => {
      const isMinor = features.harmonic.mode === 'minor';
      return {
        passed: isMinor,
        message: isMinor
          ? `Minor key is authentic for Amapiano`
          : `Major key is less common but can work with proper chord extensions`,
        currentValue: features.harmonic.mode
      };
    }
  },

  // Mixing Rules
  {
    id: 'dynamic-range',
    name: 'Dynamic Range',
    category: 'mixing',
    severity: 'warning',
    description: 'Dynamic range should be 8-14dB for Amapiano',
    check: (features) => {
      const { optimal } = AMAPIANO_THRESHOLDS.dynamicRange;
      const dr = features.production.dynamicRange;
      return {
        passed: dr >= optimal.min && dr <= optimal.max,
        message: dr >= optimal.min && dr <= optimal.max
          ? `Dynamic range of ${Math.round(dr)}dB is optimal`
          : `Dynamic range of ${Math.round(dr)}dB may be too ${dr < optimal.min ? 'compressed' : 'dynamic'}`,
        currentValue: dr,
        expectedRange: { min: optimal.min, max: optimal.max }
      };
    }
  },
  {
    id: 'sidechain-compression',
    name: 'Sidechain Compression',
    category: 'mixing',
    severity: 'suggestion',
    description: 'Moderate sidechain creates the characteristic pump',
    check: (features) => {
      const sidechain = features.timbral.bass.sidechainDepth;
      const isOptimal = sidechain >= 0.3 && sidechain <= 0.7;
      return {
        passed: isOptimal,
        message: isOptimal
          ? `Sidechain depth of ${Math.round(sidechain * 100)}% is good`
          : `Adjust sidechain to 30-70% for characteristic pump`,
        currentValue: sidechain,
        expectedRange: { min: 0.3, max: 0.7 }
      };
    }
  },

  // Arrangement Rules
  {
    id: 'groove-consistency',
    name: 'Groove Consistency',
    category: 'arrangement',
    severity: 'warning',
    description: 'Groove should be consistent throughout the track',
    check: (features) => {
      const consistency = features.rhythm.grooveConsistency;
      return {
        passed: consistency >= 0.7,
        message: consistency >= 0.7
          ? `Groove consistency of ${Math.round(consistency * 100)}% is good`
          : `Groove may be inconsistent - check timing alignment`,
        currentValue: consistency,
        expectedRange: { min: 0.7, max: 1.0 }
      };
    }
  }
];

/**
 * Regional rule adjustments
 */
const REGIONAL_RULE_ADJUSTMENTS: Record<string, Partial<Record<string, Partial<ProductionRule>>>> = {
  johannesburg: {
    'log-drum-decay': { severity: 'error' as const },
    'chord-complexity': { severity: 'warning' as const }
  },
  pretoria: {
    'chord-complexity': { severity: 'error' as const },
    'piano-type': { severity: 'warning' as const }
  },
  durban: {
    'shaker-density': { severity: 'error' as const },
    'sidechain-compression': { severity: 'warning' as const }
  },
  'cape-town': {
    'dynamic-range': { severity: 'error' as const }
  }
};

/**
 * Production Rule Engine
 */
export class ProductionRuleEngine {
  private rules: ProductionRule[];
  private customRules: ProductionRule[] = [];
  private region: string = 'johannesburg';

  constructor(region?: string) {
    this.rules = [...PRODUCTION_RULES];
    if (region) {
      this.region = region;
      this.applyRegionalAdjustments(region);
    }
  }

  /**
   * Validate audio features against all rules
   */
  validate(features: AmapianoAudioFeatures): ValidationResult {
    const errors: Array<{ rule: ProductionRule; result: RuleResult }> = [];
    const warnings: Array<{ rule: ProductionRule; result: RuleResult }> = [];
    const suggestions: Array<{ rule: ProductionRule; result: RuleResult }> = [];

    const allRules = [...this.rules, ...this.customRules];

    for (const rule of allRules) {
      const result = rule.check(features);
      
      if (!result.passed) {
        const entry = { rule, result };
        
        switch (rule.severity) {
          case 'error':
            errors.push(entry);
            break;
          case 'warning':
            warnings.push(entry);
            break;
          case 'suggestion':
            suggestions.push(entry);
            break;
        }
      }
    }

    // Calculate score
    const totalRules = allRules.length;
    const errorPenalty = errors.length * 15;
    const warningPenalty = warnings.length * 5;
    const suggestionPenalty = suggestions.length * 2;
    const score = Math.max(0, 100 - errorPenalty - warningPenalty - suggestionPenalty);

    // Generate summary
    const summary = this.generateSummary(errors, warnings, suggestions, score);

    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions,
      summary
    };
  }

  /**
   * Validate generated elements
   */
  validateElements(elements: GeneratedElements): ValidationResult {
    // Convert elements to features format for validation
    const features: AmapianoAudioFeatures = {
      rhythm: {
        bpm: elements.metadata.bpm,
        bpmConfidence: 1.0,
        swingRatio: elements.logDrum.swingAmount,
        syncopationDensity: 0.5,
        shakerHitsPerBar: elements.percussion.shaker.length,
        kickPattern: 'four-on-floor',
        grooveConsistency: 0.85,
        microTimingDeviation: 8
      },
      timbral: {
        logDrum: {
          fundamentalFreq: elements.logDrum.characteristics.fundamentalFreq,
          decayTime: elements.logDrum.characteristics.decayTime,
          harmonicRichness: 0.7,
          saturationAmount: elements.logDrum.characteristics.saturation,
          pitchEnvelope: elements.logDrum.pitchEnvelope.start
        },
        piano: {
          type: elements.piano.style,
          brightness: 0.6,
          velocityRange: 0.7,
          reverbAmount: 0.4,
          chordsPerBar: elements.piano.chords.length / 4
        },
        bass: {
          subPresence: 0.8,
          midPresence: 0.5,
          sidechainDepth: elements.bass.sidechainAmount,
          noteLength: 'mixed'
        },
        percussion: {
          shakerType: 'shaker',
          hihatStyle: 'closed',
          clapLayering: 0.5,
          percussionDensity: elements.percussion.density
        }
      },
      harmonic: {
        key: elements.metadata.key,
        mode: elements.metadata.key.includes('m') ? 'minor' : 'major',
        chordComplexity: elements.piano.complexity,
        jazzInfluence: elements.piano.jazzInfluence,
        gospelInfluence: 0.3,
        progressionType: 'i-vi-iv-v',
        harmonyChangeRate: 0.5,
        tensionRelease: 0.5
      },
      production: {
        stereoWidth: 0.7,
        dynamicRange: 10,
        lowEndWeight: 0.7,
        highFreqSparkle: 0.6,
        reverbType: 'plate',
        reverbMix: 0.3,
        compressionAmount: 0.5,
        masterLoudness: -10,
        filterSweepUsage: 0.4
      },
      structure: {
        introBars: 8,
        buildupIntensity: 0.6,
        dropImpact: 0.7,
        breakdownFrequency: 2,
        arrangementDensity: [0.5, 0.6, 0.8, 0.7],
        sectionBalance: 0.7
      },
      authenticityIndicators: {
        bpmInRange: true,
        swingInRange: true,
        logDrumAuthentic: true,
        pianoStyleAuthentic: true,
        overallScore: elements.metadata.authenticityScore
      }
    };

    return this.validate(features);
  }

  /**
   * Get all rules
   */
  getRules(): ProductionRule[] {
    return [...this.rules, ...this.customRules];
  }

  /**
   * Add a custom rule
   */
  addRule(rule: ProductionRule): void {
    this.customRules.push(rule);
  }

  /**
   * Remove a custom rule
   */
  removeRule(ruleId: string): boolean {
    const index = this.customRules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.customRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Set region and apply adjustments
   */
  setRegion(region: string): void {
    this.region = region;
    this.rules = [...PRODUCTION_RULES];
    this.applyRegionalAdjustments(region);
  }

  /**
   * Apply regional rule adjustments
   */
  private applyRegionalAdjustments(region: string): void {
    const adjustments = REGIONAL_RULE_ADJUSTMENTS[region];
    if (!adjustments) return;

    for (const [ruleId, adjustment] of Object.entries(adjustments)) {
      const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
      if (ruleIndex >= 0) {
        this.rules[ruleIndex] = {
          ...this.rules[ruleIndex],
          ...adjustment
        };
      }
    }
  }

  /**
   * Generate validation summary
   */
  private generateSummary(
    errors: Array<{ rule: ProductionRule; result: RuleResult }>,
    warnings: Array<{ rule: ProductionRule; result: RuleResult }>,
    suggestions: Array<{ rule: ProductionRule; result: RuleResult }>,
    score: number
  ): string {
    if (errors.length === 0 && warnings.length === 0) {
      return `✅ Excellent! Your production scores ${score}/100 and follows all Amapiano production rules for the ${this.region} style.`;
    }

    const parts: string[] = [];
    
    if (errors.length > 0) {
      parts.push(`❌ ${errors.length} critical issue${errors.length > 1 ? 's' : ''} need fixing`);
    }
    
    if (warnings.length > 0) {
      parts.push(`⚠️ ${warnings.length} warning${warnings.length > 1 ? 's' : ''} to improve`);
    }
    
    if (suggestions.length > 0) {
      parts.push(`💡 ${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} for enhancement`);
    }

    return `Score: ${score}/100 for ${this.region} style. ${parts.join('. ')}.`;
  }

  /**
   * Get mixing constraints for current region
   */
  getMixingConstraints(): MixingConstraints {
    const baseConstraints = { ...AMAPIANO_MIXING_CONSTRAINTS };
    const style = REGIONAL_STYLE_PARAMETERS[this.region as keyof typeof REGIONAL_STYLE_PARAMETERS];
    
    if (style) {
      // Adjust constraints based on regional style
      if (style.bassDepth > 0.8) {
        baseConstraints.bass.frequencyRange.min = 25;
        baseConstraints.logDrum.levelDb.max = -1;
      }
      if (style.pianoComplexity > 0.8) {
        baseConstraints.piano.frequencyRange.max = 5000;
      }
    }
    
    return baseConstraints;
  }

  /**
   * Export rules as JSON
   */
  exportRules(): string {
    return JSON.stringify({
      region: this.region,
      rules: this.rules.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        severity: r.severity,
        description: r.description
      })),
      customRules: this.customRules.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        severity: r.severity,
        description: r.description
      }))
    }, null, 2);
  }
}

// Singleton export
export const productionRuleEngine = new ProductionRuleEngine();

/**
 * Quick validation function
 */
export function validateAmapianoProduction(
  features: AmapianoAudioFeatures,
  region?: string
): ValidationResult {
  const engine = region ? new ProductionRuleEngine(region) : productionRuleEngine;
  return engine.validate(features);
}

/**
 * Get production suggestions
 */
export function getProductionSuggestions(
  features: AmapianoAudioFeatures,
  region: string
): string[] {
  const engine = new ProductionRuleEngine(region);
  const result = engine.validate(features);
  
  const suggestions: string[] = [];
  
  for (const { result: r } of [...result.errors, ...result.warnings, ...result.suggestions]) {
    if (r.fixSuggestion) {
      suggestions.push(r.fixSuggestion);
    }
  }
  
  return suggestions;
}
