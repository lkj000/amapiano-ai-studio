/**
 * Record Generation Cost Edge Function
 * 
 * Records performance metrics to database for:
 * - Cost tracking
 * - Performance monitoring
 * - Realtime updates
 * - Stripe billing integration
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cost per second of generated audio
const COST_PER_SECOND = {
  wasm: 0.001, // $0.001/second with WASM
  js: 0.0029,  // $0.0029/second with JavaScript
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

    const { 
      latency_ms,
      duration_seconds,
      method = 'js',
      generation_type = 'standard',
      metadata = {}
    } = await req.json();

    console.log(`[Cost Recording] User: ${user.id}, Latency: ${latency_ms}ms, Duration: ${duration_seconds}s, Method: ${method}`);

    // Calculate cost
    const cost = duration_seconds * COST_PER_SECOND[method as keyof typeof COST_PER_SECOND];

    // Record multiple metrics in parallel
    const metrics = [
      {
        user_id: user.id,
        metric_type: 'latency',
        value: latency_ms,
        method,
        metadata: { generation_type, duration_seconds }
      },
      {
        user_id: user.id,
        metric_type: 'cost',
        value: cost,
        method,
        metadata: { generation_type, duration_seconds, cost_per_second: COST_PER_SECOND[method as keyof typeof COST_PER_SECOND] }
      },
      {
        user_id: user.id,
        metric_type: 'throughput',
        value: 1, // 1 generation
        method,
        metadata: { generation_type, latency_ms, duration_seconds }
      }
    ];

    const { error: insertError } = await supabaseClient
      .from('performance_metrics')
      .insert(metrics);

    if (insertError) {
      throw insertError;
    }

    console.log(`[Cost Recording] Recorded 3 metrics successfully. Cost: $${cost.toFixed(4)}`);

    // Return cost breakdown
    const jsAlternativeCost = duration_seconds * COST_PER_SECOND.js;
    const savings = method === 'wasm' ? jsAlternativeCost - cost : 0;

    return new Response(
      JSON.stringify({
        cost: cost.toFixed(4),
        method,
        savings: savings > 0 ? savings.toFixed(4) : '0',
        savings_percent: savings > 0 ? ((savings / jsAlternativeCost) * 100).toFixed(1) : '0',
        metrics_recorded: metrics.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Cost Recording] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
