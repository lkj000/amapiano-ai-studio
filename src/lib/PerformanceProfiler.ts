// Performance Profiling Tools - Phase 2
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'samples' | 'hz' | '%' | 'bytes';
  timestamp: number;
  category: 'latency' | 'cpu' | 'memory' | 'throughput';
}

export interface ProfileSession {
  id: string;
  startTime: number;
  endTime?: number;
  metrics: PerformanceMetric[];
  pluginId?: string;
}

export interface OptimizationSuggestion {
  severity: 'info' | 'warning' | 'critical';
  category: 'latency' | 'cpu' | 'memory' | 'algorithm';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestedFix?: string;
}

export interface PerformanceReport {
  session: ProfileSession;
  summary: {
    avgLatency: number;
    peakLatency: number;
    avgCpu: number;
    peakCpu: number;
    memoryUsage: number;
  };
  suggestions: OptimizationSuggestion[];
  bottlenecks: string[];
}

export class PerformanceProfiler {
  private sessions: Map<string, ProfileSession> = new Map();
  private activeSession: ProfileSession | null = null;
  private markers: Map<string, number> = new Map();

  startSession(pluginId?: string): ProfileSession {
    const session: ProfileSession = {
      id: `session-${Date.now()}`,
      startTime: performance.now(),
      metrics: [],
      pluginId
    };

    this.activeSession = session;
    this.sessions.set(session.id, session);
    return session;
  }

  endSession(sessionId?: string): ProfileSession | null {
    const id = sessionId || this.activeSession?.id;
    if (!id) return null;

    const session = this.sessions.get(id);
    if (!session) return null;

    session.endTime = performance.now();
    if (this.activeSession?.id === id) {
      this.activeSession = null;
    }

    return session;
  }

  mark(name: string): void {
    this.markers.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): PerformanceMetric | null {
    const startTime = this.markers.get(startMark);
    if (!startTime) return null;

    const endTime = endMark ? this.markers.get(endMark) : performance.now();
    if (!endTime) return null;

    const metric: PerformanceMetric = {
      name,
      value: endTime - startTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'latency'
    };

    if (this.activeSession) {
      this.activeSession.metrics.push(metric);
    }

    return metric;
  }

  recordMetric(metric: PerformanceMetric): void {
    if (this.activeSession) {
      this.activeSession.metrics.push(metric);
    }
  }

  measureAudioBlock(
    blockSize: number,
    sampleRate: number,
    processingCallback: () => void
  ): PerformanceMetric {
    const start = performance.now();
    processingCallback();
    const end = performance.now();

    const processingTime = end - start;
    const availableTime = (blockSize / sampleRate) * 1000; // Convert to ms
    const cpuUsage = (processingTime / availableTime) * 100;

    const metric: PerformanceMetric = {
      name: 'Audio Block Processing',
      value: cpuUsage,
      unit: '%',
      timestamp: Date.now(),
      category: 'cpu'
    };

    this.recordMetric(metric);
    return metric;
  }

  measureMemoryUsage(): PerformanceMetric {
    const memory = (performance as any).memory;
    const usedMemory = memory ? memory.usedJSHeapSize : 0;

    const metric: PerformanceMetric = {
      name: 'Memory Usage',
      value: usedMemory,
      unit: 'bytes',
      timestamp: Date.now(),
      category: 'memory'
    };

    this.recordMetric(metric);
    return metric;
  }

  generateReport(sessionId: string): PerformanceReport | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const latencyMetrics = session.metrics.filter(m => m.category === 'latency');
    const cpuMetrics = session.metrics.filter(m => m.category === 'cpu');
    const memoryMetrics = session.metrics.filter(m => m.category === 'memory');

    const avgLatency = this.average(latencyMetrics.map(m => m.value));
    const peakLatency = Math.max(...latencyMetrics.map(m => m.value), 0);
    const avgCpu = this.average(cpuMetrics.map(m => m.value));
    const peakCpu = Math.max(...cpuMetrics.map(m => m.value), 0);
    const memoryUsage = memoryMetrics.length > 0 
      ? memoryMetrics[memoryMetrics.length - 1].value 
      : 0;

    const suggestions = this.generateSuggestions({
      avgLatency,
      peakLatency,
      avgCpu,
      peakCpu,
      memoryUsage
    });

    const bottlenecks = this.identifyBottlenecks(session);

    return {
      session,
      summary: {
        avgLatency,
        peakLatency,
        avgCpu,
        peakCpu,
        memoryUsage
      },
      suggestions,
      bottlenecks
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private generateSuggestions(summary: {
    avgLatency: number;
    peakLatency: number;
    avgCpu: number;
    peakCpu: number;
    memoryUsage: number;
  }): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Latency checks
    if (summary.avgLatency > 10) {
      suggestions.push({
        severity: 'warning',
        category: 'latency',
        title: 'High Average Latency',
        description: `Average latency of ${summary.avgLatency.toFixed(2)}ms exceeds recommended 10ms threshold`,
        impact: 'medium',
        suggestedFix: 'Consider reducing buffer size or optimizing DSP algorithms'
      });
    }

    if (summary.peakLatency > 20) {
      suggestions.push({
        severity: 'critical',
        category: 'latency',
        title: 'Excessive Peak Latency',
        description: `Peak latency of ${summary.peakLatency.toFixed(2)}ms may cause audio dropouts`,
        impact: 'high',
        suggestedFix: 'Profile and optimize hotspots in processing code'
      });
    }

    // CPU checks
    if (summary.avgCpu > 70) {
      suggestions.push({
        severity: 'warning',
        category: 'cpu',
        title: 'High CPU Usage',
        description: `Average CPU usage of ${summary.avgCpu.toFixed(1)}% leaves little headroom`,
        impact: 'high',
        suggestedFix: 'Optimize algorithms or reduce processing complexity'
      });
    }

    if (summary.peakCpu > 95) {
      suggestions.push({
        severity: 'critical',
        category: 'cpu',
        title: 'CPU Overload',
        description: `Peak CPU of ${summary.peakCpu.toFixed(1)}% will cause audio glitches`,
        impact: 'high',
        suggestedFix: 'Critical: Implement SIMD optimizations or reduce features'
      });
    }

    // Memory checks
    const memoryMB = summary.memoryUsage / (1024 * 1024);
    if (memoryMB > 100) {
      suggestions.push({
        severity: 'warning',
        category: 'memory',
        title: 'High Memory Usage',
        description: `Using ${memoryMB.toFixed(1)}MB of memory`,
        impact: 'medium',
        suggestedFix: 'Review buffer allocations and reduce memory footprint'
      });
    }

    return suggestions;
  }

  private identifyBottlenecks(session: ProfileSession): string[] {
    const bottlenecks: string[] = [];
    const metrics = session.metrics;

    // Group by metric name and find slowest operations
    const grouped = new Map<string, number[]>();
    metrics.forEach(m => {
      if (!grouped.has(m.name)) {
        grouped.set(m.name, []);
      }
      grouped.get(m.name)!.push(m.value);
    });

    // Find operations taking >50ms on average
    grouped.forEach((values, name) => {
      const avg = this.average(values);
      if (avg > 50) {
        bottlenecks.push(`${name}: ${avg.toFixed(2)}ms average`);
      }
    });

    return bottlenecks;
  }

  clearSessions(): void {
    this.sessions.clear();
    this.activeSession = null;
    this.markers.clear();
  }

  exportSession(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return JSON.stringify(session, null, 2);
  }
}

export const performanceProfiler = new PerformanceProfiler();
