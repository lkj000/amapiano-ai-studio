/**
 * Mixing Agent
 * 
 * Specialized agent for mixing, levels, EQ, compression, and spatial placement.
 * Implements the "Amapiano Mix Standard" with log drum priority and auto-sidechaining.
 * 
 * Mix template data lives in ./mixPresets.ts — this file is agent logic only.
 */

import { BaseAgent, ExecutionContext, ExecutionResult, EvaluationResult, ImprovementPlan } from './BaseAgent';
import {
  type ChannelConfig,
  type MixBus,
  type MasterConfig,
  type MixTemplate,
  AMAPIANO_MIX_TEMPLATES,
} from './mixPresets';

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

  private selectMixTemplate(genre: string, region?: string): MixTemplate {
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
    template: MixTemplate,
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
    template: MixTemplate,
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
    template: MixTemplate,
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
