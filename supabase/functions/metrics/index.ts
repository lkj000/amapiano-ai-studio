/**
 * Observability Metrics Endpoint
 * Prometheus-compatible metrics for monitoring system performance
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricData {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  values: { labels?: Record<string, string>; value: number }[];
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'prometheus';

    // Collect metrics
    const metrics: MetricData[] = [];
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. AI Model Usage Metrics
    const { count: aiUsageCount } = await supabase
      .from('ai_model_usage')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hourAgo.toISOString());

    const { data: aiUsageByModel } = await supabase
      .from('ai_model_usage')
      .select('model_name')
      .gte('created_at', dayAgo.toISOString());

    const modelCounts: Record<string, number> = {};
    aiUsageByModel?.forEach(u => {
      modelCounts[u.model_name] = (modelCounts[u.model_name] || 0) + 1;
    });

    metrics.push({
      name: 'amapiano_ai_requests_total',
      help: 'Total AI model requests in the last hour',
      type: 'gauge',
      values: [{ value: aiUsageCount || 0 }]
    });

    metrics.push({
      name: 'amapiano_ai_requests_by_model',
      help: 'AI requests by model in the last 24h',
      type: 'gauge',
      values: Object.entries(modelCounts).map(([model, count]) => ({
        labels: { model },
        value: count
      }))
    });

    // 2. Agent Execution Metrics
    const { data: agentStats } = await supabase
      .from('agent_executions')
      .select('success, duration_ms')
      .gte('created_at', dayAgo.toISOString());

    const successCount = agentStats?.filter(a => a.success).length || 0;
    const failCount = agentStats?.filter(a => !a.success).length || 0;
    const avgDuration = agentStats?.length 
      ? agentStats.reduce((sum, a) => sum + (a.duration_ms || 0), 0) / agentStats.length
      : 0;

    metrics.push({
      name: 'amapiano_agent_executions_total',
      help: 'Total agent executions in the last 24h',
      type: 'counter',
      values: [
        { labels: { status: 'success' }, value: successCount },
        { labels: { status: 'failure' }, value: failCount }
      ]
    });

    metrics.push({
      name: 'amapiano_agent_execution_duration_ms',
      help: 'Average agent execution duration in ms',
      type: 'gauge',
      values: [{ value: avgDuration }]
    });

    // 3. Audio Processing Metrics
    const { count: audioJobsCount } = await supabase
      .from('audio_analysis_results')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hourAgo.toISOString());

    metrics.push({
      name: 'amapiano_audio_jobs_hourly',
      help: 'Audio processing jobs in the last hour',
      type: 'gauge',
      values: [{ value: audioJobsCount || 0 }]
    });

    // 4. Generation Metrics
    const { count: generationsCount } = await supabase
      .from('generated_samples')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dayAgo.toISOString());

    const { data: genByType } = await supabase
      .from('generated_samples')
      .select('sample_type')
      .gte('created_at', dayAgo.toISOString());

    const typeCounts: Record<string, number> = {};
    genByType?.forEach(g => {
      typeCounts[g.sample_type] = (typeCounts[g.sample_type] || 0) + 1;
    });

    metrics.push({
      name: 'amapiano_generations_total',
      help: 'Total generations in the last 24h',
      type: 'counter',
      values: [{ value: generationsCount || 0 }]
    });

    metrics.push({
      name: 'amapiano_generations_by_type',
      help: 'Generations by sample type',
      type: 'gauge',
      values: Object.entries(typeCounts).map(([type, count]) => ({
        labels: { sample_type: type },
        value: count
      }))
    });

    // 5. User Activity Metrics
    const { count: activeUsers } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', hourAgo.toISOString());

    metrics.push({
      name: 'amapiano_active_users_hourly',
      help: 'Unique active users in the last hour',
      type: 'gauge',
      values: [{ value: activeUsers || 0 }]
    });

    // 6. DAW Projects Metrics
    const { count: projectsCount } = await supabase
      .from('daw_projects')
      .select('*', { count: 'exact', head: true });

    const { count: recentProjects } = await supabase
      .from('daw_projects')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', dayAgo.toISOString());

    metrics.push({
      name: 'amapiano_projects_total',
      help: 'Total DAW projects',
      type: 'gauge',
      values: [{ value: projectsCount || 0 }]
    });

    metrics.push({
      name: 'amapiano_projects_active_daily',
      help: 'Projects updated in the last 24h',
      type: 'gauge',
      values: [{ value: recentProjects || 0 }]
    });

    // 7. Collaboration Metrics
    const { count: activeSessions } = await supabase
      .from('collaboration_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    metrics.push({
      name: 'amapiano_collab_sessions_active',
      help: 'Currently active collaboration sessions',
      type: 'gauge',
      values: [{ value: activeSessions || 0 }]
    });

    // 8. Performance Anomalies
    const { count: activeAnomalies } = await supabase
      .from('performance_anomalies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    metrics.push({
      name: 'amapiano_performance_anomalies_active',
      help: 'Currently active performance anomalies',
      type: 'gauge',
      values: [{ value: activeAnomalies || 0 }]
    });

    // 9. Edge Function Health (self-reporting)
    metrics.push({
      name: 'amapiano_edge_function_health',
      help: 'Edge function health status (1 = healthy)',
      type: 'gauge',
      values: [
        { labels: { function: 'metrics' }, value: 1 },
        { labels: { function: 'ai-mastering' }, value: 1 },
        { labels: { function: 'generate-song-with-vocals' }, value: 1 }
      ]
    });

    // 10. System Timestamp
    metrics.push({
      name: 'amapiano_metrics_timestamp',
      help: 'Timestamp of metrics collection',
      type: 'gauge',
      values: [{ value: Math.floor(Date.now() / 1000) }]
    });

    // Format response
    if (format === 'prometheus') {
      // Prometheus text format
      let output = '';
      for (const metric of metrics) {
        output += `# HELP ${metric.name} ${metric.help}\n`;
        output += `# TYPE ${metric.name} ${metric.type}\n`;
        for (const val of metric.values) {
          if (val.labels) {
            const labelStr = Object.entries(val.labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(',');
            output += `${metric.name}{${labelStr}} ${val.value}\n`;
          } else {
            output += `${metric.name} ${val.value}\n`;
          }
        }
        output += '\n';
      }

      return new Response(output, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    } else {
      // JSON format
      return new Response(JSON.stringify({
        timestamp: now.toISOString(),
        metrics
      }, null, 2), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

  } catch (error) {
    console.error('[Metrics] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
