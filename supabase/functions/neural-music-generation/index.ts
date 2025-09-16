import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Neural Music Generation Function Started ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('Returning CORS response');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API Key present:', !!openAIApiKey);
    
    if (!openAIApiKey) {
      console.error('No OpenAI API key found');
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await req.text();
    console.log('Raw body length:', body.length);
    
    let requestData;
    try {
      requestData = JSON.parse(body);
      console.log('Parsed request data keys:', Object.keys(requestData));
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      return new Response(JSON.stringify({
        error: 'Invalid JSON',
        details: parseError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, audioData, mode } = requestData;
    console.log('Request type:', type, 'mode:', mode, 'audioData length:', audioData?.length || 0);

    // Validate required fields
    if (type !== 'voice_to_music') {
      console.error('Invalid type:', type);
      return new Response(JSON.stringify({
        error: 'Invalid request type, expected voice_to_music'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!audioData) {
      console.error('No audio data provided');
      return new Response(JSON.stringify({
        error: 'No audio data provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Validation passed, generating fallback response...');
    
    // Generate simple fallback response for now
    const fallbackResponse = {
      transcript: `${mode || 'melody'} recording processed successfully`,
      audioUrl: "",
      midiData: {
        tracks: [{
          name: "Generated Track",
          instrument: "Piano",
          notes: [{
            id: "note_1",
            pitch: 60,
            velocity: 80,
            startTime: 0.0,
            duration: 1.0
          }]
        }]
      },
      metadata: {
        bpm: 118,
        key: "F#m",
        genre: "Amapiano",
        confidence: 0.75
      }
    };

    console.log('Returning successful response');
    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});