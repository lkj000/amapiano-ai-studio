import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODAL_URL = Deno.env.get("MODAL_API_URL") || "https://mabgwej--aura-x-backend-fastapi-app.modal.run";
const MODAL_TIMEOUT_MS = 15000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      audio_url, 
      target_bits = 8,
      use_mid_side = true,
      use_dithering = true,
      noise_shaping = true
    } = await req.json();

    if (!audio_url) {
      return new Response(
        JSON.stringify({ error: "audio_url is required", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[modal-quantize] SVDQuant-Audio v2: ${target_bits}-bit quantization`);
    console.log(`[modal-quantize] Options: mid_side=${use_mid_side}, dither=${use_dithering}, noise_shaping=${noise_shaping}`);
    console.log(`[modal-quantize] Audio URL: ${audio_url.substring(0, 60)}...`);

    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MODAL_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${MODAL_URL}/ml/quantize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_url,
          target_bits,
          use_mid_side,
          use_dithering,
          noise_shaping,
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const isTimeout = fetchError instanceof DOMException && fetchError.name === 'AbortError';
      console.error("[modal-quantize] Modal unreachable:", isTimeout ? 'timeout' : fetchError);
      return new Response(
        JSON.stringify({
          error: isTimeout
            ? "Modal GPU backend timed out. The backend may be in cold-start or stopped."
            : "Modal GPU backend is unreachable. Deploy with: cd python-backend && modal deploy modal_app/main.py",
          success: false,
          backend_status: "unavailable",
          hint: "See docs/MODAL_ARCHITECTURE.md for deployment instructions"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[modal-quantize] Modal error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ error: `Modal API error: ${response.status}`, details: errorText, success: false, backend_status: "error" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const totalTime = Date.now() - startTime;

    console.log(`[modal-quantize] Success: SNR=${result.snr_db?.toFixed(2)}dB, FAD=${(result.fad_score * 100)?.toFixed(2)}%, rank=${result.rank_used}`);
    console.log(`[modal-quantize] Total time: ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        ...result,
        edge_function_time: totalTime,
        backend_status: "connected"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[modal-quantize] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
