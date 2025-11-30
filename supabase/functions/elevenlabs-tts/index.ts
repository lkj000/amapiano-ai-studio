import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

// Voice ID mapping for ElevenLabs voices
const VOICE_IDS = {
  'Aria': '9BWtsMINqrJLrRacOk9x',
  'Roger': 'CwhRBWXzGAHq8TQ4Fs17', 
  'Sarah': 'EXAVITQu4vr4xnSDxMaL',
  'Laura': 'FGY2WhTYpPnrIDTdsKH5',
  'Charlie': 'IKne3meq5aSn9XLyUdCD',
  'George': 'JBFqnCBsd6RMkjVDRZzb',
  'Callum': 'N2lVS1w4EtoT3dr4eOWO',
  'River': 'SAz9YHcvj6GT2YYXdXww',
  'Liam': 'TX3LPaxmHKxFdv7VOQHJ',
  'Charlotte': 'XB0fDUnXU5powFXDhCwa',
  'Alice': 'Xb7hH8MSUJpSbSDYk0k2',
  'Matilda': 'XrExE9yKIg1WjnnlVkGX',
  'Will': 'bIHbv24MWmeRgasZH58o',
  'Jessica': 'cgSgspJ2msm6clMCkdW9',
  'Eric': 'cjVigY5qzO86Huf0OWal',
  'Chris': 'iP95p4xoKVk53GoZ742B',
  'Brian': 'nPczCjzI2devNBz1zQrb',
  'Daniel': 'onwK4e9ZLuTAKqWW03F9',
  'Lily': 'pFZP5JQG7iQjIQuC4Bku',
  'Bill': 'pqHfZKP75CvOlQylNhV4'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { text, voice, model, voice_settings } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Get voice ID (default to Aria if not found)
    const voiceId = VOICE_IDS[voice as keyof typeof VOICE_IDS] || VOICE_IDS.Aria;
    
    // Default voice settings
    const defaultSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    };

    const finalSettings = { ...defaultSettings, ...voice_settings };

    console.log(`Generating speech with voice: ${voice} (${voiceId}), model: ${model}`);
    console.log(`Text length: ${text.length} characters`);

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: model || 'eleven_turbo_v2_5',
        voice_settings: finalSettings
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      let errorMessage = 'Failed to generate speech';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail?.message || errorJson.message || errorMessage;
      } catch {
        errorMessage = `API Error ${response.status}: ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Convert audio buffer to base64 (safely, without stack overflow)
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Audio = btoa(binary);

    console.log(`Successfully generated audio: ${arrayBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        voice: voice,
        voiceId: voiceId,
        model: model || 'eleven_turbo_v2_5',
        textLength: text.length,
        audioSize: arrayBuffer.byteLength
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check that your ElevenLabs API key is valid and has sufficient quota'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});