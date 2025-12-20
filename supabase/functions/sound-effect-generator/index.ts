import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, duration } = await req.json();

    if (!description) {
      throw new Error('Description is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    console.log('Generating sound effect:', description, 'duration:', duration);

    // Use ElevenLabs Sound Effects API
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: description,
        duration_seconds: duration || 5,
        prompt_influence: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get the audio as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for JSON response
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log('Sound effect generated successfully, size:', audioBuffer.byteLength);

    return new Response(
      JSON.stringify({
        success: true,
        audioContent: base64Audio,
        contentType: 'audio/mpeg',
        description: description,
        duration: duration || 5,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sound effect generation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate sound effect',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
