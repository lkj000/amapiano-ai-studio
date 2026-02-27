import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Modal URL - will need to be updated when you deploy your Modal backend
const MODAL_URL = (Deno.env.get("MODAL_API_URL") || "https://mabgwej--aura-x-backend-fastapi-app.modal.run").replace(/\/+$/, '');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, genre = "amapiano", bpm = 118, duration = 30, key = "Am", mood = "energetic" } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[modal-generate] Calling Modal GPU backend with prompt: "${prompt.substring(0, 50)}..."`);
    console.log(`[modal-generate] Parameters: genre=${genre}, bpm=${bpm}, duration=${duration}s, key=${key}, mood=${mood}`);

    const startTime = Date.now();

    // Try to call Modal backend
    try {
      const response = await fetch(`${MODAL_URL}/audio/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          genre,
          bpm,
          duration,
          key,
          mood,
        }),
      });

      const processingTime = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        console.log(`[modal-generate] Success in ${processingTime}ms: audio_url=${result.audio_url?.substring(0, 50)}...`);

        return new Response(
          JSON.stringify({
            ...result,
            processing_time_ms: processingTime,
            infrastructure: "modal-gpu"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const errorText = await response.text();
      console.error(`[modal-generate] Modal error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Modal GPU backend is not available. Please deploy your Modal backend or enable development mode.`,
          details: `Status: ${response.status}`,
          hint: "To deploy a Modal backend, follow the instructions in docs/MODAL_ARCHITECTURE.md"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchError) {
      // Network error reaching Modal - backend is offline
      const processingTime = Date.now() - startTime;
      console.error(`[modal-generate] Network error reaching Modal after ${processingTime}ms:`, fetchError);
      return new Response(
        JSON.stringify({
          error: 'Music generation temporarily unavailable. Modal GPU backend is offline.',
          audioUrl: null
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[modal-generate] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
