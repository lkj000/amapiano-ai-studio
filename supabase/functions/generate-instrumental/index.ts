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
    const { genre, bpm, mood, energy, subgenre } = await req.json();

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('[INSTRUMENTAL] Generating pure instrumental track');

    // Build detailed instrumental prompt
    const energyDesc = energy > 70 ? 'high energy, driving' : energy > 40 ? 'medium energy, groovy' : 'chill, laid-back';
    const subgenreDesc = subgenre ? `${subgenre} style` : '';
    
    const musicPrompt = `${genre || 'Amapiano'} instrumental ${subgenreDesc}, ${bpm || 112} BPM, ${energyDesc}, ${mood || 'African electronic dance music'}, log drums, deep bass, piano melodies, no vocals, professional production quality`;

    console.log('[INSTRUMENTAL] Prompt:', musicPrompt);

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
      console.error('[INSTRUMENTAL] Replicate error:', errorText);
      throw new Error(`Replicate API error: ${replicateResponse.status}`);
    }

    const prediction = await replicateResponse.json();
    console.log('[INSTRUMENTAL] Prediction created:', prediction.id);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60;

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
      });
      
      result = await pollResponse.json();
      attempts++;
      console.log('[INSTRUMENTAL] Poll attempt', attempts, '- Status:', result.status);
    }

    if (result.status === 'failed') {
      throw new Error(`Music generation failed: ${result.error || 'Unknown error'}`);
    }

    if (result.status !== 'succeeded') {
      throw new Error('Music generation timed out');
    }

    const audioUrl = result.output;
    console.log('[INSTRUMENTAL] Generated audio URL:', audioUrl);

    // Download and store in Supabase
    const audioResponse = await fetch(audioUrl);
    const audioArrayBuffer = await audioResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioArrayBuffer);

    const fileName = `instrumental-${Date.now()}.mp3`;
    const filePath = `generated/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('samples')
      .upload(filePath, audioBytes, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('[INSTRUMENTAL] Upload error:', uploadError);
      // Return original URL if upload fails
      return new Response(
        JSON.stringify({
          success: true,
          audioUrl,
          metadata: { genre, bpm, mood, energy, source: 'replicate-musicgen', hasVocals: false, duration: 30 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: urlData } = supabase.storage.from('samples').getPublicUrl(filePath);

    console.log('[INSTRUMENTAL] Complete, stored at:', urlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: urlData.publicUrl,
        metadata: {
          genre,
          bpm,
          mood,
          energy,
          source: 'replicate-musicgen',
          hasVocals: false,
          duration: 30
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[INSTRUMENTAL] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Instrumental generation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
