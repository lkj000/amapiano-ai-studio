/**
 * Performance Report Generation Edge Function
 * 
 * Generates CSV/JSON performance reports with:
 * - Latency trends
 * - Cost analysis
 * - WASM savings
 * - Anomaly summary
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { format = 'csv', period_days = 30 } = await req.json();

    console.log(`[Report Generation] Generating ${format} report for user ${user.id}, period: ${period_days} days`);

    const cutoffTime = new Date(Date.now() - period_days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all metrics
    const { data: metrics, error: metricsError } = await supabaseClient
      .from('performance_metrics')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', cutoffTime)
      .order('created_at', { ascending: true });

    if (metricsError) {
      throw metricsError;
    }

    // Fetch anomalies
    const { data: anomalies, error: anomaliesError } = await supabaseClient
      .from('performance_anomalies')
      .select('*')
      .eq('user_id', user.id)
      .gte('detected_at', cutoffTime)
      .order('detected_at', { ascending: false });

    if (anomaliesError) {
      throw anomaliesError;
    }

    // Calculate aggregated metrics
    const latencyMetrics = metrics?.filter(m => m.metric_type === 'latency') || [];
    const costMetrics = metrics?.filter(m => m.metric_type === 'cost') || [];
    const wasmMetrics = metrics?.filter(m => m.method === 'wasm') || [];
    const jsMetrics = metrics?.filter(m => m.method === 'js') || [];

    const avgLatency = latencyMetrics.length > 0
      ? latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length
      : 0;

    const totalCost = costMetrics.reduce((sum, m) => sum + m.value, 0);

    const wasmSavings = jsMetrics.reduce((sum, m) => {
      const jsC cost = m.value * 0.0029; // JS cost per second
      const wasmCost = m.value * 0.001; // WASM cost per second
      return sum + (jsCost - wasmCost);
    }, 0);

    const report = {
      generated_at: new Date().toISOString(),
      period_days,
      summary: {
        total_generations: metrics?.length || 0,
        avg_latency_ms: avgLatency.toFixed(2),
        total_cost_dollars: (totalCost).toFixed(2),
        wasm_savings_dollars: wasmSavings.toFixed(2),
        wasm_usage_percent: metrics && metrics.length > 0
          ? ((wasmMetrics.length / metrics.length) * 100).toFixed(1)
          : '0',
        anomalies_detected: anomalies?.length || 0,
        critical_anomalies: anomalies?.filter(a => a.severity === 'critical').length || 0
      },
      latency_trend: latencyMetrics.map(m => ({
        timestamp: m.created_at,
        value: m.value,
        method: m.method
      })),
      cost_trend: costMetrics.map(m => ({
        timestamp: m.created_at,
        value: m.value,
        method: m.method
      })),
      anomalies: anomalies?.map(a => ({
        timestamp: a.detected_at,
        type: a.anomaly_type,
        severity: a.severity,
        description: a.description
      })) || []
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvLines = [
        'Performance Report',
        `Generated: ${report.generated_at}`,
        `Period: ${period_days} days`,
        '',
        'SUMMARY',
        `Total Generations,${report.summary.total_generations}`,
        `Average Latency (ms),${report.summary.avg_latency_ms}`,
        `Total Cost ($),${report.summary.total_cost_dollars}`,
        `WASM Savings ($),${report.summary.wasm_savings_dollars}`,
        `WASM Usage (%),${report.summary.wasm_usage_percent}`,
        `Anomalies Detected,${report.summary.anomalies_detected}`,
        `Critical Anomalies,${report.summary.critical_anomalies}`,
        '',
        'LATENCY TREND',
        'Timestamp,Value (ms),Method',
        ...report.latency_trend.map(l => `${l.timestamp},${l.value},${l.method}`),
        '',
        'COST TREND',
        'Timestamp,Value ($),Method',
        ...report.cost_trend.map(c => `${c.timestamp},${c.value},${c.method}`),
        '',
        'ANOMALIES',
        'Timestamp,Type,Severity,Description',
        ...report.anomalies.map(a => `${a.timestamp},${a.type},${a.severity},"${a.description}"`)
      ];

      const csvContent = csvLines.join('\n');

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="performance-report-${Date.now()}.csv"`
        }
      });
    }

    // JSON format
    return new Response(
      JSON.stringify(report, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="performance-report-${Date.now()}.json"`
        }
      }
    );

  } catch (error) {
    console.error('[Report Generation] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
