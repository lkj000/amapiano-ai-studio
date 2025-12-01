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
    console.log('[STEM-SEPARATION] Processing request...');

    // Parse JSON body
    const { audioUrl, quality = 'standard' } = await req.json();

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'No audio URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[STEM-SEPARATION] Audio URL received, length:', audioUrl.length);

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    console.log('[STEM-SEPARATION] Calling Replicate Demucs...');

    // Use Demucs model for high-quality stem separation
    const output = await replicate.run(
      "cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953",
      {
        input: {
          audio: audioUrl,
          model: quality === 'high' ? 'htdemucs_ft' : 'htdemucs',
        }
      }
    );

    console.log('[STEM-SEPARATION] Separation complete');
    console.log('[STEM-SEPARATION] Output:', typeof output, output);

    // Handle different output formats
    let stems;
    if (typeof output === 'object' && output !== null) {
      stems = {
        drums: output.drums,
        bass: output.bass,
        vocals: output.vocals,
        other: output.other,
      };
    } else {
      console.error('[STEM-SEPARATION] Unexpected output format:', output);
      throw new Error('Unexpected output format from Demucs');
    }

    console.log('[STEM-SEPARATION] Stems extracted:', Object.keys(stems).filter(k => stems[k]));

    // Return URLs for each stem
    return new Response(
      JSON.stringify({
        success: true,
        stems,
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
