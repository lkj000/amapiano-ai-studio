import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ElevenLabs voice IDs optimized for singing/melodic content
const SINGING_VOICES = {
  female: 'EXAVITQu4vr4xnSDxMaL', // Sarah - good for melodic
  male: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - deep and smooth
  duet: 'pFZP5JQG7iQjIQuC4Bku', // Lily - versatile
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, voiceType, voiceStyle, bpm, genre } = await req.json();
    
    if (!lyrics) {
      throw new Error('Lyrics are required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('[ELEVENLABS-SINGING] Starting vocal generation');

    // Step 1: Generate instrumental backing track with Replicate MusicGen
    let instrumentalUrl = null;
    if (REPLICATE_API_KEY) {
      console.log('[ELEVENLABS-SINGING] Generating instrumental backing track');
      
      const musicPrompt = `${genre || 'Amapiano'} instrumental, ${bpm || 112} BPM, no vocals, African electronic dance music with log drums and piano`;
      
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
          },
        }),
      });

      if (replicateResponse.ok) {
        const prediction = await replicateResponse.json();
        let result = prediction;
        let attempts = 0;

        while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 60) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
          });
          result = await pollResponse.json();
          attempts++;
        }

        if (result.status === 'succeeded') {
          instrumentalUrl = result.output;
          console.log('[ELEVENLABS-SINGING] Instrumental generated:', instrumentalUrl);
        }
      }
    }

    // Step 2: Generate sung vocals using ElevenLabs with musical settings
    const voiceId = SINGING_VOICES[voiceType as keyof typeof SINGING_VOICES] || SINGING_VOICES.female;
    
    // Format lyrics for more melodic TTS output
    const formattedLyrics = lyrics
      .split('\n')
      .filter((line: string) => line.trim() && !line.startsWith('[') && !line.startsWith('('))
      .join('... ')
      .substring(0, 2500);

    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: formattedLyrics,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.3, // Lower for more expressive/melodic
          similarity_boost: 0.7,
          style: 0.8, // Higher style for more musical expression
          use_speaker_boost: true,
          speed: 0.9, // Slightly slower for more melodic feel
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('[ELEVENLABS-SINGING] TTS error:', errorText);
      throw new Error(`ElevenLabs TTS error: ${ttsResponse.status}`);
    }

    const vocalBuffer = await ttsResponse.arrayBuffer();
    const vocalBytes = new Uint8Array(vocalBuffer);

    // Upload vocal track
    const vocalFileName = `vocals-${Date.now()}.mp3`;
    const { error: vocalUploadError } = await supabase.storage
      .from('samples')
      .upload(`generated/${vocalFileName}`, vocalBytes, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    const { data: vocalUrlData } = supabase.storage
      .from('samples')
      .getPublicUrl(`generated/${vocalFileName}`);

    console.log('[ELEVENLABS-SINGING] Vocals uploaded:', vocalUrlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        vocalUrl: vocalUrlData.publicUrl,
        instrumentalUrl,
        metadata: {
          voiceType,
          voiceStyle,
          bpm,
          genre,
          source: 'elevenlabs-singing',
          hasVocals: true,
          hasBacking: !!instrumentalUrl,
          duration: 30
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ELEVENLABS-SINGING] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Vocal generation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
