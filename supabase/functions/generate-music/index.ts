import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { genre, bpm, key, duration, mood } = await req.json();

    console.log('[generate-music] Generating music with params:', { genre, bpm, key, duration, mood });

    // Validate inputs
    if (!genre) {
      return new Response(
        JSON.stringify({ error: 'genre is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const replicateApiKey = Deno.env.get('REPLICATE_API_KEY');
    
    if (!replicateApiKey) {
      console.log('[generate-music] No Replicate API key, returning placeholder');
      // Return placeholder for development
      return new Response(
        JSON.stringify({
          audioUrl: 'https://example.com/generated-music.mp3',
          duration: duration || 30,
          metadata: {
            genre,
            bpm: bpm || 118,
            key: key || 'Am',
            mood: mood || 'energetic',
            model: 'placeholder',
            generatedAt: new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Replicate's MusicGen model for actual generation
    const prompt = `${genre} instrumental track, ${bpm || 118} BPM, ${key || 'Am'} key, ${mood || 'energetic'} mood, high quality production`;
    
    console.log('[generate-music] Using prompt:', prompt);

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
        input: {
          prompt,
          duration: Math.min(duration || 30, 30),
          model_version: 'stereo-melody-large',
          output_format: 'mp3'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-music] Replicate API error:', errorText);
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    console.log('[generate-music] Prediction created:', prediction.id);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${replicateApiKey}`,
        }
      });
      
      result = await statusResponse.json();
      attempts++;
      console.log(`[generate-music] Status: ${result.status}, attempt ${attempts}`);
    }

    if (result.status === 'failed') {
      throw new Error(`Music generation failed: ${result.error || 'Unknown error'}`);
    }

    if (result.status !== 'succeeded') {
      throw new Error('Music generation timed out');
    }

    return new Response(
      JSON.stringify({
        audioUrl: result.output,
        duration: duration || 30,
        metadata: {
          genre,
          bpm: bpm || 118,
          key: key || 'Am',
          mood: mood || 'energetic',
          model: 'musicgen',
          predictionId: prediction.id,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-music] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
