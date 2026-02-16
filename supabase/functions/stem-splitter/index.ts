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
    const contentType = req.headers.get('content-type') || '';
    
    // Handle status check (JSON body with predictionId)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { predictionId } = body;
      
      if (!predictionId) {
        throw new Error('predictionId is required for status check');
      }
      
      const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
      if (!REPLICATE_API_KEY) {
        throw new Error('REPLICATE_API_KEY not configured');
      }
      
      console.log('[STEM-SPLITTER] Checking status for:', predictionId);
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
      });
      
      const result = await pollResponse.json();
      console.log('[STEM-SPLITTER] Status:', result.status);
      
      if (result.status === 'failed') {
        return new Response(
          JSON.stringify({ 
            status: 'failed', 
            error: result.error || 'Stem separation failed' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (result.status === 'succeeded') {
        const stems = result.output;
        console.log('[STEM-SPLITTER] Separation complete, persisting stems to storage...');
        
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        const rawStems: Record<string, string> = {
          vocals: stems.vocals || stems.Vocals || '',
          drums: stems.drums || stems.Drums || '',
          bass: stems.bass || stems.Bass || '',
          guitar: stems.guitar || stems.Guitar || '',
          piano: stems.piano || stems.Piano || '',
          other: stems.other || stems.Other || '',
        };

        const persistedStems: Record<string, string> = {};
        const stemPrefix = `stems/${predictionId}`;

        for (const [name, url] of Object.entries(rawStems)) {
          if (!url) continue;
          try {
            const res = await fetch(url);
            if (!res.ok) { persistedStems[name] = url; continue; }
            const buf = new Uint8Array(await res.arrayBuffer());
            const path = `${stemPrefix}/${name}.mp3`;
            const { error: upErr } = await supabase.storage
              .from('audio-files')
              .upload(path, buf, { contentType: 'audio/mpeg', upsert: true });
            if (upErr) {
              console.error(`[STEM-SPLITTER] Failed to persist ${name}:`, upErr);
              persistedStems[name] = url; // fallback to Replicate URL
            } else {
              const { data: pubUrl } = supabase.storage.from('audio-files').getPublicUrl(path);
              persistedStems[name] = pubUrl.publicUrl;
              console.log(`[STEM-SPLITTER] Persisted ${name} → ${pubUrl.publicUrl}`);
            }
          } catch (e) {
            console.error(`[STEM-SPLITTER] Error persisting ${name}:`, e);
            persistedStems[name] = url;
          }
        }

        return new Response(
          JSON.stringify({
            status: 'succeeded',
            success: true,
            stems: persistedStems,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Still processing
      return new Response(
        JSON.stringify({ 
          status: result.status,
          progress: result.logs ? result.logs.length : 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle new separation request (FormData with audio file)
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      throw new Error('Audio file is required');
    }

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('[STEM-SPLITTER] Starting stem separation for:', audioFile.name);

    // Upload the audio file to storage first
    const arrayBuffer = await audioFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const fileName = `stem-input-${Date.now()}.${audioFile.name.split('.').pop() || 'mp3'}`;
    
    const { error: uploadError } = await supabase.storage
      .from('temp-audio')
      .upload(fileName, bytes, {
        contentType: audioFile.type || 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('[STEM-SPLITTER] Upload error:', uploadError);
      throw new Error('Failed to upload audio file');
    }

    const { data: urlData } = supabase.storage.from('temp-audio').getPublicUrl(fileName);
    const audioUrl = urlData.publicUrl;
    
    console.log('[STEM-SPLITTER] Audio uploaded:', audioUrl);

    // Use Demucs htdemucs_6s model for 6-stem separation (vocals, drums, bass, guitar, piano, other)
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953', // cjwbw/demucs
        input: {
          audio: audioUrl,
          model_name: 'htdemucs_6s', // 6-stem model: vocals, drums, bass, guitar, piano, other
          output_format: 'mp3',
        },
      }),
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('[STEM-SPLITTER] Replicate error:', errorText);
      throw new Error(`Stem separation API error: ${replicateResponse.status}`);
    }

    const prediction = await replicateResponse.json();
    console.log('[STEM-SPLITTER] Prediction created:', prediction.id);

    // Return prediction ID immediately - client will poll for status
    return new Response(
      JSON.stringify({
        status: 'starting',
        predictionId: prediction.id,
        originalFileName: audioFile.name,
        tempFileName: fileName, // For cleanup later
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STEM-SPLITTER] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Stem separation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
