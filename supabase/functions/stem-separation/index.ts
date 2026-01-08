import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, quality = 'standard', predictionId } = await req.json();

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    // If predictionId is provided, check status
    if (predictionId) {
      console.log('[STEM-SEPARATION] Checking prediction status:', predictionId);
      const result = await replicate.predictions.get(predictionId);
      console.log('[STEM-SEPARATION] Status:', result.status);

      if (result.status === 'succeeded') {
        const output = result.output;
        // 6-stem model outputs: drums, bass, vocals, guitar, piano, other
        const stems = {
          drums: output?.drums,
          bass: output?.bass,
          vocals: output?.vocals,
          guitar: output?.guitar,
          piano: output?.piano,
          other: output?.other,
        };
        return new Response(
          JSON.stringify({ success: true, status: 'succeeded', stems }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (result.status === 'failed') {
        return new Response(
          JSON.stringify({ success: false, status: 'failed', error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, status: result.status, predictionId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Start new prediction
    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'No audio URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[STEM-SEPARATION] Starting prediction for:', audioUrl);

    // Use htdemucs_6s for 6-stem separation (drums, bass, vocals, guitar, piano, other)
    const prediction = await replicate.predictions.create({
      version: "25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953",
      input: {
        audio: audioUrl,
        model: quality === 'high' ? 'htdemucs_6s' : 'htdemucs_6s',
      }
    });

    console.log('[STEM-SEPARATION] Prediction created:', prediction.id);

    return new Response(
      JSON.stringify({
        success: true,
        status: 'starting',
        predictionId: prediction.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STEM-SEPARATION] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Separation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
