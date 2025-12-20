import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APIBOX_BASE_URL = 'https://apibox.erweima.ai/api/v1/generate';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, genre, bpm, mood, title, customMode = true, instrumental = false } = await req.json();
    
    const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');
    if (!SUNO_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'SUNO_API_KEY not configured',
          message: 'Please add your API.box Suno API key to use this feature. Get one at https://apibox.erweima.ai',
          requiresSetup: true
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[APIBOX-SUNO] Starting song generation');

    // Build the style/genre prompt
    const stylePrompt = `${genre || 'Amapiano'}, ${bpm || 112} BPM, ${mood || 'energetic African dance music'}`;

    // API.box Suno API request body
    const requestBody = {
      prompt: lyrics?.substring(0, 3000) || `Create an ${genre || 'Amapiano'} track`,
      style: stylePrompt,
      title: title || `${genre || 'Amapiano'} Track`,
      customMode: customMode,
      instrumental: instrumental,
      model: 'V4', // Use Suno V4 for best quality
      callbackUrl: '', // Optional webhook for async results
    };

    console.log('[APIBOX-SUNO] Request body:', JSON.stringify(requestBody));

    // Submit generation task
    const response = await fetch(APIBOX_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[APIBOX-SUNO] API error:', response.status, errorText);
      throw new Error(`API.box Suno API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[APIBOX-SUNO] Initial response:', JSON.stringify(result));

    // Check if we got a task ID for async processing
    if (result.data?.taskId) {
      const taskId = result.data.taskId;
      console.log('[APIBOX-SUNO] Task submitted, polling for results. TaskId:', taskId);

      // Poll for results (max 120 seconds)
      const maxAttempts = 40;
      const pollInterval = 3000; // 3 seconds

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(`https://apibox.erweima.ai/api/v1/generate/record-info?taskId=${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUNO_API_KEY}`,
          },
        });

        if (!statusResponse.ok) {
          console.error('[APIBOX-SUNO] Status check failed:', statusResponse.status);
          continue;
        }

        const statusResult = await statusResponse.json();
        console.log('[APIBOX-SUNO] Status check attempt', attempt + 1, ':', statusResult.data?.status);

        if (statusResult.data?.status === 'SUCCESS' || statusResult.data?.status === 'completed') {
          const tracks = statusResult.data?.response?.sunoData || statusResult.data?.data || [];
          
          if (tracks.length > 0) {
            const track = tracks[0];
            return new Response(
              JSON.stringify({
                success: true,
                audioUrl: track.audioUrl || track.audio_url,
                streamAudioUrl: track.streamAudioUrl,
                imageUrl: track.imageUrl || track.image_url,
                metadata: {
                  title: track.title,
                  genre,
                  bpm,
                  mood,
                  style: stylePrompt,
                  source: 'apibox-suno-v4',
                  hasVocals: !instrumental,
                  duration: track.duration || 180,
                  modelVersion: 'V4',
                  taskId: taskId
                },
                allTracks: tracks // Return all generated variations
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else if (statusResult.data?.status === 'FAILED' || statusResult.data?.status === 'failed') {
          throw new Error('Song generation failed: ' + (statusResult.data?.errorMessage || 'Unknown error'));
        }
      }

      // If we get here, generation timed out - return task ID for client-side polling
      return new Response(
        JSON.stringify({
          success: false,
          pending: true,
          taskId: taskId,
          message: 'Generation in progress. Use taskId to check status.',
          pollUrl: `https://apibox.erweima.ai/api/v1/generate/record-info?taskId=${taskId}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Direct response (if API returns immediately)
    const audioUrl = result.data?.audioUrl || result.audio_url;
    if (audioUrl) {
      return new Response(
        JSON.stringify({
          success: true,
          audioUrl,
          metadata: {
            genre,
            bpm,
            mood,
            source: 'apibox-suno-v4',
            hasVocals: !instrumental,
            duration: result.data?.duration || 180
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Unexpected response format from API.box');

  } catch (error) {
    console.error('[APIBOX-SUNO] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Song generation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
