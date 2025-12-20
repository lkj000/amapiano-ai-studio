import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { lyrics, genre, bpm, mood } = await req.json();
    
    if (!lyrics) {
      throw new Error('Lyrics are required');
    }

    const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');
    if (!SUNO_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'SUNO_API_KEY not configured',
          message: 'Please add your Suno API key to use this feature. Get one at https://suno.com/api',
          requiresSetup: true
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[SUNO] Starting song generation with vocals');

    // Build the style/genre prompt
    const stylePrompt = `${genre || 'Amapiano'}, ${bpm || 112} BPM, ${mood || 'energetic African dance music'}`;

    // Suno API call - using their generation endpoint
    const response = await fetch('https://api.suno.ai/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: lyrics.substring(0, 3000), // Suno has character limits
        style: stylePrompt,
        make_instrumental: false,
        wait_audio: true, // Wait for generation to complete
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SUNO] API error:', errorText);
      throw new Error(`Suno API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[SUNO] Generation complete:', result);

    const audioUrl = result.audio_url || result[0]?.audio_url;
    
    if (!audioUrl) {
      throw new Error('No audio URL returned from Suno');
    }

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl,
        metadata: {
          genre,
          bpm,
          mood,
          source: 'suno-api',
          hasVocals: true,
          duration: result.duration || 30
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SUNO] Error:', error);
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
