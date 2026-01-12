import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
  text: string;
  voiceId: string;
  speed?: number;
  pitch?: number;
  stability?: number;
  similarity?: number;
}

// Voice ID mappings for ElevenLabs (if available)
const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  'za-male-1': '21m00Tcm4TlvDq8ikWAM', // Rachel as fallback
  'za-female-1': 'AZnzlk1XvdvUeBnXmlld',
  'za-male-2': 'VR6AewLTigWG4xSOukaG',
  'za-female-2': 'pNInz6obpgDQGcFmaJgB',
  'ng-male-1': 'yoZ06aMxZJJ28mfd3POQ',
  'ng-female-1': 'ThT5KcBeYPX3keUQqHPh',
  'us-male-1': 'TxGEqnHWrfWFTfGW9XjX',
  'us-female-1': 'EXAVITQu4vr4xnSDxMaL',
  'uk-male-1': 'N2lVS1w4EtoT3dr4eOWO',
  'uk-female-1': 'XB0fDUnXU5powFXDhCwa',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, speed = 1.0, stability = 0.5, similarity = 0.75 }: TTSRequest = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    if (text.length > 5000) {
      throw new Error('Text exceeds maximum length of 5000 characters');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      console.log('ElevenLabs API key not configured, returning null for client-side fallback');
      return new Response(
        JSON.stringify({
          success: true,
          audioContent: null,
          message: 'TTS API not configured, use browser fallback',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map internal voice ID to ElevenLabs voice ID
    const elevenLabsVoiceId = ELEVENLABS_VOICE_MAP[voiceId] || '21m00Tcm4TlvDq8ikWAM';

    console.log('Generating TTS:', { 
      textLength: text.length, 
      voiceId, 
      elevenLabsVoiceId,
      speed,
      stability,
      similarity 
    });

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability,
            similarity_boost: similarity,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log('TTS generated successfully, size:', audioBuffer.byteLength);

    return new Response(
      JSON.stringify({
        success: true,
        audioContent: base64Audio,
        contentType: 'audio/mpeg',
        voiceId,
        textLength: text.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate speech',
        audioContent: null,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
