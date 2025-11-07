import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const quality = formData.get('quality') as string || 'standard';

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[STEM-SEPARATION] File received:', audioFile.name, audioFile.size);

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    // Convert file to base64 data URL
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:${audioFile.type};base64,${base64}`;

    console.log('[STEM-SEPARATION] Calling Replicate Demucs...');

    // Use Demucs model for high-quality stem separation
    const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'd65d2f2b9a6f2e8e8e8e8e8e8e8e8e8e8e8e8e8e', // Demucs model version
        input: {
          audio: dataUrl,
          model: quality === 'high' ? 'htdemucs_ft' : 'htdemucs',
        }
      })
    });

    if (!predictionResponse.ok) {
      const errorText = await predictionResponse.text();
      console.error('[STEM-SEPARATION] Replicate error:', errorText);
      throw new Error(`Replicate API error: ${predictionResponse.status}`);
    }

    const prediction = await predictionResponse.json();
    console.log('[STEM-SEPARATION] Separation started:', prediction.id);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 120; // 4 minutes for stem separation

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` }
      });

      result = await statusResponse.json();
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`[STEM-SEPARATION] Status: ${result.status} (${attempts}/${maxAttempts})`);
      }
    }

    if (result.status === 'failed') {
      throw new Error('Stem separation failed on Replicate');
    }

    if (result.status !== 'succeeded') {
      throw new Error('Stem separation timeout');
    }

    console.log('[STEM-SEPARATION] Complete:', Object.keys(result.output || {}));

    // Return URLs for each stem
    return new Response(
      JSON.stringify({
        success: true,
        stems: {
          drums: result.output?.drums,
          bass: result.output?.bass,
          vocals: result.output?.vocals,
          other: result.output?.other,
        }
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
