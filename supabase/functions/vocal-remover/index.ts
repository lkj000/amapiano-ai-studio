import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl } = await req.json();

    if (!audioUrl) {
      throw new Error('Audio URL is required');
    }

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not configured');
    }

    console.log('Starting vocal removal with Demucs for:', audioUrl);

    // Use Demucs model for vocal/instrumental separation (2-stem for faster processing)
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'cfa93589bd6cfae0cf89daa02a99b8c49ddc3f066e67d01d148ad8bf2aba8cd6',
        input: {
          audio: audioUrl,
          stem: 'vocals', // Extract vocals stem
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Replicate API error:', error);
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    console.log('Vocal removal prediction started:', prediction.id);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
        },
      });
      
      result = await pollResponse.json();
      attempts++;
      console.log(`Vocal removal status: ${result.status} (attempt ${attempts})`);
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Vocal removal failed');
    }

    if (result.status !== 'succeeded') {
      throw new Error('Vocal removal timed out');
    }

    console.log('Vocal removal completed:', result.output);

    // Now run a second prediction for instrumental (no_vocals)
    const instrumentalResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'cfa93589bd6cfae0cf89daa02a99b8c49ddc3f066e67d01d148ad8bf2aba8cd6',
        input: {
          audio: audioUrl,
          stem: 'no_vocals', // Extract instrumental (no vocals)
        },
      }),
    });

    if (!instrumentalResponse.ok) {
      console.error('Failed to start instrumental separation');
      // Return just vocals if instrumental fails
      return new Response(
        JSON.stringify({
          success: true,
          vocalUrl: result.output,
          instrumentalUrl: null,
          message: 'Vocals extracted successfully (instrumental extraction failed)',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const instrumentalPrediction = await instrumentalResponse.json();
    console.log('Instrumental prediction started:', instrumentalPrediction.id);

    // Poll for instrumental completion
    let instrumentalResult = instrumentalPrediction;
    attempts = 0;

    while (instrumentalResult.status !== 'succeeded' && instrumentalResult.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${instrumentalPrediction.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
        },
      });
      
      instrumentalResult = await pollResponse.json();
      attempts++;
      console.log(`Instrumental status: ${instrumentalResult.status} (attempt ${attempts})`);
    }

    const instrumentalUrl = instrumentalResult.status === 'succeeded' ? instrumentalResult.output : null;

    return new Response(
      JSON.stringify({
        success: true,
        vocalUrl: result.output,
        instrumentalUrl: instrumentalUrl,
        message: 'Audio separation completed successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Vocal removal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to remove vocals',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
