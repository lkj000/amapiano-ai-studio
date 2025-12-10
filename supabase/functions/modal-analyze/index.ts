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
    const { audio_url, analysis_type = "full" } = await req.json();
    
    if (!audio_url) {
      return new Response(
        JSON.stringify({ error: "audio_url is required", success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("[MODAL-ANALYZE] Real Librosa analysis:", { audio_url: audio_url.substring(0, 50), analysis_type });

    const startTime = Date.now();
    
    const response = await fetch(`${MODAL_BASE_URL}/audio/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_url, analysis_type }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MODAL-ANALYZE] Modal error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Modal API error: ${response.status}`, details: errorText, success: false }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log("[MODAL-ANALYZE] Success:", {
      bpm: result.bpm,
      key: result.key,
      mode: result.mode,
      genre: result.genre,
      totalTime: `${totalTime}ms`
    });

    return new Response(JSON.stringify({
      ...result,
      edge_function_time: totalTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("[MODAL-ANALYZE] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error", 
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
