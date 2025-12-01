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
    const { lyrics, voiceType, voiceStyle, bpm, genre, energy } = await req.json();
    
    if (!lyrics) {
      throw new Error('Lyrics are required');
    }

    console.log('[SONG-GENERATION] Starting generation:', { voiceType, voiceStyle, bpm, genre });

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    // Voice ID mapping based on type and style
    const voiceMap: Record<string, Record<string, string>> = {
      male: {
        smooth: 'CwhRBWXzGAHq8TQ4Fs17', // Roger
        powerful: 'TX3LPaxmHKxFdv7VOQHJ', // Liam
        raspy: 'bIHbv24MWmeRgasZH58o', // Will
        soft: 'onwK4e9ZLuTAKqWW03F9', // Daniel
      },
      female: {
        smooth: '9BWtsMINqrJLrRacOk9x', // Aria
        powerful: 'EXAVITQu4vr4xnSDxMaL', // Sarah
        raspy: 'pFZP5JQG7iQjIQuC4Bku', // Lily
        soft: 'XB0fDUnXU5powFXDhCwa', // Charlotte
      },
      duet: {
        smooth: 'CwhRBWXzGAHq8TQ4Fs17', // Use Roger for duet (can be enhanced later)
        powerful: 'TX3LPaxmHKxFdv7VOQHJ',
        raspy: 'bIHbv24MWmeRgasZH58o',
        soft: 'onwK4e9ZLuTAKqWW03F9',
      }
    };

    const voiceId = voiceMap[voiceType]?.[voiceStyle] || voiceMap.male.smooth;
    
    console.log('[SONG-GENERATION] Using voice ID:', voiceId);

    // Generate vocals using ElevenLabs TTS
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: lyrics,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: energy ? energy / 100 : 0.5,
            use_speaker_boost: true,
          }
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('[SONG-GENERATION] ElevenLabs error:', errorText);
      throw new Error(`TTS generation failed: ${ttsResponse.status}`);
    }

    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioArrayBuffer);
    
    console.log('[SONG-GENERATION] Vocals generated:', audioBytes.length, 'bytes');

    // Convert to base64 for transmission
    let base64Audio = '';
    for (let i = 0; i < audioBytes.length; i++) {
      base64Audio += String.fromCharCode(audioBytes[i]);
    }
    const base64Encoded = btoa(base64Audio);

    // Create audio URL (in production, this would be uploaded to storage)
    // For now, we return the base64 data URL
    const audioUrl = `data:audio/mpeg;base64,${base64Encoded}`;

    console.log('[SONG-GENERATION] Complete, returning audio URL');

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl,
        voiceId,
        metadata: {
          voiceType,
          voiceStyle,
          bpm,
          genre,
          duration: Math.floor(audioBytes.length / (128 * 1024 / 8)), // Rough estimate
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
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
