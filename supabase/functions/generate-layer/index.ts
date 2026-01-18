import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AI Layer Generation - LANDR Layers Style
 * 
 * Generates NEW instrumental layers that fit the context of an uploaded track.
 * Uses AI music generation (MusicGen) with prompts informed by track analysis.
 */

interface LayerRequest {
  layerType: 'drums' | 'bass' | 'harmony' | 'texture' | 'melody';
  analysisData: {
    bpm: number;
    key: string;
    scale: string;
    genre?: string;
    energy?: number;
  };
  settings: {
    intensity: number;
    complexity: number;
    fills: number;
    dynamics: number;
  };
  duration?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { layerType, analysisData, settings, duration = 30 }: LayerRequest = await req.json();

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('[GENERATE-LAYER] Generating:', layerType, 'with analysis:', analysisData);

    // Build context-aware prompt based on layer type and analysis
    const prompt = buildLayerPrompt(layerType, analysisData, settings);
    console.log('[GENERATE-LAYER] Prompt:', prompt);

    // Use MusicGen for generation
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
        input: {
          prompt,
          duration: Math.min(duration, 30),
          model_version: 'stereo-large',
          output_format: 'wav',
          normalization_strategy: 'peak',
        },
      }),
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('[GENERATE-LAYER] Replicate error:', errorText);
      throw new Error(`Replicate API error: ${replicateResponse.status}`);
    }

    const prediction = await replicateResponse.json();
    console.log('[GENERATE-LAYER] Prediction created:', prediction.id);

    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
      });
      
      result = await pollResponse.json();
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log('[GENERATE-LAYER] Poll attempt', attempts, '- Status:', result.status);
      }
    }

    if (result.status === 'failed') {
      throw new Error(`Layer generation failed: ${result.error || 'Unknown error'}`);
    }

    if (result.status !== 'succeeded') {
      throw new Error('Layer generation timed out');
    }

    const audioUrl = result.output;
    console.log('[GENERATE-LAYER] Generated audio URL:', audioUrl);

    // Download and store in Supabase
    const audioResponse = await fetch(audioUrl);
    const audioArrayBuffer = await audioResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioArrayBuffer);

    const fileName = `layer-${layerType}-${Date.now()}.wav`;
    const filePath = `layers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, audioBytes, {
        contentType: 'audio/wav',
        upsert: false
      });

    if (uploadError) {
      console.error('[GENERATE-LAYER] Upload error:', uploadError);
      // Return original URL if upload fails
      return new Response(
        JSON.stringify({
          success: true,
          audioUrl,
          layerType,
          metadata: { ...analysisData, settings, generated: true }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: urlData } = supabase.storage.from('audio-files').getPublicUrl(filePath);

    console.log('[GENERATE-LAYER] Complete, stored at:', urlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: urlData.publicUrl,
        layerType,
        metadata: {
          ...analysisData,
          settings,
          generated: true,
          prompt
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GENERATE-LAYER] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Layer generation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildLayerPrompt(
  layerType: string,
  analysis: { bpm: number; key: string; scale: string; genre?: string; energy?: number },
  settings: { intensity: number; complexity: number; fills: number; dynamics: number }
): string {
  const { bpm, key, scale, genre = 'Amapiano', energy = 70 } = analysis;
  const { intensity, complexity, fills, dynamics } = settings;

  // Convert settings to descriptive terms
  const intensityDesc = intensity > 70 ? 'powerful, driving' : intensity > 40 ? 'steady, grooving' : 'subtle, laid-back';
  const complexityDesc = complexity > 70 ? 'complex, intricate patterns' : complexity > 40 ? 'moderate complexity' : 'simple, minimal';
  const fillsDesc = fills > 60 ? 'with frequent fills and variations' : fills > 30 ? 'with occasional fills' : 'steady, no fills';
  const dynamicsDesc = dynamics > 70 ? 'wide dynamic range' : dynamics > 40 ? 'moderate dynamics' : 'consistent dynamics';
  const energyDesc = energy > 70 ? 'high energy' : energy > 40 ? 'medium energy' : 'chill, relaxed';

  const basePrompt = `${bpm} BPM, ${key} ${scale}, ${genre}, ${energyDesc}, professional production quality`;

  const layerPrompts: Record<string, string> = {
    drums: `${intensityDesc} drum pattern, ${complexityDesc}, ${fillsDesc}, ${dynamicsDesc}, ${basePrompt}, log drums, shakers, percussion, no melody, no bass, isolated drums only`,
    
    bass: `${intensityDesc} bassline, ${complexityDesc}, ${dynamicsDesc}, ${basePrompt}, deep sub-bass, groovy bass pattern, no drums, no melody, isolated bass only`,
    
    harmony: `${intensityDesc} piano chords, ${complexityDesc}, ${fillsDesc}, ${dynamicsDesc}, ${basePrompt}, gospel-influenced piano voicings, pad harmonies, no drums, no bass, isolated harmony only`,
    
    texture: `ambient texture layer, atmospheric pads, ${complexityDesc}, ${dynamicsDesc}, ${basePrompt}, subtle textures, no drums, no bass, isolated atmospheric texture only`,
    
    melody: `${intensityDesc} melodic phrase, ${complexityDesc}, ${fillsDesc}, ${dynamicsDesc}, ${basePrompt}, catchy hook, memorable melody, synth lead, no drums, no bass, isolated melody only`
  };

  return layerPrompts[layerType] || layerPrompts.drums;
}
