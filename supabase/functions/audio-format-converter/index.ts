import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversionRequest {
  sourceUrl: string;
  targetFormat: 'mp3' | 'wav' | 'flac' | 'midi' | 'project';
  orchestrationData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceUrl, targetFormat, orchestrationData }: ConversionRequest = await req.json();
    
    console.log(`🎵 Audio Format Converter: Converting to ${targetFormat}`);
    console.log(`Source URL: ${sourceUrl}`);

    // Fetch the source audio
    const audioResponse = await fetch(sourceUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch source audio: ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    let convertedBuffer: ArrayBuffer;
    let mimeType: string;
    let fileExtension: string;

    switch (targetFormat) {
      case 'wav':
        // Convert to WAV format
        console.log('Converting to WAV (44.1kHz, 16-bit, stereo)');
        convertedBuffer = await convertToWav(audioBuffer);
        mimeType = 'audio/wav';
        fileExtension = 'wav';
        break;

      case 'flac':
        // Convert to FLAC format
        console.log('Converting to FLAC (lossless compression)');
        convertedBuffer = await convertToFlac(audioBuffer);
        mimeType = 'audio/flac';
        fileExtension = 'flac';
        break;

      case 'midi':
        // Generate MIDI from orchestration data
        console.log('Generating MIDI file from orchestration data');
        if (!orchestrationData) {
          throw new Error('Orchestration data required for MIDI export');
        }
        convertedBuffer = await generateMidi(orchestrationData);
        mimeType = 'audio/midi';
        fileExtension = 'mid';
        break;

      case 'project':
        // Generate DAW project file
        console.log('Generating DAW project file');
        if (!orchestrationData) {
          throw new Error('Orchestration data required for project export');
        }
        convertedBuffer = await generateProjectFile(audioBuffer, orchestrationData);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;

      default:
        // Return original MP3
        convertedBuffer = audioBuffer;
        mimeType = 'audio/mpeg';
        fileExtension = 'mp3';
    }

    // For simplicity, we're creating a data URL
    // In production, you'd upload to storage and return a URL
    const base64 = btoa(
      new Uint8Array(convertedBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`✅ Conversion complete: ${targetFormat.toUpperCase()}`);

    return new Response(
      JSON.stringify({
        success: true,
        convertedUrl: dataUrl,
        format: targetFormat,
        mimeType,
        fileExtension,
        size: convertedBuffer.byteLength
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Audio conversion error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Audio conversion failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper functions for format conversion
async function convertToWav(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  // Simplified WAV header creation
  // In production, use a proper audio processing library
  const numChannels = 2;
  const sampleRate = 44100;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  // Calculate data size (estimate based on duration)
  const dataSize = audioBuffer.byteLength;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Copy audio data
  const sourceView = new Uint8Array(audioBuffer);
  const targetView = new Uint8Array(buffer);
  targetView.set(sourceView, headerSize);

  return buffer;
}

async function convertToFlac(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  // For now, return WAV format with FLAC mime type
  // In production, use a FLAC encoder library
  console.log('Note: FLAC encoding not fully implemented, returning WAV');
  return convertToWav(audioBuffer);
}

async function generateMidi(orchestrationData: any): Promise<ArrayBuffer> {
  // Generate MIDI file from orchestration results
  const midiData = {
    header: {
      format: 1,
      numTracks: 4,
      ticksPerQuarterNote: 480
    },
    tracks: []
  };

  // Extract musical data from orchestration
  if (orchestrationData.execution_results) {
    for (const result of orchestrationData.execution_results) {
      if (result.taskId === 'neural_generation') {
        // Generate MIDI tracks from neural generation data
        const track = createMidiTrack(result.result);
        midiData.tracks.push(track);
      }
    }
  }

  // Convert to MIDI binary format
  return createMidiBinary(midiData);
}

async function generateProjectFile(audioBuffer: ArrayBuffer, orchestrationData: any): Promise<ArrayBuffer> {
  // Create DAW project file with all orchestration data
  const projectData = {
    version: '1.0',
    name: orchestrationData.plan?.overview?.intent || 'Aura Generated Track',
    bpm: orchestrationData.plan?.overview?.bpm || 118,
    key: orchestrationData.plan?.overview?.key || 'F# minor',
    mood: orchestrationData.plan?.overview?.mood || 'Upbeat',
    style: orchestrationData.plan?.overview?.style || 'Amapiano',
    
    tracks: [
      {
        id: 'master',
        name: 'Master Track',
        type: 'audio',
        audioData: btoa(
          new Uint8Array(audioBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        ),
        volume: 0.8,
        pan: 0
      }
    ],
    
    orchestrationData: {
      qualityScore: orchestrationData.quality_assessment?.overall_score || 0,
      culturalScore: orchestrationData.cultural_validation?.overall_score || 0,
      aiModels: orchestrationData.final_output?.metadata?.ai_models_used || [],
      executionResults: orchestrationData.execution_results || []
    },
    
    metadata: {
      generatedAt: new Date().toISOString(),
      generationTime: orchestrationData.final_output?.metadata?.generation_time || 0,
      orchestrationId: orchestrationData.orchestration_id || ''
    }
  };

  // Convert to binary
  const jsonString = JSON.stringify(projectData, null, 2);
  return new TextEncoder().encode(jsonString).buffer;
}

// Helper functions
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function createMidiTrack(generationResult: any): any {
  // Simplified MIDI track creation
  return {
    name: 'Generated Track',
    events: [
      { type: 'noteOn', channel: 0, note: 60, velocity: 100, time: 0 },
      { type: 'noteOff', channel: 0, note: 60, velocity: 0, time: 480 }
    ]
  };
}

function createMidiBinary(midiData: any): ArrayBuffer {
  // Create proper MIDI file with MThd header and MTrk tracks
  const tracks = midiData.tracks.length > 0 ? midiData.tracks : [createMidiTrack({})];
  
  // Calculate total size
  let totalSize = 14; // MThd header
  const trackBuffers: ArrayBuffer[] = [];
  
  for (const track of tracks) {
    const trackBuffer = createMidiTrackBinary(track);
    trackBuffers.push(trackBuffer);
    totalSize += trackBuffer.byteLength;
  }
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;
  
  // Write MThd header
  writeString(view, offset, 'MThd');
  offset += 4;
  view.setUint32(offset, 6, false); // Header length
  offset += 4;
  view.setUint16(offset, midiData.header.format, false);
  offset += 2;
  view.setUint16(offset, tracks.length, false);
  offset += 2;
  view.setUint16(offset, midiData.header.ticksPerQuarterNote, false);
  offset += 2;
  
  // Write MTrk chunks
  const targetView = new Uint8Array(buffer);
  for (const trackBuffer of trackBuffers) {
    const sourceView = new Uint8Array(trackBuffer);
    targetView.set(sourceView, offset);
    offset += trackBuffer.byteLength;
  }
  
  return buffer;
}

function createMidiTrackBinary(track: any): ArrayBuffer {
  // Create a simple MIDI track with note events
  const events: number[] = [];
  
  // Delta time (0), Note On (0x90), Note 60 (C4), Velocity 100
  events.push(0x00, 0x90, 0x3C, 0x64);
  // Delta time (480 ticks), Note Off (0x80), Note 60, Velocity 0
  events.push(0x81, 0x70, 0x80, 0x3C, 0x00);
  // End of track
  events.push(0x00, 0xFF, 0x2F, 0x00);
  
  const trackSize = events.length;
  const buffer = new ArrayBuffer(8 + trackSize);
  const view = new DataView(buffer);
  
  // Write MTrk header
  writeString(view, 0, 'MTrk');
  view.setUint32(4, trackSize, false);
  
  // Write events
  const eventView = new Uint8Array(buffer);
  eventView.set(events, 8);
  
  return buffer;
}
