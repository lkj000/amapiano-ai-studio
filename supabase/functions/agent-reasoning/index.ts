import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, goal, availableTools, history } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an autonomous AI agent reasoning about how to accomplish a goal.
You have access to these tools: ${availableTools?.join(", ") || "none"}

Your task is to analyze the current context and determine the next best action.
You must respond with valid JSON in this exact format:
{
  "reasoning": "Your step-by-step reasoning about the current situation",
  "shouldContinue": true/false,
  "confidence": 0.0-1.0,
  "nextAction": "tool_name" or null if done,
  "actionInput": {} or null,
  "explanation": "Brief explanation of why this action was chosen"
}

Guidelines:
- If the goal is achieved, set shouldContinue to false
- Choose actions that make progress toward the goal
- Consider what tools are available and their capabilities
- Be efficient - don't repeat actions unnecessarily
- If stuck, try a different approach or acknowledge failure`;

    const userPrompt = `Goal: ${goal}

Current Context:
${context}

Recent History:
${JSON.stringify(history?.slice(-5) || [], null, 2)}

Analyze the situation and determine the next action.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", fallback: true }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required", fallback: true }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", fallback: true }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse the JSON response
    let thought;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      thought = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      thought = {
        reasoning: content,
        shouldContinue: false,
        confidence: 0.5,
        nextAction: null,
        actionInput: null,
        explanation: "Failed to parse structured response"
      };
    }

    console.log("Agent reasoning result:", thought);

    return new Response(JSON.stringify(thought), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Agent reasoning error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: true 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
