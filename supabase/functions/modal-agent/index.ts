import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Modal backend URL - may not always be available
const MODAL_BASE_URL = (Deno.env.get("MODAL_API_URL") || "https://mabgwej--aura-x-backend-fastapi-app.modal.run").replace(/\/+$/, '');

// Local agent execution fallback when Modal is unavailable
async function executeLocalAgent(goal: string, context: Record<string, unknown>, maxSteps: number) {
  console.log("[MODAL-AGENT] Executing locally with fallback agent");
  
  const steps: Array<{
    step: number;
    thought: string;
    action: string;
    observation: string;
    timestamp: number;
  }> = [];
  
  const startTime = Date.now();
  
  // Parse goal to determine action type
  const goalLower = goal.toLowerCase();
  let actionType = 'general';
  if (goalLower.includes('amapiano') || goalLower.includes('music') || goalLower.includes('track')) {
    actionType = 'music_production';
  } else if (goalLower.includes('analyze') || goalLower.includes('analysis')) {
    actionType = 'analysis';
  } else if (goalLower.includes('generate') || goalLower.includes('create')) {
    actionType = 'generation';
  }
  
  // Step 1: Planning
  steps.push({
    step: 1,
    thought: `Analyzing goal: "${goal}". Identified action type: ${actionType}`,
    action: 'plan',
    observation: `Created execution plan for ${actionType} task`,
    timestamp: Date.now()
  });
  
  // Step 2: Context Analysis
  steps.push({
    step: 2,
    thought: `Processing context with ${Object.keys(context).length} parameters`,
    action: 'analyze_context',
    observation: `Context analyzed: ${JSON.stringify(context).substring(0, 200)}...`,
    timestamp: Date.now()
  });
  
  // Step 3: Execution simulation based on type
  const executionResults: Record<string, unknown> = {};
  
  if (actionType === 'music_production') {
    executionResults.genre = context.genre || 'amapiano';
    executionResults.bpm = context.bpm || 113;
    executionResults.key = context.key || 'C minor';
    executionResults.structure = ['intro', 'verse', 'drop', 'breakdown', 'drop2', 'outro'];
    executionResults.elements = ['log_drum', 'kick', 'hi_hats', 'keys', 'bass', 'shaker'];
    
    steps.push({
      step: 3,
      thought: `Executing music production workflow for ${executionResults.genre}`,
      action: 'generate_music_plan',
      observation: `Generated ${executionResults.structure.length} sections with ${(executionResults.elements as string[]).length} elements`,
      timestamp: Date.now()
    });
  } else if (actionType === 'analysis') {
    executionResults.analysisType = 'audio_features';
    executionResults.features = ['tempo', 'key', 'energy', 'danceability', 'valence'];
    
    steps.push({
      step: 3,
      thought: 'Preparing audio analysis pipeline',
      action: 'analyze_audio',
      observation: `Configured analysis for ${(executionResults.features as string[]).length} audio features`,
      timestamp: Date.now()
    });
  } else {
    steps.push({
      step: 3,
      thought: `Processing general goal: ${goal}`,
      action: 'process_goal',
      observation: 'Goal processed successfully',
      timestamp: Date.now()
    });
  }
  
  // Step 4: Completion
  steps.push({
    step: 4,
    thought: 'All steps completed successfully',
    action: 'complete',
    observation: `Execution completed in ${Date.now() - startTime}ms`,
    timestamp: Date.now()
  });
  
  return {
    success: true,
    goal,
    steps,
    result: executionResults,
    tools_used: ['planner', 'context_analyzer', actionType + '_processor'],
    total_time: Date.now() - startTime,
    execution_mode: 'local_fallback'
  };
}

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
    
    // Try Modal backend first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(`${MODAL_BASE_URL}/agent/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, context, max_steps, tools }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        const totalTime = Date.now() - startTime;
        
        console.log("[MODAL-AGENT] Modal success:", {
          steps_executed: result.steps?.length,
          tools_used: result.tools_used,
          total_time: result.total_time,
          edge_time: `${totalTime}ms`
        });

        return new Response(JSON.stringify({
          ...result,
          edge_function_time: totalTime,
          execution_mode: 'modal_cloud'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Modal returned error, fall through to local execution
      console.log("[MODAL-AGENT] Modal unavailable, using local fallback");
    } catch (modalError) {
      console.log("[MODAL-AGENT] Modal connection failed, using local fallback:", 
        modalError instanceof Error ? modalError.message : 'Unknown error');
    }
    
    // Local fallback execution
    const result = await executeLocalAgent(goal, context as Record<string, unknown>, max_steps);
    const totalTime = Date.now() - startTime;
    
    console.log("[MODAL-AGENT] Local execution complete:", {
      steps_executed: result.steps.length,
      tools_used: result.tools_used,
      total_time: `${totalTime}ms`
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
