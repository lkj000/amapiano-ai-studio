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
    const { audio_url, target_bits = 8 } = await req.json();

    if (!audio_url) {
      return new Response(
        JSON.stringify({ error: "audio_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[modal-quantize] Calling Modal with ${target_bits}-bit quantization for URL: ${audio_url.substring(0, 50)}...`);

    // Call Modal backend with audio_url (what it expects)
    const response = await fetch(`${MODAL_URL}/ml/quantize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url,
        target_bits,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[modal-quantize] Modal error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ error: `Modal API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log(`[modal-quantize] Success: SNR=${result.snr_db?.toFixed(2)}dB, rank=${result.rank_used}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[modal-quantize] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
