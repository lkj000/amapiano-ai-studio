/**
 * Mixing Agent
 * 
 * Specialized agent for mixing, levels, EQ, compression, and spatial placement.
 * Implements the "Amapiano Mix Standard" with log drum priority and auto-sidechaining.
 */

import { BaseAgent, ExecutionContext, ExecutionResult, EvaluationResult, ImprovementPlan } from './BaseAgent';

// ============================================================================\\
// MIX CONFIGURATION TYPES
// ============================================================================\\

interface ChannelConfig {
  name: string;
  volume: number;      // dB
  pan: number;         // -1 to 1
  eq: EQSettings;
  compression: CompressorSettings;
  sidechain?: SidechainSettings;
  sends: SendConfig[];
}

interface EQSettings {
  bands: Array<{
    frequency: number;
    gain: number;
    q: number;
    type: 'lowshelf' | 'highshelf' | 'peaking' | 'lowpass' | 'highpass';
  }>;
}

interface CompressorSettings {
  threshold: number;   // dB
  ratio: number;
  attack: number;      // ms
  release: number;     // ms
  knee: number;
  makeupGain: number;  // dB
}

interface SidechainSettings {
  source: string;      // Source channel
  amount: number;      // 0-100%
  attack: number;      // ms
  release: number;     // ms
  curve: 'linear' | 'exponential';
}

interface SendConfig {
  bus: string;
  amount: number;      // dB
}

interface MixBus {
  name: string;
  type: 'reverb' | 'delay' | 'chorus' | 'saturation';
  settings: Record<string, number>;
  volume: number;
}

interface MasterConfig {
  limiter: {
    ceiling: number;
    release: number;
  };
  eq: EQSettings;
  stereoWidth: number;
  targetLUFS: number;
}

// ============================================================================\\
// AMAPIANO MIX PRESETS
// ============================================================================\\

const AMAPIANO_MIX_TEMPLATES: Record<string, {
  channels: Record<string, Partial<ChannelConfig>>;
  buses: MixBus[];
  master: MasterConfig;
}> = {
  'johannesburg-classic': {
    channels: {
      'log-drum': {
        volume: -2,
        pan: 0,
        eq: {
          bands: [
            { frequency: 40, gain: 3, q: 1.2, type: 'peaking' },    // Sub presence
            { frequency: 200, gain: -2, q: 2, type: 'peaking' },    // Clean up mud
            { frequency: 2000, gain: 1, q: 1.5, type: 'peaking' }   // Presence
          ]
        },
        compression: {
          threshold: -12,
          ratio: 4,
          attack: 10,
          release: 100,
          knee: 6,
          makeupGain: 3
        }
      },
      'kick': {
        volume: -6,
        pan: 0,
        eq: {
          bands: [
            { frequency: 55, gain: -6, q: 4, type: 'peaking' },     // Duck under log drum
            { frequency: 100, gain: 2, q: 1.5, type: 'peaking' },
            { frequency: 3000, gain: 2, q: 2, type: 'peaking' }     // Click
          ]
        },
        compression: {
          threshold: -15,
          ratio: 6,
          attack: 1,
          release: 50,
          knee: 3,
          makeupGain: 4
        },
        sidechain: {
          source: 'log-drum',
          amount: 40,
          attack: 5,
          release: 80,
          curve: 'exponential'
        }
      },
      'bass': {
        volume: -8,
        pan: 0,
        eq: {
          bands: [
            { frequency: 30, gain: -3, q: 1, type: 'highpass' },    // Remove rumble
            { frequency: 80, gain: 2, q: 1.5, type: 'peaking' },    // Body
            { frequency: 250, gain: -2, q: 2, type: 'peaking' }     // Clear mud
          ]
        },
        compression: {
          threshold: -18,
          ratio: 4,
          attack: 20,
          release: 120,
          knee: 6,
          makeupGain: 3
        },
        sidechain: {
          source: 'log-drum',
          amount: 50,
          attack: 3,
          release: 100,
          curve: 'exponential'
        }
      },
      'piano': {
        volume: -10,
        pan: 0.1,
        eq: {
          bands: [
            { frequency: 150, gain: -2, q: 1.5, type: 'highpass' }, // Clear bass
            { frequency: 400, gain: -1, q: 2, type: 'peaking' },    // Reduce boxiness
            { frequency: 3000, gain: 2, q: 1.5, type: 'peaking' }   // Presence
          ]
        },
        compression: {
          threshold: -20,
          ratio: 2.5,
          attack: 30,
          release: 200,
          knee: 10,
          makeupGain: 2
        },
        sends: [
          { bus: 'reverb', amount: -15 }
        ]
      },
      'hihat': {
        volume: -14,
        pan: 0.2,
        eq: {
          bands: [
            { frequency: 500, gain: -3, q: 1, type: 'highpass' },
            { frequency: 8000, gain: 2, q: 1.5, type: 'peaking' }
          ]
        },
        compression: {
          threshold: -25,
          ratio: 2,
          attack: 5,
          release: 50,
          knee: 6,
          makeupGain: 1
        }
      },
      'shaker': {
        volume: -16,
        pan: -0.3,
        eq: {
          bands: [
            { frequency: 800, gain: -2, q: 1, type: 'highpass' },
            { frequency: 6000, gain: 1.5, q: 2, type: 'peaking' }
          ]
        },
        compression: {
          threshold: -22,
          ratio: 2,
          attack: 10,
          release: 80,
          knee: 8,
          makeupGain: 1
        }
      }
    },
    buses: [
      {
        name: 'reverb',
        type: 'reverb',
        settings: {
          roomSize: 0.5,
          damping: 0.6,
          wetLevel: 0.3,
          predelay: 20
        },
        volume: -12
      },
      {
        name: 'delay',
        type: 'delay',
        settings: {
          time: 375,        // 1/8 note at 115 BPM
          feedback: 0.3,
          wetLevel: 0.25
        },
        volume: -18
      }
    ],
    master: {
      limiter: {
        ceiling: -0.3,
        release: 100
      },
      eq: {
        bands: [
          { frequency: 30, gain: 0, q: 1, type: 'highpass' },
          { frequency: 16000, gain: -1, q: 1, type: 'highshelf' }
        ]
      },
      stereoWidth: 1.1,
      targetLUFS: -14
    }
  },
  
  'private-school-soulful': {
    channels: {
      'log-drum': {
        volume: -4,       // Slightly lower than classic
        eq: {
          bands: [
            { frequency: 50, gain: 2, q: 1.5, type: 'peaking' },
            { frequency: 2500, gain: 1.5, q: 1.2, type: 'peaking' }
          ]
        },
        compression: {
          threshold: -14,
          ratio: 3,
          attack: 15,
          release: 120,
          knee: 8,
          makeupGain: 2
        }
      },
      'piano': {
        volume: -6,       // More prominent
        pan: 0,
        eq: {
          bands: [
            { frequency: 200, gain: -1, q: 2, type: 'peaking' },
            { frequency: 2000, gain: 2, q: 1.2, type: 'peaking' },
            { frequency: 5000, gain: 1, q: 1.5, type: 'peaking' }
          ]
        },
        compression: {
          threshold: -18,
          ratio: 2,
          attack: 40,
          release: 250,
          knee: 12,
          makeupGain: 2
        },
        sends: [
          { bus: 'reverb', amount: -10 }  // More reverb
        ]
      }
      // Other channels inherit from classic
    },
    buses: [
      {
        name: 'reverb',
        type: 'reverb',
        settings: {
          roomSize: 0.6,     // Larger room
          damping: 0.5,
          wetLevel: 0.35,
          predelay: 30
        },
        volume: -10
      }
    ],
    master: {
      limiter: {
        ceiling: -0.3,
        release: 120
      },
      eq: {
        bands: [
          { frequency: 25, gain: 0, q: 1, type: 'highpass' },
          { frequency: 12000, gain: 1, q: 1, type: 'highshelf' }  // More air
        ]
      },
      stereoWidth: 1.15,   // Wider
      targetLUFS: -13
    }
  },
  
  'durban-hard': {
    channels: {
      'log-drum': {
        volume: 0,         // Very prominent
        eq: {
          bands: [
            { frequency: 45, gain: 4, q: 1, type: 'peaking' },
            { frequency: 150, gain: -3, q: 2, type: 'peaking' },
            { frequency: 3000, gain: 3, q: 1.5, type: 'peaking' }
          ]
        },
        compression: {
          threshold: -10,
          ratio: 6,
          attack: 5,
          release: 60,
          knee: 3,
          makeupGain: 4
        }
      },
      'kick': {
        volume: -4,
        sidechain: {
          source: 'log-drum',
          amount: 60,       // Heavy sidechain
          attack: 2,
          release: 60,
          curve: 'linear'
        }
      }
    },
    buses: [],
    master: {
      limiter: {
        ceiling: -0.1,
        release: 80
      },
      eq: {
        bands: [
          { frequency: 35, gain: 0, q: 1, type: 'highpass' }
        ]
      },
      stereoWidth: 1.0,
      targetLUFS: -12       // Louder
    }
  }
};

// ============================================================================\\
// MIXING AGENT IMPLEMENTATION
// ============================================================================\\

export class MixingAgent extends BaseAgent {
  private currentMix: {
    channels: Map<string, ChannelConfig>;
    buses: MixBus[];
    master: MasterConfig;
  } | null = null;
  
  constructor() {
    super('mixing', {
      maxActionsPerExecution: 25,
      timeoutMs: 20000
    });
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.setStatus('generating');
    this.setCurrentTask('Creating mix configuration');
    
    try {
      const { genre, region, bpm } = context.request;
      const previousOutputs = context.previousOutputs;
      
      // Step 1: Select mix template
      this.setProgress(15);
      const template = this.selectMixTemplate(genre as string, region);
      this.recordAction('select_template', { template: genre });
      
      // Step 2: Build channel configuration
      this.setProgress(30);
      const channels = this.buildChannelConfig(template, previousOutputs);
      this.recordAction('build_channels', { count: channels.size });
      
      // Step 3: Configure sidechain
      this.setProgress(45);
      this.configureSidechain(channels, genre as string);
      this.recordAction('configure_sidechain', { enabled: true });
      
      // Step 4: Set up buses
      this.setProgress(60);
      const buses = this.configureBuses(template, bpm as number || 115);
      this.recordAction('configure_buses', { count: buses.length });
      
      // Step 5: Configure master
      this.setProgress(75);
      const master = this.configureMaster(template, genre as string);
      this.recordAction('configure_master', { targetLUFS: master.targetLUFS });
      
      // Step 6: Balance levels
      this.setProgress(90);
      this.balanceLevels(channels);
      this.recordAction('balance_levels', { balanced: true });
      
      this.setProgress(100);
      this.setStatus('complete');
      
      this.currentMix = { channels, buses, master };
      
      return {
        success: true,
        output: {
          channels: Object.fromEntries(channels),
          buses,
          master,
          mixPreset: genre
        },
        actions: this.actionHistory.slice(-6),
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      this.setStatus('error');
      return {
        success: false,
        output: null,
        actions: this.actionHistory,
        duration: Date.now() - startTime,
        notes: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async evaluate(output: unknown): Promise<EvaluationResult> {
    const result = output as {
      channels: Record<string, ChannelConfig>;
      master: MasterConfig;
    };
    
    const components: Record<string, number> = {};
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Evaluate frequency balance
    const freqBalance = this.evaluateFrequencyBalance(result.channels);
    components['frequency_balance'] = freqBalance;
    if (freqBalance < 0.6) {
      issues.push('Frequency balance is off');
      suggestions.push('Check low-end separation between log drum and bass');
    }
    
    // Evaluate dynamic control
    const dynamics = this.evaluateDynamics(result.channels);
    components['dynamic_control'] = dynamics;
    if (dynamics < 0.5) {
      issues.push('Dynamics not controlled well');
      suggestions.push('Adjust compression settings');
    }
    
    // Evaluate sidechain effectiveness
    const sidechain = this.evaluateSidechain(result.channels);
    components['sidechain_pump'] = sidechain;
    if (sidechain < 0.6) {
      issues.push('Sidechain pump is weak');
      suggestions.push('Increase sidechain amount on bass and kick');
    }
    
    // Evaluate stereo image
    const stereo = this.evaluateStereoImage(result.channels);
    components['stereo_image'] = stereo;
    if (stereo < 0.5) {
      issues.push('Stereo image too narrow');
      suggestions.push('Pan elements wider');
    }
    
    const score = (
      freqBalance * 0.3 + 
      dynamics * 0.25 + 
      sidechain * 0.25 + 
      stereo * 0.2
    ) * 100;
    
    return {
      score,
      passed: score >= 70,
      components,
      issues,
      suggestions
    };
  }

  async improve(feedback: EvaluationResult): Promise<ImprovementPlan> {
    const actions: ImprovementPlan['actions'] = [];
    
    if (feedback.components['frequency_balance'] < 0.6) {
      actions.push({
        type: 'adjust_low_end',
        parameters: {
          logDrumBoost: 2,
          bassHighpass: 40,
          kickDuck: 4
        },
        expectedImprovement: 10
      });
    }
    
    if (feedback.components['sidechain_pump'] < 0.6) {
      actions.push({
        type: 'increase_sidechain',
        parameters: { amount: 15, releaseDecrease: 20 },
        expectedImprovement: 12
      });
    }
    
    if (feedback.components['stereo_image'] < 0.5) {
      actions.push({
        type: 'widen_stereo',
        parameters: {
          hihatPan: 0.3,
          shakerPan: -0.35,
          masterWidth: 1.15
        },
        expectedImprovement: 8
      });
    }
    
    return {
      actions,
      estimatedNewScore: feedback.score + actions.reduce((sum, a) => sum + a.expectedImprovement, 0)
    };
  }

  // ============================================================================\\
  // PRIVATE METHODS
  // ============================================================================\\

  private selectMixTemplate(genre: string, region?: string): typeof AMAPIANO_MIX_TEMPLATES[string] {
    const genreLower = genre.toLowerCase();
    
    if (genreLower.includes('private') || genreLower.includes('school')) {
      return AMAPIANO_MIX_TEMPLATES['private-school-soulful'];
    }
    if (genreLower.includes('bacardi') || region === 'durban') {
      return AMAPIANO_MIX_TEMPLATES['durban-hard'];
    }
    
    return AMAPIANO_MIX_TEMPLATES['johannesburg-classic'];
  }

  private buildChannelConfig(
    template: typeof AMAPIANO_MIX_TEMPLATES[string],
    previousOutputs?: Map<string, unknown>
  ): Map<string, ChannelConfig> {
    const channels = new Map<string, ChannelConfig>();
    
    // Standard Amapiano channels
    const channelNames = ['log-drum', 'kick', 'snare', 'hihat', 'shaker', 'bass', 'piano', 'pads', 'vocals'];
    
    for (const name of channelNames) {
      const templateConfig = template.channels[name] || {};
      
      channels.set(name, {
        name,
        volume: templateConfig.volume ?? -12,
        pan: templateConfig.pan ?? 0,
        eq: templateConfig.eq ?? { bands: [] },
        compression: templateConfig.compression ?? {
          threshold: -20,
          ratio: 2,
          attack: 20,
          release: 100,
          knee: 6,
          makeupGain: 0
        },
        sidechain: templateConfig.sidechain,
        sends: templateConfig.sends ?? []
      });
    }
    
    return channels;
  }

  private configureSidechain(
    channels: Map<string, ChannelConfig>,
    genre: string
  ): void {
    const genreLower = genre.toLowerCase();
    
    // Sidechain intensity varies by genre
    let sidechainAmount = 40;
    if (genreLower.includes('private') || genreLower.includes('school')) {
      sidechainAmount = 30;  // Subtler
    } else if (genreLower.includes('bacardi') || genreLower.includes('durban')) {
      sidechainAmount = 60;  // Heavy
    }
    
    // Apply sidechain to bass and kick from log drum
    const bass = channels.get('bass');
    if (bass) {
      bass.sidechain = {
        source: 'log-drum',
        amount: sidechainAmount,
        attack: 5,
        release: 100,
        curve: 'exponential'
      };
    }
    
    const kick = channels.get('kick');
    if (kick) {
      kick.sidechain = {
        source: 'log-drum',
        amount: sidechainAmount - 10,
        attack: 5,
        release: 80,
        curve: 'exponential'
      };
    }
  }

  private configureBuses(
    template: typeof AMAPIANO_MIX_TEMPLATES[string],
    bpm: number
  ): MixBus[] {
    const buses = [...template.buses];
    
    // Adjust delay time to match BPM
    const delayBus = buses.find(b => b.type === 'delay');
    if (delayBus) {
      const msPerBeat = 60000 / bpm;
      delayBus.settings.time = msPerBeat / 2;  // 1/8 note
    }
    
    return buses;
  }

  private configureMaster(
    template: typeof AMAPIANO_MIX_TEMPLATES[string],
    genre: string
  ): MasterConfig {
    return { ...template.master };
  }

  private balanceLevels(channels: Map<string, ChannelConfig>): void {
    // Log drum should be loudest low-end element
    const logDrum = channels.get('log-drum');
    const bass = channels.get('bass');
    const kick = channels.get('kick');
    
    if (logDrum && bass && kick) {
      // Ensure proper hierarchy
      if (bass.volume >= logDrum.volume) {
        bass.volume = logDrum.volume - 4;
      }
      if (kick.volume >= logDrum.volume) {
        kick.volume = logDrum.volume - 3;
      }
    }
  }

  private evaluateFrequencyBalance(channels: Record<string, ChannelConfig>): number {
    let score = 0.5;
    
    // Check log drum is loudest in low end
    const logDrum = channels['log-drum'];
    const bass = channels['bass'];
    
    if (logDrum && bass && logDrum.volume > bass.volume) {
      score += 0.3;
    }
    
    // Check high-pass on non-bass elements
    const piano = channels['piano'];
    if (piano?.eq.bands.some(b => b.type === 'highpass' && b.frequency >= 100)) {
      score += 0.2;
    }
    
    return score;
  }

  private evaluateDynamics(channels: Record<string, ChannelConfig>): number {
    let score = 0.5;
    
    // Check compression on key elements
    const logDrum = channels['log-drum'];
    if (logDrum?.compression.ratio >= 3 && logDrum.compression.ratio <= 6) {
      score += 0.25;
    }
    
    const bass = channels['bass'];
    if (bass?.compression.ratio >= 3) {
      score += 0.25;
    }
    
    return score;
  }

  private evaluateSidechain(channels: Record<string, ChannelConfig>): number {
    let score = 0;
    
    const bass = channels['bass'];
    if (bass?.sidechain && bass.sidechain.amount >= 30) {
      score += 0.5;
    }
    
    const kick = channels['kick'];
    if (kick?.sidechain && kick.sidechain.amount >= 20) {
      score += 0.5;
    }
    
    return score;
  }

  private evaluateStereoImage(channels: Record<string, ChannelConfig>): number {
    let score = 0.5;
    
    // Check pan positions
    const hihat = channels['hihat'];
    const shaker = channels['shaker'];
    
    if (hihat && Math.abs(hihat.pan) >= 0.1) {
      score += 0.25;
    }
    if (shaker && Math.abs(shaker.pan) >= 0.1 && shaker.pan !== hihat?.pan) {
      score += 0.25;
    }
    
    return score;
  }
}
