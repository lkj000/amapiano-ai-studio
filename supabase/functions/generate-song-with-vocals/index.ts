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

    console.log('[SONG-GENERATION] Starting generation:', { voiceType, voiceStyle, bpm, genre });

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
        smooth: 'CwhRBWXzGAHq8TQ4Fs17',
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
      console.error('[SONG-GENERATION] ElevenLabs API error:', {
        status: ttsResponse.status,
        statusText: ttsResponse.statusText,
        body: errorText
      });
      
      let errorDetails = errorText;
      try {
        const parsed = JSON.parse(errorText);
        errorDetails = parsed.detail?.message || parsed.message || errorText;
      } catch {
        // Keep original text if not JSON
      }
      
      throw new Error(`TTS failed (${ttsResponse.status}): ${errorDetails}`);
    }

    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioArrayBuffer);
    
    console.log('[SONG-GENERATION] Vocals generated:', audioBytes.length, 'bytes');

    // Upload to Supabase Storage instead of base64 encoding
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
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('samples')
      .getPublicUrl(filePath);

    const audioUrl = urlData.publicUrl;

    console.log('[SONG-GENERATION] Complete, audio URL:', audioUrl);

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
          duration: Math.floor(audioBytes.length / (128 * 1024 / 8)),
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
