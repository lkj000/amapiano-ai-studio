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
    const { lyrics, voiceType, voiceStyle, bpm, genre, energy } = await req.json();
    
    if (!lyrics) {
      throw new Error('Lyrics are required');
    }

    console.log('[SONG-GENERATION] Starting REAL song generation:', { voiceType, voiceStyle, bpm, genre });

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured - required for real music generation');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build a detailed prompt for music generation with vocals
    const voiceDesc = voiceType === 'female' ? 'female vocals' : voiceType === 'duet' ? 'duet male and female vocals' : 'male vocals';
    const styleDesc = voiceStyle === 'powerful' ? 'powerful and energetic' : 
                      voiceStyle === 'raspy' ? 'raspy and soulful' :
                      voiceStyle === 'soft' ? 'soft and gentle' : 'smooth and melodic';
    
    const musicPrompt = `${genre || 'Amapiano'} song with ${voiceDesc}, ${styleDesc} singing style, ${bpm || 112} BPM, ${energy > 70 ? 'high energy' : energy > 40 ? 'medium energy' : 'chill vibes'}. Lyrics: ${lyrics.substring(0, 500)}`;

    console.log('[SONG-GENERATION] Music prompt:', musicPrompt);

    // Use Replicate's MusicGen or similar model for actual music generation
    // Using facebook/musicgen for instrumental + we'll need a singing model
    // For now, using a music generation model that can create vocal-like content
    
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Using MusicGen Large for better quality
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
    console.log('[SONG-GENERATION] Prediction created:', prediction.id);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
        },
      });
      
      result = await pollResponse.json();
      attempts++;
      console.log('[SONG-GENERATION] Poll attempt', attempts, '- Status:', result.status);
    }

    if (result.status === 'failed') {
      throw new Error(`Music generation failed: ${result.error || 'Unknown error'}`);
    }

    if (result.status !== 'succeeded') {
      throw new Error('Music generation timed out');
    }

    const audioUrl = result.output;
    console.log('[SONG-GENERATION] Generated audio URL:', audioUrl);

    // Download the audio and upload to Supabase for persistence
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

    if (uploadError) {
      console.error('[SONG-GENERATION] Storage upload error:', uploadError);
      // Return the original URL if upload fails
      return new Response(
        JSON.stringify({
          success: true,
          audioUrl,
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
    }

    const { data: urlData } = supabase.storage
      .from('samples')
      .getPublicUrl(filePath);

    console.log('[SONG-GENERATION] Complete, stored at:', urlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: urlData.publicUrl,
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
