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
    const { prompt, currentParameters, pluginType = "amapianorizer" } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert audio engineer specializing in ${pluginType} effects. 
Your job is to translate natural language requests into precise parameter adjustments.

The Amapianorizer is an all-in-one multi-effect designed to instantly give any sound the characteristic groove, pump, and low-end of Amapiano music.

Available parameters and their meanings:

EQ Module:
- lowBoost (0-1): Boost sub bass 40-60Hz for deeper low end
- midCut (0-1): Cut muddy mids around 300Hz for clarity
- percBoost (0-1): Boost 800-2kHz for log drum/percussion presence
- highShelf (-1 to 1): Adjust high frequency air and sparkle

Compressor Module:
- pumpIntensity (0-1): Controls pumping/ducking effect strength (ratio + timing)
- threshold (-60 to 0 dB): When compression starts
- sidechain (bool): Enable sidechain-style pumping
- makeup (0-1): Compensate for gain reduction

Gate Module:
- gatePattern (enum): "logDrumPulse", "syncopatedChop", "houseGroove", "brokenBeat"
- gateDepth (0-1): How much the gate closes (0=no effect, 1=full silence)
- swing (0.5-0.75): Groove timing (0.62 is classic Amapiano)
- bpmSync (bool): Sync to project tempo

Reverb Module:
- reverbSize (0-1): Room size/space depth
- damping (0-1): High frequency absorption
- width (0-1): Stereo width
- mix (0-1): Wet/dry blend

Delay Module:
- delayTime (0.0625-2 beats): Delay time in beats
- feedback (0-0.95): Number of repeats
- filterCutoff (200-10000 Hz): Filter in feedback path
- pingPong (bool): Stereo ping-pong mode

Distortion Module:
- warmth (0-1): Analog saturation amount
- drive (1-10): Gain before saturation
- mix (0-1): Wet/dry blend

User requests examples:
- "Make it punchier" → Increase pumpIntensity, increase percBoost, reduce midCut
- "Add more space" → Increase reverbSize, increase delay mix
- "More pump" → Increase pumpIntensity, lower threshold
- "Darker sound" → Reduce highShelf, reduce percBoost, increase filterCutoff on delay
- "Classic Amapiano vibe" → Set swing to 0.62, gatePattern to logDrumPulse, moderate pump
- "Heavy gating" → Increase gateDepth to 0.8-0.9
- "Subtle effect" → Reduce all mix parameters, lower pumpIntensity

Return ONLY a JSON object with parameter changes. Include explanation field.
Format: { "parameters": { "paramName": newValue }, "explanation": "why these changes" }`;

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
          { 
            role: "user", 
            content: `Current parameters: ${JSON.stringify(currentParameters)}\n\nUser request: "${prompt}"\n\nProvide parameter adjustments as JSON.`
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "adjust_parameters",
            description: "Adjust plugin parameters based on user request",
            parameters: {
              type: "object",
              properties: {
                parameters: {
                  type: "object",
                  description: "Parameter name-value pairs to update",
                  additionalProperties: true
                },
                explanation: {
                  type: "string",
                  description: "Brief explanation of the changes made"
                }
              },
              required: ["parameters", "explanation"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "adjust_parameters" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "No parameter adjustments generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adjustments = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        parameters: adjustments.parameters,
        explanation: adjustments.explanation
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Parameter translation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
