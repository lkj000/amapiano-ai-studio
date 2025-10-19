import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo audio data - base64 encoded short audio files with actual audio content
const demoAudioFiles: Record<string, { data: string; contentType: string; filename: string }> = {
  'generated-track': {
    data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYADAAC/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+SkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSv7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/',
    contentType: 'audio/wav',
    filename: 'generated-track.wav'
  },
  'drums': {
    data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYADAAC/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+SkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSv7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/',
    contentType: 'audio/wav',
    filename: 'drums-stem.wav'
  },
  'bass': {
    data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMmpmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    contentType: 'audio/wav',
    filename: 'bass-stem.wav'
  },
  'piano': {
    data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMmpmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    contentType: 'audio/wav',
    filename: 'piano-stem.wav'
  },
  'vocals': {
    data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMmpmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    contentType: 'audio/wav',
    filename: 'vocals-stem.wav'
  },
  'other': {
    data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMmpmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    contentType: 'audio/wav',
    filename: 'other-stem.wav'
  },
  // Map sample IDs to demo audio files (for Samples page)
  'sample-1': { data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMmpmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', contentType: 'audio/wav', filename: 'kelvin-momo-piano.wav' },
  'sample-2': { data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYADAAC/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+SkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSv7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/', contentType: 'audio/wav', filename: 'log-drum-pattern.wav' },
  'sample-3': { data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMmpmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', contentType: 'audio/wav', filename: 'saxophone-melody.wav' },
  'sample-4': { data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYADAAC/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+SkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSv7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/', contentType: 'audio/wav', filename: 'afro-percussion.wav' },
  'sample-5': { data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMmpmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', contentType: 'audio/wav', filename: 'deep-bass.wav' },
  'sample-6': { data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMmpmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', contentType: 'audio/wav', filename: 'vocals-snippet.wav' },
  'sample-7': { data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYADAAC/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+SkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSv7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/', contentType: 'audio/wav', filename: 'rhodes-electric.wav' },
  'sample-8': { data: 'UklGRqQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMmpmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', contentType: 'audio/wav', filename: 'synth-pad.wav' }
};

// Generate a simple MIDI file (Type 0, single track)
function generateMidiPattern(patternName: string, index: number): Uint8Array {
  // Basic MIDI file structure: MThd header + MTrk track
  const midiData = [
    // MThd chunk
    0x4D, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // Header length (6 bytes)
    0x00, 0x00, // Format type 0
    0x00, 0x01, // Number of tracks (1)
    0x00, 0x60, // Ticks per quarter note (96)
    
    // MTrk chunk
    0x4D, 0x54, 0x72, 0x6B, // "MTrk"
    0x00, 0x00, 0x00, 0x3C, // Track length (will be adjusted)
    
    // Set tempo (500000 microseconds per quarter note = 120 BPM)
    0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20,
    
    // Note on events (C major chord progression)
    0x00, 0x90, 0x3C, 0x64, // C note on
    0x00, 0x90, 0x40, 0x64, // E note on
    0x00, 0x90, 0x43, 0x64, // G note on
    0x60, 0x90, 0x3C, 0x00, // C note off
    0x00, 0x90, 0x40, 0x00, // E note off
    0x00, 0x90, 0x43, 0x00, // G note off
    
    // Second chord
    0x00, 0x90, 0x3E, 0x64, // D note on
    0x00, 0x90, 0x41, 0x64, // F note on
    0x00, 0x90, 0x45, 0x64, // A note on
    0x60, 0x90, 0x3E, 0x00, // D note off
    0x00, 0x90, 0x41, 0x00, // F note off
    0x00, 0x90, 0x45, 0x00, // A note off
    
    // End of track
    0x00, 0xFF, 0x2F, 0x00
  ];
  
  return new Uint8Array(midiData);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Get file type from query parameter or pathname
    let fileType = url.searchParams.get('track');
    
    // If not in query params, try pathname
    if (!fileType) {
      fileType = url.pathname.split('/').pop();
    }

    console.log(`📥 Incoming request for: ${fileType}`);
    
    // Handle orchestrated tracks (generated by aura-conductor)
    if (fileType?.startsWith('orchestrated_')) {
      console.log(`🎼 Serving orchestrated track: ${fileType}`);
      // Return the generated-track demo file for orchestrated tracks
      const file = demoAudioFiles['generated-track'];
      const audioData = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));
      
      return new Response(audioData, {
        headers: {
          ...corsHeaders,
          'Content-Type': file.contentType,
          'Content-Disposition': `attachment; filename="${fileType}.wav"`,
          'Content-Length': audioData.length.toString(),
          'Cache-Control': 'no-cache',
        },
      });
    }
    
    // Handle MIDI pattern exports
    if (fileType?.startsWith('pattern-')) {
      const patternIndex = parseInt(fileType.replace('pattern-', ''));
      console.log(`🎵 Generating MIDI pattern ${patternIndex}`);
      
      const midiData = generateMidiPattern(`Pattern ${patternIndex}`, patternIndex);
      
      return new Response(midiData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/midi',
          'Content-Disposition': `attachment; filename="pattern_${patternIndex}.mid"`,
          'Content-Length': midiData.length.toString(),
        },
      });
    }
    
    // Strip -stem suffix if present (e.g., drums-stem -> drums)
    if (fileType) {
      fileType = fileType.replace(/-stem$/, '');
    }

    console.log(`🔍 Looking for audio file: ${fileType}`);

    if (!fileType || !demoAudioFiles[fileType]) {
      console.error(`❌ File not found: ${fileType}`);
      console.error(`Available files: ${Object.keys(demoAudioFiles).join(', ')}`);
      return new Response('File not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const file = demoAudioFiles[fileType];
    const audioData = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));

    console.log(`✅ Serving demo audio file: ${file.filename} (${audioData.length} bytes)`);

    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': file.contentType,
        'Content-Disposition': `inline; filename="${file.filename}"`,
        'Content-Length': audioData.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error serving demo audio file:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});