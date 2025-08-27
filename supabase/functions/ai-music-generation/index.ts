import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseAnonKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Music Generation request received');
    const { prompt, trackType } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log(`Generating ${trackType} content for prompt: ${prompt}`);

    // Generate AI content based on prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 2000,
        messages: [
          {
            role: 'system', 
            content: `You are an AI music producer specializing in Amapiano music. Generate realistic MIDI data and track information based on user prompts. Always return valid JSON with the following structure:
            {
              "trackName": "Generated track name",
              "instrument": "Instrument name", 
              "notes": [
                {
                  "id": "unique_id",
                  "pitch": 60,
                  "velocity": 80,
                  "startTime": 0,
                  "duration": 1
                }
              ],
              "clipDuration": 8,
              "color": "bg-color-class"
            }
            
            For Amapiano:
            - Log drums typically use pitches 36-51 (kick, snare, hi-hats)
            - Piano chords use pitches 48-84 with velocities 60-100
            - Bass lines use pitches 28-48 with strong velocities 90-127
            - Generate 4-8 bar patterns (16-32 beats total)
            - Use syncopated rhythms typical of Amapiano`
          },
          { role: 'user', content: `Generate a ${trackType} track for: ${prompt}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI generated content:', aiContent);

    // Parse AI response
    let musicData;
    try {
      // Extract JSON from AI response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        musicData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to default generation
      musicData = generateFallbackData(prompt, trackType);
    }

    // Create the new track structure
    const newTrack = {
      id: `track_${Date.now()}_ai`,
      type: trackType,
      name: musicData.trackName || `AI Generated ${trackType}`,
      instrument: musicData.instrument || 'AI Instrument',
      clips: [{
        id: `clip_${Date.now()}`,
        name: `AI ${musicData.trackName || 'Generated'}`,
        startTime: 0,
        duration: musicData.clipDuration || 8,
        notes: musicData.notes || [],
        audioUrl: trackType === 'audio' ? musicData.audioUrl : undefined
      }],
      mixer: {
        volume: 0.8,
        pan: 0,
        isMuted: false,
        isSolo: false,
        effects: trackType === 'midi' ? ['EQ'] : ['EQ', 'Compressor']
      },
      isArmed: false,
      color: musicData.color || 'bg-purple-500'
    };

    console.log('Generated track:', JSON.stringify(newTrack, null, 2));

    return new Response(JSON.stringify({ 
      success: true, 
      newTrack,
      message: `AI generated ${trackType} track: ${newTrack.name}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-music-generation function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      newTrack: generateFallbackData(req.url.includes('prompt=') ? 'fallback' : 'error', 'midi')
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackData(prompt: string, trackType: 'midi' | 'audio') {
  // Generate a basic pattern based on prompt keywords
  const notes = [];
  const isLogDrum = prompt.toLowerCase().includes('log') || prompt.toLowerCase().includes('drum');
  const isPiano = prompt.toLowerCase().includes('piano') || prompt.toLowerCase().includes('chord');
  const isBass = prompt.toLowerCase().includes('bass');

  if (isLogDrum) {
    // Generate log drum pattern
    for (let i = 0; i < 16; i += 2) {
      notes.push({
        id: `note_${i}_kick`,
        pitch: 36, // Kick
        velocity: 100,
        startTime: i,
        duration: 0.5
      });
      if (i % 4 === 2) {
        notes.push({
          id: `note_${i}_snare`,
          pitch: 38, // Snare
          velocity: 90,
          startTime: i,
          duration: 0.25
        });
      }
    }
  } else if (isPiano) {
    // Generate piano chord progression
    const chords = [
      [60, 64, 67], // C major
      [65, 69, 72], // F major
      [62, 65, 69], // D minor
      [67, 71, 74], // G major
    ];
    
    chords.forEach((chord, chordIndex) => {
      chord.forEach((pitch, noteIndex) => {
        notes.push({
          id: `note_${chordIndex}_${noteIndex}`,
          pitch,
          velocity: 70 + Math.random() * 20,
          startTime: chordIndex * 4,
          duration: 3.5
        });
      });
    });
  } else if (isBass) {
    // Generate bass line
    const bassNotes = [36, 41, 38, 43]; // Root progression
    bassNotes.forEach((pitch, index) => {
      notes.push({
        id: `note_bass_${index}`,
        pitch,
        velocity: 110,
        startTime: index * 4,
        duration: 3.5
      });
    });
  }

  return {
    id: `track_${Date.now()}_fallback`,
    type: trackType,
    name: `AI Generated ${isLogDrum ? 'Log Drums' : isPiano ? 'Piano' : isBass ? 'Bass' : 'Track'}`,
    instrument: isLogDrum ? 'Log Drum Kit' : isPiano ? 'Amapiano Piano' : isBass ? 'Deep Bass' : 'Synthesizer',
    clips: [{
      id: `clip_${Date.now()}`,
      name: 'AI Generated Pattern',
      startTime: 0,
      duration: 16,
      notes: notes
    }],
    mixer: {
      volume: 0.8,
      pan: 0,
      isMuted: false,
      isSolo: false,
      effects: ['EQ']
    },
    isArmed: false,
    color: isLogDrum ? 'bg-red-500' : isPiano ? 'bg-blue-500' : isBass ? 'bg-purple-500' : 'bg-green-500'
  };
}