/**
 * Realtime Performance Monitoring Hook
 * 
 * Uses Supabase Realtime to broadcast and receive performance metrics
 * across all connected users for collaborative monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PerformanceMetric {
  id: string;
  user_id: string;
  metric_type: 'latency' | 'cpu' | 'throughput' | 'cost';
  value: number;
  method?: 'wasm' | 'js';
  metadata: any;
  created_at: string;
}

export interface PerformanceAnomaly {
  id: string;
  user_id: string;
  anomaly_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: any;
  detected_at: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export function useRealtimePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [anomalies, setAnomalies] = useState<PerformanceAnomaly[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    let metricsChannel: RealtimeChannel | null = null;

    const setupRealtimeConnection = async () => {
      try {
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.warn('[Realtime] User not authenticated, skipping setup');
          setIsConnected(false);
          return;
        }

        // Subscribe to performance metrics changes
        metricsChannel = supabase
          .channel('performance-monitoring')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'performance_metrics'
            },
            (payload) => {
              console.log('[Realtime] New metric:', payload.new);
              setMetrics(prev => [...prev.slice(-99), payload.new as PerformanceMetric]);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'performance_anomalies'
            },
            (payload) => {
              console.log('[Realtime] New anomaly detected:', payload.new);
              setAnomalies(prev => [payload.new as PerformanceAnomaly, ...prev]);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'performance_anomalies'
            },
            (payload) => {
              console.log('[Realtime] Anomaly updated:', payload.new);
              setAnomalies(prev => 
                prev.map(a => a.id === (payload.new as PerformanceAnomaly).id ? payload.new as PerformanceAnomaly : a)
              );
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] Connection status:', status);
            setIsConnected(status === 'SUBSCRIBED');
          });

        setChannel(metricsChannel);

        // Load initial metrics
        const { data: recentMetrics } = await supabase
          .from('performance_metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (recentMetrics) {
          setMetrics(recentMetrics.reverse() as PerformanceMetric[]);
        }

        const { data: activeAnomalies } = await supabase
          .from('performance_anomalies')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('detected_at', { ascending: false })
          .limit(50);

        if (activeAnomalies) {
          setAnomalies(activeAnomalies as PerformanceAnomaly[]);
        }
      } catch (error) {
        console.error('[Realtime] Setup error:', error);
      }
    };

    setupRealtimeConnection();

    return () => {
      if (metricsChannel) {
        supabase.removeChannel(metricsChannel);
      }
    };
  }, []);

  const recordMetric = useCallback(async (
    metric_type: PerformanceMetric['metric_type'],
    value: number,
    method?: 'wasm' | 'js',
    metadata: any = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          user_id: user.id,
          metric_type,
          value,
          method,
          metadata
        });

      if (error) throw error;

      console.log('[Realtime] Metric recorded:', { metric_type, value });
    } catch (error) {
      console.error('[Realtime] Error recording metric:', error);
    }
  }, []);

  const acknowledgeAnomaly = useCallback(async (anomalyId: string) => {
    try {
      const anomaly = anomalies.find(a => a.id === anomalyId);
      
      const { error } = await supabase
        .from('performance_anomalies')
        .update({ status: 'acknowledged' })
        .eq('id', anomalyId);

      if (error) throw error;

      console.log('[Realtime] Anomaly acknowledged:', anomalyId);
      
      // Send notification for critical anomalies
      if (anomaly && anomaly.severity === 'critical' && anomaly.status === 'active') {
        try {
          await supabase.functions.invoke('send-performance-alert', {
            body: {
              anomaly_id: anomalyId,
              notification_type: 'email'
            }
          });
        } catch (notifyError) {
          console.error('[Realtime] Failed to send notification:', notifyError);
        }
      }
    } catch (error) {
      console.error('[Realtime] Error acknowledging anomaly:', error);
    }
  }, [anomalies]);

  const resolveAnomaly = useCallback(async (anomalyId: string) => {
    try {
      const { error } = await supabase
        .from('performance_anomalies')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', anomalyId);

      if (error) throw error;

      console.log('[Realtime] Anomaly resolved:', anomalyId);
    } catch (error) {
      console.error('[Realtime] Error resolving anomaly:', error);
    }
  }, []);

  const detectAnomalies = useCallback(async (
    metric_type: string = 'latency',
    window_hours: number = 24
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('detect-performance-anomalies', {
        body: { metric_type, window_hours }
      });

      if (error) throw error;

      console.log('[Realtime] Anomaly detection complete:', data);
      return data;
    } catch (error) {
      console.error('[Realtime] Error detecting anomalies:', error);
      throw error;
    }
  }, []);

  const generateReport = useCallback(async (
    format: 'csv' | 'json' = 'csv',
    period_days: number = 30
  ) => {
    try {
      const response = await supabase.functions.invoke('generate-performance-report', {
        body: { format, period_days }
      });

      if (response.error) throw response.error;

      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-report-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('[Realtime] Report downloaded');
    } catch (error) {
      console.error('[Realtime] Error generating report:', error);
      throw error;
    }
  }, []);

  return {
    metrics,
    anomalies,
    isConnected,
    recordMetric,
    acknowledgeAnomaly,
    resolveAnomaly,
    detectAnomalies,
    generateReport,
  };
}
