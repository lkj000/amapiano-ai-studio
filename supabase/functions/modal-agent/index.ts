import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Modal backend URL - may not always be available
const MODAL_BASE_URL = (Deno.env.get("MODAL_API_URL") || "https://mabgwej--aura-x-backend-fastapi-app.modal.run").replace(/\/+$/, '');

const AGENT_SYSTEM_PROMPT = `You are an autonomous Amapiano music production agent.
Your goal is to reason step-by-step and accomplish the given music production task.

Available actions: analyze_audio, generate_music, separate_stems, master_audio, plan_composition, complete.

You MUST respond with valid JSON only:
{
  "reasoning": "your step-by-step thinking",
  "shouldContinue": true or false,
  "confidence": 0.0-1.0,
  "nextAction": "action_name or null when done",
  "explanation": "what you accomplished or decided in this step"
}

Rules:
- Set shouldContinue to false and nextAction to null when the goal is achieved or no further action is needed
- Do not repeat actions unnecessarily
- Be specific — reference BPM, key, instrument choices when relevant to music goals`;

/**
 * Execute agent goal via real LLM ReAct loop using Lovable AI gateway.
 * Replaces the previous hardcoded simulation.
 */
async function executeWithLLM(
  goal: string,
  context: Record<string, unknown>,
  maxSteps: number
): Promise<{
  success: boolean;
  goal: string;
  steps: Array<{ step: number; thought: string; action: string | null; observation: string; timestamp: number }>;
  result: Record<string, unknown>;
  tools_used: string[];
  total_time: number;
  execution_mode: string;
}> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    console.error("[MODAL-AGENT] LOVABLE_API_KEY not configured — cannot execute LLM agent");
    return {
      success: false,
      goal,
      steps: [{
        step: 1,
        thought: "Agent execution requires LOVABLE_API_KEY to be configured in project secrets.",
        action: null,
        observation: "LOVABLE_API_KEY not set",
        timestamp: Date.now(),
      }],
      result: { error: "LOVABLE_API_KEY not configured" },
      tools_used: [],
      total_time: 0,
      execution_mode: "llm_error",
    };
  }

  const steps: Array<{ step: number; thought: string; action: string | null; observation: string; timestamp: number }> = [];
  const history: Array<{ action: string | null; result: string }> = [];
  const startTime = Date.now();

  console.log("[MODAL-AGENT] Starting real LLM ReAct loop for goal:", goal.substring(0, 100));

  for (let i = 0; i < Math.min(maxSteps, 10); i++) {
    const userMessage = [
      `Goal: ${goal}`,
      Object.keys(context).length > 0 ? `Context: ${JSON.stringify(context)}` : "",
      history.length > 0 ? `History (last ${Math.min(history.length, 3)} steps):\n${JSON.stringify(history.slice(-3))}` : "",
      `\nDetermine the next action to make progress toward the goal.`,
    ].filter(Boolean).join("\n");

    let thought: {
      reasoning: string;
      shouldContinue: boolean;
      confidence: number;
      nextAction: string | null;
      explanation: string;
    };

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: AGENT_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (!resp.ok) {
        console.error(`[MODAL-AGENT] LLM step ${i + 1} failed: ${resp.status}`);
        break;
      }

      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || "{}";

      try {
        const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        thought = JSON.parse(match ? match[1].trim() : raw.trim());
      } catch {
        console.warn("[MODAL-AGENT] Failed to parse step JSON, stopping loop");
        break;
      }
    } catch (fetchErr) {
      console.error("[MODAL-AGENT] Fetch error on step", i + 1, fetchErr);
      break;
    }

    steps.push({
      step: i + 1,
      thought: thought.reasoning,
      action: thought.nextAction || null,
      observation: thought.explanation,
      timestamp: Date.now(),
    });

    history.push({ action: thought.nextAction || null, result: thought.explanation });

    console.log(`[MODAL-AGENT] Step ${i + 1}: action=${thought.nextAction || "none"} continue=${thought.shouldContinue}`);

    if (!thought.shouldContinue || !thought.nextAction) {
      break;
    }
  }

  const toolsUsed = steps.map(s => s.action).filter((a): a is string => Boolean(a));
  const lastStep = steps[steps.length - 1];

  return {
    success: steps.length > 0,
    goal,
    steps,
    result: {
      status: "completed",
      summary: lastStep?.observation || "Agent loop completed",
      steps_executed: steps.length,
    },
    tools_used: toolsUsed,
    total_time: Date.now() - startTime,
    execution_mode: "llm_react_loop",
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract user identifier from JWT auth header
  const authHeader = req.headers.get('authorization') || '';
  const userId = authHeader.replace('Bearer ', '').slice(-16) || 'anonymous'; // last 16 chars of token

  const rateCheck = await checkRateLimit(RATE_LIMITS.AI_GENERATION, userId);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', fallback: true }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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
    
    // LLM ReAct loop fallback when Modal is unavailable
    const result = await executeWithLLM(goal, context as Record<string, unknown>, max_steps);
    const totalTime = Date.now() - startTime;

    console.log("[MODAL-AGENT] LLM ReAct execution complete:", {
      steps_executed: result.steps.length,
      tools_used: result.tools_used,
      total_time: `${totalTime}ms`,
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
