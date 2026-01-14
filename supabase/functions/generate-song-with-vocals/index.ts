import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Check if this is a status check request
    if (body.action === 'check_status' && body.jobId) {
      return await checkJobStatus(body.jobId);
    }

    // Otherwise, start a new generation
    const { lyrics, voiceType, voiceStyle, bpm, genre, energy } = body;
    
    if (!lyrics) {
      throw new Error('Lyrics are required');
    }

    console.log('[SONG-GENERATION] Starting async song generation:', { voiceType, voiceStyle, bpm, genre });

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured - required for real music generation');
    }

    // Build a detailed prompt for music generation with vocals
    const voiceDesc = voiceType === 'female' ? 'female vocals' : voiceType === 'duet' ? 'duet male and female vocals' : 'male vocals';
    const styleDesc = voiceStyle === 'powerful' ? 'powerful and energetic' : 
                      voiceStyle === 'raspy' ? 'raspy and soulful' :
                      voiceStyle === 'soft' ? 'soft and gentle' : 'smooth and melodic';
    
    const musicPrompt = `${genre || 'Amapiano'} song with ${voiceDesc}, ${styleDesc} singing style, ${bpm || 112} BPM, ${energy > 70 ? 'high energy' : energy > 40 ? 'medium energy' : 'chill vibes'}. Lyrics: ${lyrics.substring(0, 500)}`;

    console.log('[SONG-GENERATION] Music prompt:', musicPrompt);

    // Start the Replicate prediction (non-blocking)
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
        input: {
          prompt: musicPrompt,
          duration: 30,
          model_version: 'stereo-large',
          output_format: 'mp3',
          normalization_strategy: 'peak',
        },
      }),
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('[SONG-GENERATION] Replicate API error:', errorText);
      throw new Error(`Replicate API error: ${replicateResponse.status}`);
    }

    const prediction = await replicateResponse.json();
    console.log('[SONG-GENERATION] Prediction created (async):', prediction.id);

    // Return immediately with job ID - client will poll for status
    return new Response(
      JSON.stringify({
        success: true,
        status: 'processing',
        jobId: prediction.id,
        message: 'Song generation started. Poll for status using jobId.',
        metadata: {
          voiceType,
          voiceStyle,
          bpm,
          genre,
          duration: 30,
          source: 'replicate-musicgen'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SONG-GENERATION] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Song generation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function checkJobStatus(jobId: string): Promise<Response> {
  const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
  if (!REPLICATE_API_KEY) {
    throw new Error('REPLICATE_API_KEY not configured');
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  console.log('[SONG-GENERATION] Checking status for job:', jobId);

  const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
    headers: {
      'Authorization': `Token ${REPLICATE_API_KEY}`,
    },
  });

  if (!pollResponse.ok) {
    throw new Error(`Failed to check job status: ${pollResponse.status}`);
  }

  const result = await pollResponse.json();
  console.log('[SONG-GENERATION] Job status:', result.status);

  if (result.status === 'failed') {
    return new Response(
      JSON.stringify({
        success: false,
        status: 'failed',
        error: result.error || 'Music generation failed',
        jobId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (result.status === 'succeeded') {
    const audioUrl = result.output;
    console.log('[SONG-GENERATION] Generated audio URL:', audioUrl);

    // Try to persist to Supabase storage
    let finalUrl = audioUrl;
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const audioResponse = await fetch(audioUrl);
        const audioArrayBuffer = await audioResponse.arrayBuffer();
        const audioBytes = new Uint8Array(audioArrayBuffer);

        const fileName = `generated-song-${Date.now()}.mp3`;
        const filePath = `generated/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('samples')
          .upload(filePath, audioBytes, {
            contentType: 'audio/mpeg',
            upsert: false
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('samples')
            .getPublicUrl(filePath);
          finalUrl = urlData.publicUrl;
          console.log('[SONG-GENERATION] Stored at:', finalUrl);
        }
      } catch (storageError) {
        console.error('[SONG-GENERATION] Storage upload error:', storageError);
        // Use original URL if storage fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'succeeded',
        audioUrl: finalUrl,
        jobId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Still processing
  return new Response(
    JSON.stringify({
      success: true,
      status: result.status, // 'starting' or 'processing'
      jobId,
      message: 'Generation in progress...'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
