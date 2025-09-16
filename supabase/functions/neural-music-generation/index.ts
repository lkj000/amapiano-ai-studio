import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Neural Music Generation request received');
    const { type, audioData, mode, customInstructions, outputFormat, amapiano_style } = await req.json();

    if (type !== 'voice_to_music' || !audioData) {
      throw new Error('Invalid request: type must be voice_to_music and audioData is required');
    }

    console.log(`Processing ${mode} voice input for amapiano generation`);

    // Step 1: Transcribe audio using OpenAI Whisper
    let transcript = '';
    try {
      console.log('Transcribing audio with Whisper...');
      
      // Convert base64 to binary
      const binaryAudio = atob(audioData);
      const audioBytes = new Uint8Array(binaryAudio.length);
      for (let i = 0; i < binaryAudio.length; i++) {
        audioBytes[i] = binaryAudio.charCodeAt(i);
      }

      // Prepare form data for Whisper
      const formData = new FormData();
      const audioBlob = new Blob([audioBytes], { type: 'audio/webm' });
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: formData,
      });

      if (whisperResponse.ok) {
        const whisperResult = await whisperResponse.json();
        transcript = whisperResult.text;
        console.log('Transcription:', transcript);
      } else {
        console.warn('Whisper transcription failed, using mode-based fallback');
        transcript = `${mode} recording processed`;
      }
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      transcript = `${mode} recording processed`;
    }

    // Step 2: Generate music based on mode and transcript
    const musicPrompts = {
      melody: `Convert this hummed melody into a full amapiano track: "${transcript}". Create a sophisticated arrangement with piano chords, log drums, bass, and atmospheric pads. Make it soulful and authentic to South African amapiano culture.`,
      instruction: `Create an amapiano track based on this description: "${transcript}". ${customInstructions ? `Additional requirements: ${customInstructions}` : ''} Focus on authentic South African elements with modern production.`,
      beatbox: `Transform this beatbox rhythm into amapiano drums: "${transcript}". Create a full drum arrangement with log drums, percussion, and rhythmic elements that capture the essence of the beatbox pattern.`
    };

    const prompt = musicPrompts[mode as keyof typeof musicPrompts] || musicPrompts.instruction;

    console.log('Generating music with prompt:', prompt);

    // Generate music using GPT
    const musicResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 4000,
        messages: [
          {
            role: 'system',
            content: `You are an expert amapiano music producer. Create authentic South African amapiano music with deep cultural understanding. 

RETURN ONLY VALID JSON with this structure:
{
  "transcript": "processed text",
  "audioUrl": "",
  "midiData": {
    "tracks": [
      {
        "name": "track name",
        "instrument": "instrument name",
        "notes": [
          {
            "id": "unique_id",
            "pitch": 60,
            "velocity": 80,
            "startTime": 0.0,
            "duration": 1.0
          }
        ]
      }
    ]
  },
  "metadata": {
    "bpm": 118,
    "key": "F#m",
    "genre": "Amapiano",
    "confidence": 0.85
  }
}

Create multiple tracks (piano, bass, drums, pads) with authentic amapiano patterns:
- Piano: Jazz-influenced chords, syncopated rhythms
- Log Drums: Signature amapiano percussion with deep kicks and crisp snares
- Bass: Deep sub-bass lines, rhythmic and melodic
- Pads: Atmospheric textures and harmonic support`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!musicResponse.ok) {
      const errorText = await musicResponse.text();
      console.error('OpenAI music generation error:', errorText);
      throw new Error(`Music generation failed: ${musicResponse.status}`);
    }

    const musicResult = await musicResponse.json();
    const musicContent = musicResult.choices[0].message.content;

    console.log('AI generated music content:', musicContent);

    // Parse the JSON response
    let musicData;
    try {
      const jsonMatch = musicContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        musicData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback generation
      musicData = generateFallbackMusic(mode, transcript);
    }

    // Ensure transcript is included
    musicData.transcript = transcript || musicData.transcript || `${mode} recording processed`;

    console.log('Returning music data:', JSON.stringify(musicData, null, 2));

    return new Response(JSON.stringify(musicData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in neural-music-generation function:', error);
    
    // Return fallback music data
    const fallbackData = generateFallbackMusic('melody', 'fallback generation');
    
    return new Response(JSON.stringify({
      error: error.message,
      ...fallbackData
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackMusic(mode: string, transcript: string) {
  const notes = [];
  
  if (mode === 'beatbox') {
    // Generate drum pattern
    const kickTimes = [0, 2, 4.5, 6, 8, 10, 12.5, 14];
    const snareTimes = [4, 12];
    const hihatTimes = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5];
    
    kickTimes.forEach((time, i) => {
      notes.push({
        id: `kick_${i}`,
        pitch: 36,
        velocity: 100,
        startTime: time,
        duration: 0.4
      });
    });
    
    snareTimes.forEach((time, i) => {
      notes.push({
        id: `snare_${i}`,
        pitch: 38,
        velocity: 90,
        startTime: time,
        duration: 0.3
      });
    });
    
    hihatTimes.forEach((time, i) => {
      notes.push({
        id: `hihat_${i}`,
        pitch: 42,
        velocity: 60,
        startTime: time,
        duration: 0.1
      });
    });
  } else {
    // Generate piano/melody pattern
    const chordProgression = [
      { root: 60, chord: [60, 64, 67, 71], time: 0 },
      { root: 57, chord: [57, 60, 64, 67], time: 4 },
      { root: 65, chord: [65, 69, 72, 76], time: 8 },
      { root: 67, chord: [67, 71, 74, 77], time: 12 }
    ];
    
    chordProgression.forEach((chord, chordIndex) => {
      chord.chord.forEach((pitch, noteIndex) => {
        notes.push({
          id: `chord_${chordIndex}_${noteIndex}`,
          pitch,
          velocity: 70,
          startTime: chord.time,
          duration: 3.5
        });
      });
    });
  }

  return {
    transcript: transcript,
    audioUrl: "",
    midiData: {
      tracks: [
        {
          name: `Generated ${mode === 'beatbox' ? 'Drums' : 'Piano'}`,
          instrument: mode === 'beatbox' ? 'Log Drum Kit' : 'Amapiano Piano',
          notes: notes
        }
      ]
    },
    metadata: {
      bpm: 118,
      key: "F#m",
      genre: "Amapiano",
      confidence: 0.75
    }
  };
}