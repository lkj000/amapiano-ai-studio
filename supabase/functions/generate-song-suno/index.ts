import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, genre, bpm, mood, title, instrumental = false, enhanceLyrics = true } = await req.json();
    
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'ELEVENLABS_API_KEY not configured',
          message: 'Please add your ElevenLabs API key in project secrets.',
          requiresSetup: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[MUSIC-GEN] Starting music generation via ElevenLabs Music API');

    // Step 1: Optionally use Lovable AI to enhance the music prompt
    let musicPrompt = '';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (LOVABLE_API_KEY && enhanceLyrics) {
      console.log('[MUSIC-GEN] Enhancing prompt with Lovable AI');
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: `You are a music production prompt engineer. Given a user's song description, genre, mood, and optional lyrics, create a concise, vivid music generation prompt (max 200 words) that describes the desired track. Focus on: instrumentation, rhythm, energy, tempo, and sonic texture. Do NOT include lyrics in the prompt - only describe the music itself. Output ONLY the prompt text, nothing else.`
              },
              {
                role: 'user',
                content: `Genre: ${genre || 'Amapiano'}
BPM: ${bpm || 112}
Mood: ${mood || 'energetic'}
Title: ${title || 'Untitled'}
Description: ${lyrics || title || `A ${genre || 'Amapiano'} track`}
Instrumental: ${instrumental}

Create a music generation prompt for this track.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          musicPrompt = aiData.choices?.[0]?.message?.content?.trim() || '';
          console.log('[MUSIC-GEN] AI-enhanced prompt:', musicPrompt.substring(0, 100));
        } else {
          const errStatus = aiResponse.status;
          console.warn('[MUSIC-GEN] AI enhancement failed:', errStatus);
          if (errStatus === 429) {
            console.warn('[MUSIC-GEN] Rate limited, falling back to manual prompt');
          }
        }
      } catch (aiErr) {
        console.warn('[MUSIC-GEN] AI enhancement error, using fallback:', aiErr);
      }
    }

    // Fallback: build prompt manually if AI didn't produce one
    if (!musicPrompt) {
      const parts = [
        genre || 'Amapiano',
        `${bpm || 112} BPM`,
        mood || 'energetic',
        instrumental ? 'instrumental, no vocals' : 'with vocals',
      ];
      if (title) parts.push(title);
      if (lyrics && !instrumental) parts.push(`lyrical theme: ${lyrics.substring(0, 100)}`);
      musicPrompt = parts.join(', ');
    }

    console.log('[MUSIC-GEN] Final prompt:', musicPrompt);

    // Step 2: Generate music via ElevenLabs Music API
    const musicResponse = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: musicPrompt,
        duration_seconds: 30,
      }),
    });

    if (!musicResponse.ok) {
      const errorText = await musicResponse.text();
      console.error('[MUSIC-GEN] ElevenLabs Music API error:', musicResponse.status, errorText);
      throw new Error(`ElevenLabs Music API error: ${musicResponse.status} - ${errorText}`);
    }

    // ElevenLabs returns raw audio bytes
    const audioBuffer = await musicResponse.arrayBuffer();
    const base64Audio = base64Encode(new Uint8Array(audioBuffer)
    );

    console.log('[MUSIC-GEN] Audio generated, size:', audioBuffer.byteLength, 'bytes');

    return new Response(
      JSON.stringify({
        success: true,
        audioBase64: base64Audio,
        metadata: {
          title: title || `${genre || 'Amapiano'} Track`,
          genre: genre || 'Amapiano',
          bpm: bpm || 112,
          mood: mood || 'energetic',
          source: 'elevenlabs-music',
          hasVocals: !instrumental,
          duration: 30,
          prompt: musicPrompt.substring(0, 200),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MUSIC-GEN] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Music generation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
