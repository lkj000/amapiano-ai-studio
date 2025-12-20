import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice IDs for spoken intros
const INTRO_VOICES = {
  male: 'onwK4e9ZLuTAKqWW03F9', // Daniel - clear and engaging
  female: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm and friendly
  hype: 'cjVigY5qzO86Huf0OWal', // Eric - energetic
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, voiceType, genre, bpm, mood, artistName } = await req.json();

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('[BACKING-INTRO] Starting generation with spoken intro');

    // Step 1: Generate instrumental backing track
    const musicPrompt = `${genre || 'Amapiano'} instrumental, ${bpm || 112} BPM, ${mood || 'energetic African dance'}, log drums, piano, deep bass, no vocals`;

    console.log('[BACKING-INTRO] Generating instrumental...');
    
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

    if (!replicateResponse.ok) {
      throw new Error(`Replicate API error: ${replicateResponse.status}`);
    }

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

    if (result.status !== 'succeeded') {
      throw new Error('Instrumental generation failed');
    }

    const instrumentalUrl = result.output;
    console.log('[BACKING-INTRO] Instrumental generated:', instrumentalUrl);

    // Download and store instrumental
    const instrumentalResponse = await fetch(instrumentalUrl);
    const instrumentalBuffer = await instrumentalResponse.arrayBuffer();
    const instrumentalBytes = new Uint8Array(instrumentalBuffer);

    const instrumentalFileName = `backing-${Date.now()}.mp3`;
    await supabase.storage.from('samples').upload(`generated/${instrumentalFileName}`, instrumentalBytes, {
      contentType: 'audio/mpeg',
      upsert: false
    });

    const { data: instrumentalUrlData } = supabase.storage.from('samples').getPublicUrl(`generated/${instrumentalFileName}`);

    // Step 2: Generate spoken intro/hook using ElevenLabs
    let introUrl = null;
    if (ELEVENLABS_API_KEY && lyrics) {
      console.log('[BACKING-INTRO] Generating spoken intro...');
      
      // Extract first verse or hook from lyrics for intro
      const lyricsLines = lyrics.split('\n').filter((line: string) => 
        line.trim() && !line.startsWith('[') && !line.startsWith('(') && !line.startsWith('*')
      );
      
      // Create an engaging intro
      const artist = artistName || 'Amapiano Studios';
      const hookLine = lyricsLines.slice(0, 2).join('. ') || 'Let the rhythm take you higher';
      const introText = `${artist} presents... ${hookLine}`;

      const voiceId = INTRO_VOICES[voiceType as keyof typeof INTRO_VOICES] || INTRO_VOICES.hype;

      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: introText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.6,
            use_speaker_boost: true,
          },
        }),
      });

      if (ttsResponse.ok) {
        const introBuffer = await ttsResponse.arrayBuffer();
        const introBytes = new Uint8Array(introBuffer);

        const introFileName = `intro-${Date.now()}.mp3`;
        await supabase.storage.from('samples').upload(`generated/${introFileName}`, introBytes, {
          contentType: 'audio/mpeg',
          upsert: false
        });

        const { data: introUrlData } = supabase.storage.from('samples').getPublicUrl(`generated/${introFileName}`);
        introUrl = introUrlData.publicUrl;
        console.log('[BACKING-INTRO] Intro generated:', introUrl);
      }
    }

    console.log('[BACKING-INTRO] Generation complete');

    return new Response(
      JSON.stringify({
        success: true,
        instrumentalUrl: instrumentalUrlData.publicUrl,
        introUrl,
        metadata: {
          genre,
          bpm,
          mood,
          source: 'backing-with-intro',
          hasVocals: false,
          hasIntro: !!introUrl,
          duration: 30
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BACKING-INTRO] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Generation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
