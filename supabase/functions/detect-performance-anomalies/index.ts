/**
 * Performance Anomaly Detection Edge Function
 * 
 * Uses statistical analysis (z-score) to detect anomalies in:
 * - Latency spikes
 * - CPU usage patterns
 * - Cost anomalies
 * - Throughput drops
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricData {
  value: number;
  created_at: string;
  metadata: any;
}

// Z-score threshold for anomaly detection (3 standard deviations)
const Z_SCORE_THRESHOLD = 3.0;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { metric_type = 'latency', window_hours = 24 } = await req.json();

    console.log(`[Anomaly Detection] Analyzing ${metric_type} for user ${user.id}`);

    // Fetch recent metrics
    const cutoffTime = new Date(Date.now() - window_hours * 60 * 60 * 1000).toISOString();
    
    const { data: metrics, error: metricsError } = await supabaseClient
      .from('performance_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('metric_type', metric_type)
      .gte('created_at', cutoffTime)
      .order('created_at', { ascending: true });

    if (metricsError) {
      throw metricsError;
    }

    if (!metrics || metrics.length < 10) {
      console.log('[Anomaly Detection] Insufficient data for analysis');
      return new Response(
        JSON.stringify({ 
          anomalies: [], 
          message: 'Insufficient data for anomaly detection (minimum 10 data points required)' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate statistical metrics
    const values = metrics.map((m: MetricData) => m.value);
    const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    console.log(`[Anomaly Detection] Stats - Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`);

    // Detect anomalies using z-score
    const anomalies = [];
    for (const metric of metrics) {
      const zScore = stdDev === 0 ? 0 : Math.abs((metric.value - mean) / stdDev);
      
      if (zScore > Z_SCORE_THRESHOLD) {
        const severity = zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium';
        const percentageDiff = ((metric.value - mean) / mean * 100).toFixed(1);
        
        anomalies.push({
          timestamp: metric.created_at,
          value: metric.value,
          z_score: zScore.toFixed(2),
          severity,
          description: `${metric_type} spike: ${metric.value.toFixed(2)} (${percentageDiff}% ${metric.value > mean ? 'above' : 'below'} baseline of ${mean.toFixed(2)})`,
          metadata: metric.metadata
        });

        console.log(`[Anomaly Detection] Found anomaly: z-score ${zScore.toFixed(2)}, value ${metric.value}`);
      }
    }

    // Store detected anomalies in database
    if (anomalies.length > 0) {
      for (const anomaly of anomalies) {
        const { error: insertError } = await supabaseClient
          .from('performance_anomalies')
          .insert({
            user_id: user.id,
            anomaly_type: metric_type,
            severity: anomaly.severity,
            description: anomaly.description,
            metrics: {
              value: anomaly.value,
              z_score: anomaly.z_score,
              baseline_mean: mean,
              baseline_std_dev: stdDev,
              timestamp: anomaly.timestamp
            }
          });

        if (insertError) {
          console.error('[Anomaly Detection] Error storing anomaly:', insertError);
        }
      }
    }

    console.log(`[Anomaly Detection] Detected ${anomalies.length} anomalies`);

    return new Response(
      JSON.stringify({ 
        anomalies,
        stats: {
          mean: mean.toFixed(2),
          std_dev: stdDev.toFixed(2),
          data_points: metrics.length,
          window_hours
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Anomaly Detection] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
