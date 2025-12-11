/**
 * Scheduled Agent Heartbeat
 * Proactive task nudges and health monitoring
 */

export interface HeartbeatConfig {
  interval: number; // milliseconds
  judgeInterval: number; // How often to run judge evaluation
  onBeat: () => void | Promise<void>;
  onJudge?: () => void | Promise<void>;
}

export interface HeartbeatStats {
  totalBeats: number;
  totalJudgeEvaluations: number;
  lastBeatAt: number;
  lastJudgeAt: number;
  missedBeats: number;
  isRunning: boolean;
}

export class ScheduledAgentHeartbeat {
  private config: HeartbeatConfig;
  private beatInterval: NodeJS.Timeout | null = null;
  private judgeInterval: NodeJS.Timeout | null = null;
  private stats: HeartbeatStats = {
    totalBeats: 0,
    totalJudgeEvaluations: 0,
    lastBeatAt: 0,
    lastJudgeAt: 0,
    missedBeats: 0,
    isRunning: false
  };

  constructor(config: HeartbeatConfig) {
    this.config = {
      interval: config.interval || 30000, // 30s default
      judgeInterval: config.judgeInterval || 300000, // 5min default
      onBeat: config.onBeat,
      onJudge: config.onJudge
    };
  }

  start(): void {
    if (this.stats.isRunning) return;

    this.stats.isRunning = true;

    // Start heartbeat
    this.beatInterval = setInterval(async () => {
      try {
        await this.config.onBeat();
        this.stats.totalBeats++;
        this.stats.lastBeatAt = Date.now();
      } catch (error) {
        console.error('Heartbeat failed:', error);
        this.stats.missedBeats++;
      }
    }, this.config.interval);

    // Start judge evaluations
    if (this.config.onJudge) {
      this.judgeInterval = setInterval(async () => {
        try {
          await this.config.onJudge!();
          this.stats.totalJudgeEvaluations++;
          this.stats.lastJudgeAt = Date.now();
        } catch (error) {
          console.error('Judge evaluation failed:', error);
        }
      }, this.config.judgeInterval);
    }

    // Initial beat
    const result = this.config.onBeat();
    if (result && typeof result.catch === 'function') {
      result.catch(console.error);
    }
  }

  stop(): void {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
    if (this.judgeInterval) {
      clearInterval(this.judgeInterval);
      this.judgeInterval = null;
    }
    this.stats.isRunning = false;
  }

  getStats(): HeartbeatStats {
    return { ...this.stats };
  }

  isRunning(): boolean {
    return this.stats.isRunning;
  }

  /**
   * Trigger an immediate beat
   */
  async triggerBeat(): Promise<void> {
    await this.config.onBeat();
    this.stats.totalBeats++;
    this.stats.lastBeatAt = Date.now();
  }

  /**
   * Trigger an immediate judge evaluation
   */
  async triggerJudge(): Promise<void> {
    if (this.config.onJudge) {
      await this.config.onJudge();
      this.stats.totalJudgeEvaluations++;
      this.stats.lastJudgeAt = Date.now();
    }
  }

  /**
   * Update heartbeat configuration
   */
  updateConfig(config: Partial<HeartbeatConfig>): void {
    const wasRunning = this.stats.isRunning;
    
    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...config };

    if (wasRunning) {
      this.start();
    }
  }
}
