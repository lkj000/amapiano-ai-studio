/**
 * AuraBridge - Unified API Service Layer
 * Provides centralized interface for all backend communications with monitoring and error handling
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface APICallOptions {
  function_name: string;
  body?: any;
  requiresAuth?: boolean;
  timeout?: number;
}

interface APIMetrics {
  latency: number;
  success: boolean;
  timestamp: number;
  functionName: string;
  error?: string;
}

class AuraBridgeService {
  private metrics: APIMetrics[] = [];
  private readonly MAX_METRICS = 1000;

  /**
   * Unified API call handler with automatic monitoring and error handling
   */
  async call<T = any>(options: APICallOptions): Promise<T> {
    const startTime = performance.now();
    const { function_name, body, requiresAuth = true, timeout = 30000 } = options;

    try {
      // Check authentication if required
      if (requiresAuth) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Authentication required");
        }
      }

      // Make the API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const { data, error } = await supabase.functions.invoke(function_name, {
        body,
      });

      clearTimeout(timeoutId);

      if (error) throw error;

      // Record successful metrics
      const latency = performance.now() - startTime;
      this.recordMetric({
        latency,
        success: true,
        timestamp: Date.now(),
        functionName: function_name,
      });

      return data as T;
    } catch (error: any) {
      const latency = performance.now() - startTime;
      
      // Record failed metrics
      this.recordMetric({
        latency,
        success: false,
        timestamp: Date.now(),
        functionName: function_name,
        error: error.message,
      });

      // Handle specific error cases
      if (error.message?.includes("429")) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Too many requests. Please try again later.",
          variant: "destructive",
        });
      } else if (error.message?.includes("402")) {
        toast({
          title: "Payment Required",
          description: "Please add credits to continue using AI features.",
          variant: "destructive",
        });
      } else {
        console.error(`AuraBridge error [${function_name}]:`, error);
        toast({
          title: "API Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }

      throw error;
    }
  }

  /**
   * Record API call metrics for monitoring
   */
  private recordMetric(metric: APIMetrics) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Store in localStorage for persistence across sessions
    try {
      const recentMetrics = this.metrics.slice(-100);
      localStorage.setItem('aura_bridge_metrics', JSON.stringify(recentMetrics));
    } catch (e) {
      console.warn('Failed to store metrics:', e);
    }
  }

  /**
   * Get aggregated metrics for monitoring dashboard
   */
  getMetrics() {
    const now = Date.now();
    const last5Minutes = this.metrics.filter(m => now - m.timestamp < 5 * 60 * 1000);
    
    const total = last5Minutes.length;
    const successful = last5Minutes.filter(m => m.success).length;
    const failed = total - successful;
    const avgLatency = total > 0 
      ? last5Minutes.reduce((sum, m) => sum + m.latency, 0) / total 
      : 0;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 100,
      avgLatency: Math.round(avgLatency),
      recentCalls: last5Minutes.slice(-20),
    };
  }

  /**
   * Get metrics grouped by function
   */
  getMetricsByFunction() {
    const grouped = new Map<string, APIMetrics[]>();
    
    this.metrics.forEach(metric => {
      if (!grouped.has(metric.functionName)) {
        grouped.set(metric.functionName, []);
      }
      grouped.get(metric.functionName)!.push(metric);
    });

    return Array.from(grouped.entries()).map(([name, metrics]) => ({
      functionName: name,
      callCount: metrics.length,
      avgLatency: Math.round(metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length),
      successRate: (metrics.filter(m => m.success).length / metrics.length) * 100,
    }));
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics() {
    this.metrics = [];
    localStorage.removeItem('aura_bridge_metrics');
  }
}

// Export singleton instance
export const AuraBridge = new AuraBridgeService();
