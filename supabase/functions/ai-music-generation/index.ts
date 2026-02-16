import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, lyrics, trackType, generationType, bpm, genre, duration, selectedArtistStyle, referenceAnalysis } = await req.json();

    console.log('[AI-MUSIC] Request:', { prompt: prompt?.substring(0, 80), lyrics: lyrics?.substring(0, 80), trackType, generationType, bpm, genre, duration });

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured. Add it in project secrets.');
    }

    // Step 1: Build an enhanced music prompt using Lovable AI
    let musicPrompt = '';

    if (LOVABLE_API_KEY) {
      console.log('[AI-MUSIC] Enhancing prompt with Lovable AI');
      try {
        const refContext = referenceAnalysis
          ? `\nReference track analysis: BPM=${referenceAnalysis.bpm}, Key=${referenceAnalysis.key}, Genre=${referenceAnalysis.genre}, Mood=${referenceAnalysis.mood}, Energy=${referenceAnalysis.energy}, Instruments=${referenceAnalysis.instruments?.join(', ')}`
          : '';

        const artistContext = selectedArtistStyle ? `\nArtist style inspiration: ${selectedArtistStyle}` : '';
        const lyricsContext = lyrics ? `\nLyrics to incorporate:\n${lyrics}` : '';

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: `You are an expert Amapiano music production prompt engineer. Given the user's description, reference analysis, lyrics, and parameters, create a vivid, concise music generation prompt (max 200 words) that captures the exact sonic character. Focus on: instrumentation (log drums, piano stabs, bass), rhythm patterns, energy arc, tempo, and sonic texture. If lyrics are provided, incorporate their mood and theme into the musical direction. Do NOT include the lyrics text in the output. Output ONLY the prompt text.`
              },
              {
                role: 'user',
                content: `User prompt: ${prompt}
Genre: ${genre || 'Amapiano'}
BPM: ${bpm || 112}
Duration: ${duration || 180} seconds
Generation type: ${generationType || 'prompt'}${refContext}${artistContext}${lyricsContext}

Create a music generation prompt for this track.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          musicPrompt = aiData.choices?.[0]?.message?.content?.trim() || '';
          console.log('[AI-MUSIC] AI-enhanced prompt:', musicPrompt.substring(0, 120));
        } else {
          console.warn('[AI-MUSIC] AI enhancement failed:', aiResponse.status);
        }
      } catch (aiErr) {
        console.warn('[AI-MUSIC] AI enhancement error:', aiErr);
      }
    }

    // Fallback prompt
    if (!musicPrompt) {
      const parts = [
        genre || 'Amapiano',
        `${bpm || 112} BPM`,
        prompt,
      ];
      if (selectedArtistStyle) parts.push(`in the style of ${selectedArtistStyle}`);
      if (referenceAnalysis) {
        parts.push(`${referenceAnalysis.mood} mood`);
        parts.push(`key of ${referenceAnalysis.key}`);
      }
      musicPrompt = parts.join(', ');
    }

    console.log('[AI-MUSIC] Final prompt:', musicPrompt);

    // Step 2: Generate audio via ElevenLabs Music API
    // ElevenLabs Music API max is currently ~330 seconds
    const durationSeconds = Math.min(Math.max(duration || 180, 15), 330);
    console.log('[AI-MUSIC] Requesting ElevenLabs Music generation, duration:', durationSeconds, 'seconds');

    const musicResponse = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: musicPrompt,
        duration_seconds: durationSeconds,
      }),
    });

    if (!musicResponse.ok) {
      const errorText = await musicResponse.text();
      console.error('[AI-MUSIC] ElevenLabs Music API error:', musicResponse.status, errorText);
      
      if (musicResponse.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Rate limit reached. Please wait before trying again.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle bad_prompt rejection - retry with ElevenLabs' suggested prompt
      if (musicResponse.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          const suggestedPrompt = errorData?.detail?.data?.prompt_suggestion;
          if (suggestedPrompt && errorData?.detail?.status === 'bad_prompt') {
            console.log('[AI-MUSIC] Prompt rejected, retrying with suggested prompt:', suggestedPrompt.substring(0, 100));
            
            const retryResponse = await fetch('https://api.elevenlabs.io/v1/music', {
              method: 'POST',
              headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: suggestedPrompt,
                duration_seconds: durationSeconds,
              }),
            });

            if (retryResponse.ok) {
              // Use the retry response and continue
              const retryBuffer = await retryResponse.arrayBuffer();
              const retryBase64 = uint8ToBase64(new Uint8Array(retryBuffer));
              console.log('[AI-MUSIC] Retry succeeded, size:', retryBuffer.byteLength, 'bytes');

              const trackName = `AI ${genre || 'Amapiano'} - ${bpm || 112} BPM`;
              return new Response(JSON.stringify({
                success: true,
                audioBase64: retryBase64,
                audioFormat: 'audio/mpeg',
                newTrack: {
                  id: `track_${Date.now()}_ai`,
                  type: 'audio',
                  name: trackName,
                  instrument: genre || 'Amapiano',
                  clips: [{ id: `clip_${Date.now()}`, name: trackName, startTime: 0, duration: durationSeconds, audioUrl: null }],
                  mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: ['EQ', 'Compressor'] },
                  isArmed: false,
                  color: 'bg-purple-500',
                },
                metadata: { title: trackName, genre: genre || 'Amapiano', bpm: bpm || 112, duration: durationSeconds, source: 'elevenlabs-music', prompt: suggestedPrompt.substring(0, 200) },
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            console.error('[AI-MUSIC] Retry also failed:', retryResponse.status);
          }
        } catch (parseErr) {
          console.error('[AI-MUSIC] Failed to parse error for retry:', parseErr);
        }
      }
      
      throw new Error(`ElevenLabs Music API error: ${musicResponse.status}`);
    }

    // ElevenLabs returns raw audio bytes (MP3)
    const audioBuffer = await musicResponse.arrayBuffer();
    const base64Audio = uint8ToBase64(new Uint8Array(audioBuffer));

    console.log('[AI-MUSIC] Audio generated successfully, size:', audioBuffer.byteLength, 'bytes');

    const trackName = `AI ${genre || 'Amapiano'} - ${bpm || 112} BPM`;

    return new Response(JSON.stringify({
      success: true,
      audioBase64: base64Audio,
      audioFormat: 'audio/mpeg',
      newTrack: {
        id: `track_${Date.now()}_ai`,
        type: 'audio',
        name: trackName,
        instrument: genre || 'Amapiano',
        clips: [{
          id: `clip_${Date.now()}`,
          name: trackName,
          startTime: 0,
          duration: durationSeconds,
          audioUrl: null, // Client will create blob URL from base64
        }],
        mixer: {
          volume: 0.8,
          pan: 0,
          isMuted: false,
          isSolo: false,
          effects: ['EQ', 'Compressor'],
        },
        isArmed: false,
        color: 'bg-purple-500',
      },
      metadata: {
        title: trackName,
        genre: genre || 'Amapiano',
        bpm: bpm || 112,
        duration: durationSeconds,
        source: 'elevenlabs-music',
        prompt: musicPrompt.substring(0, 200),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[AI-MUSIC] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Music generation failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
