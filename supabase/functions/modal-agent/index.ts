import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODAL_BASE_URL = "https://mabgwej--aura-x-backend-fastapi-app.modal.run";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, context = {}, max_steps = 10, tools = null } = await req.json();
    
    if (!goal) {
      return new Response(
        JSON.stringify({ error: "goal is required", success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("[MODAL-AGENT] Executing autonomous goal:", { 
      goal: goal.substring(0, 100), 
      max_steps,
      tools 
    });

    const startTime = Date.now();
    
    const response = await fetch(`${MODAL_BASE_URL}/agent/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, context, max_steps, tools }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MODAL-AGENT] Modal error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Modal API error: ${response.status}`, details: errorText, success: false }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log("[MODAL-AGENT] Success:", {
      steps_executed: result.steps?.length,
      tools_used: result.tools_used,
      total_time: result.total_time,
      edge_time: `${totalTime}ms`
    });

    return new Response(JSON.stringify({
      ...result,
      edge_function_time: totalTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("[MODAL-AGENT] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error", 
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
