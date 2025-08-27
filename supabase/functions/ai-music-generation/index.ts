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
        max_completion_tokens: 3000,
        messages: [
          {
            role: 'system', 
            content: `You are an expert AI music producer specializing in Amapiano and electronic music. Generate realistic, musically coherent MIDI patterns based on user prompts. Always return valid JSON with this exact structure:

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
              "clipDuration": 16,
              "color": "bg-purple-500"
            }

            MUSICAL GUIDELINES:
            
            For LOG DRUMS (Amapiano signature sound):
            - Kick: pitch 36, place on beats 1, 3, and syncopated positions
            - Snare: pitch 38, typically on beats 2, 4 with ghost notes
            - Hi-hats: pitches 42-46, create intricate 16th note patterns
            - Percussion: pitches 39-51, add shakers, claps, rim shots
            - Generate 16-32 beat patterns with signature log drum groove
            
            For PIANO/CHORDS:
            - Use jazz chord progressions (7ths, 9ths, 11ths)
            - Pitch range: 48-84 (C3 to C6)
            - Create chord inversions and voice leading
            - Add rhythmic stabs and sustained chords
            - Velocity variations: 60-100 for dynamics
            
            For BASS:
            - Sub-bass: pitches 24-48 (C1 to C3) 
            - Create walking basslines or repetitive grooves
            - Strong velocities: 90-127
            - Syncopated rhythms that lock with kick drum
            
            For SYNTH LEADS:
            - Pitch range: 60-96 (C4 to C7)
            - Create melodic phrases with space
            - Use call-and-response patterns
            - Velocity: 70-110
            
            RHYTHM GUIDELINES:
            - Use proper musical timing (4/4 time signature)
            - Create authentic swing and groove patterns
            - Add subtle timing variations for humanization
            - Generate 8-16 bar patterns for good loop points`
          },
          { 
            role: 'user', 
            content: `Generate a ${trackType} track for: "${prompt}". Make it musically sophisticated with proper chord progressions, rhythm patterns, and authentic ${trackType === 'midi' ? 'MIDI note sequences' : 'audio elements'}. Focus on creating something that sounds professional and musical.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      
      // Check if it's a quota exceeded error (429)
      if (response.status === 429) {
        console.log('OpenAI quota exceeded, using fallback generation');
        const fallbackTrack = generateFallbackData(prompt, trackType);
        
        return new Response(JSON.stringify({ 
          success: true, 
          newTrack: fallbackTrack,
          message: `AI quota exceeded, generated fallback ${trackType} track: ${fallbackTrack.name}`,
          fallback: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
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
  const notes = [];
  const isLogDrum = prompt.toLowerCase().includes('log') || prompt.toLowerCase().includes('drum');
  const isPiano = prompt.toLowerCase().includes('piano') || prompt.toLowerCase().includes('chord');
  const isBass = prompt.toLowerCase().includes('bass');
  const isSynth = prompt.toLowerCase().includes('synth') || prompt.toLowerCase().includes('lead');

  if (isLogDrum) {
    // Advanced log drum pattern with authentic Amapiano groove
    const kickPattern = [0, 2, 4.5, 6, 8, 10, 12.5, 14]; // Syncopated kick pattern
    const snarePattern = [4, 12]; // Snare on 2 and 4
    const hihatPattern = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5];
    
    kickPattern.forEach((time, i) => {
      notes.push({
        id: `kick_${i}`,
        pitch: 36,
        velocity: 100 + Math.random() * 15,
        startTime: time,
        duration: 0.4
      });
    });
    
    snarePattern.forEach((time, i) => {
      notes.push({
        id: `snare_${i}`,
        pitch: 38,
        velocity: 90 + Math.random() * 20,
        startTime: time,
        duration: 0.3
      });
    });
    
    hihatPattern.forEach((time, i) => {
      notes.push({
        id: `hihat_${i}`,
        pitch: 42,
        velocity: 40 + Math.random() * 30,
        startTime: time,
        duration: 0.1
      });
    });

    // Add percussion elements
    [1.5, 5.5, 9.5, 13.5].forEach((time, i) => {
      notes.push({
        id: `perc_${i}`,
        pitch: 39,
        velocity: 70,
        startTime: time,
        duration: 0.2
      });
    });

  } else if (isPiano) {
    // Advanced jazz chord progression with inversions
    const chordProgression = [
      { root: 60, chord: [60, 64, 67, 71], time: 0 },    // CM7
      { root: 57, chord: [57, 60, 64, 67], time: 4 },    // Am7
      { root: 65, chord: [65, 69, 72, 76], time: 8 },    // FM7
      { root: 67, chord: [67, 71, 74, 77], time: 12 }    // GM7
    ];
    
    chordProgression.forEach((chord, chordIndex) => {
      // Main chord
      chord.chord.forEach((pitch, noteIndex) => {
        notes.push({
          id: `chord_${chordIndex}_${noteIndex}`,
          pitch,
          velocity: 65 + Math.random() * 25,
          startTime: chord.time,
          duration: 3.8
        });
      });
      
      // Add rhythmic variations
      if (chordIndex % 2 === 1) {
        notes.push({
          id: `stab_${chordIndex}`,
          pitch: chord.root + 12,
          velocity: 80,
          startTime: chord.time + 2.5,
          duration: 0.5
        });
      }
    });

  } else if (isBass) {
    // Sophisticated bass line with walking pattern
    const bassLine = [
      { pitch: 36, time: 0, duration: 1 },      // C
      { pitch: 36, time: 1.5, duration: 0.5 },  // C
      { pitch: 33, time: 4, duration: 1 },      // A
      { pitch: 33, time: 5.5, duration: 0.5 },  // A
      { pitch: 41, time: 8, duration: 1 },      // F
      { pitch: 43, time: 10, duration: 0.5 },   // G
      { pitch: 43, time: 12, duration: 1 },     // G
      { pitch: 31, time: 14, duration: 1 }      // G (lower)
    ];
    
    bassLine.forEach((note, i) => {
      notes.push({
        id: `bass_${i}`,
        pitch: note.pitch,
        velocity: 110 + Math.random() * 15,
        startTime: note.time,
        duration: note.duration
      });
    });

  } else if (isSynth) {
    // Melodic synth lead
    const melody = [
      { pitch: 72, time: 0, duration: 1 },
      { pitch: 74, time: 1.5, duration: 0.5 },
      { pitch: 76, time: 2.5, duration: 1 },
      { pitch: 74, time: 4, duration: 0.5 },
      { pitch: 72, time: 5, duration: 1 },
      { pitch: 69, time: 8, duration: 2 },
      { pitch: 71, time: 11, duration: 1 },
      { pitch: 72, time: 13, duration: 2 }
    ];
    
    melody.forEach((note, i) => {
      notes.push({
        id: `synth_${i}`,
        pitch: note.pitch,
        velocity: 75 + Math.random() * 20,
        startTime: note.time,
        duration: note.duration
      });
    });
  } else {
    // Default pattern - simple chord progression
    const simpleChords = [
      [60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]
    ];
    
    simpleChords.forEach((chord, chordIndex) => {
      chord.forEach((pitch, noteIndex) => {
        notes.push({
          id: `default_${chordIndex}_${noteIndex}`,
          pitch,
          velocity: 70 + Math.random() * 20,
          startTime: chordIndex * 4,
          duration: 3.5
        });
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