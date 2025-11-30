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
    console.log('[AUDIO-TO-MIDI] Processing request...');
    const contentType = req.headers.get('content-type') || '';
    console.log('[AUDIO-TO-MIDI] Content-Type:', contentType);

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    let dataUrl: string;

    // Handle both FormData (file upload) and JSON (URL reference)
    if (contentType.includes('multipart/form-data')) {
      console.log('[AUDIO-TO-MIDI] Processing as FormData...');
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File;

      if (!audioFile) {
        return new Response(
          JSON.stringify({ error: 'No audio file provided in FormData' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[AUDIO-TO-MIDI] File received:', audioFile.name, audioFile.size);

      // Convert file to base64 data URL
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      dataUrl = `data:${audioFile.type};base64,${base64}`;
    } else if (contentType.includes('application/json')) {
      console.log('[AUDIO-TO-MIDI] Processing as JSON...');
      const body = await req.json();
      console.log('[AUDIO-TO-MIDI] Request body:', JSON.stringify(body));

      if (!body.audioUrl) {
        return new Response(
          JSON.stringify({ error: 'No audio URL provided in request body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[AUDIO-TO-MIDI] URL received:', body.audioUrl);
      dataUrl = body.audioUrl;
    } else {
      console.log('[AUDIO-TO-MIDI] Unsupported content type:', contentType);
      return new Response(
        JSON.stringify({ error: `Unsupported content-type: ${contentType}. Expected multipart/form-data or application/json` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AUDIO-TO-MIDI] Calling Replicate Basic Pitch...');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'a7cf33cf63fca9c71f2235332af5a9fdfb7d23c459a0dc429daa203ff8e80c78',
        input: { audio_file: dataUrl }
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    console.log('[AUDIO-TO-MIDI] Prediction started:', prediction.id);

    // Poll for completion
    let result = prediction;
    let attempts = 0;

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` }
      });

      result = await statusResponse.json();
      attempts++;
    }

    if (result.status !== 'succeeded') {
      throw new Error('MIDI conversion failed or timeout');
    }

    console.log('[AUDIO-TO-MIDI] Complete:', result.output);

    // Download the MIDI file
    const midiResponse = await fetch(result.output);
    if (!midiResponse.ok) {
      throw new Error('Failed to download MIDI file');
    }

    const midiBlob = await midiResponse.arrayBuffer();
    const midiBase64 = btoa(String.fromCharCode(...new Uint8Array(midiBlob)));

    console.log('[AUDIO-TO-MIDI] MIDI file downloaded, size:', midiBlob.byteLength);

    return new Response(
      JSON.stringify({ 
        success: true,
        midiUrl: result.output,
        midiData: midiBase64,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AUDIO-TO-MIDI] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Conversion failed',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
