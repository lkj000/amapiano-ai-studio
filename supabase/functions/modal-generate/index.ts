import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODAL_URL = "https://mabgwej--aura-x-backend-fastapi-app.modal.run";

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

    // Call Modal backend for GPU-accelerated music generation (Suno-style)
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[modal-generate] Modal error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ error: `Modal API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log(`[modal-generate] Success in ${processingTime}ms: audio_url=${result.audio_url?.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({
        ...result,
        processing_time_ms: processingTime,
        infrastructure: "modal-suno-style"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[modal-generate] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
