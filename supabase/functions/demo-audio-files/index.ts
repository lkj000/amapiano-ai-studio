import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo audio data - base64 encoded short audio files
const demoAudioFiles: Record<string, { data: string; contentType: string; filename: string }> = {
  'generated-track': {
    data: 'UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAAAAAAAAAAAAAA==', // Short WAV silence
    contentType: 'audio/wav',
    filename: 'generated-track.wav'
  },
  'drums': {
    data: 'UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAAAAAAAAAAAAAA==',
    contentType: 'audio/wav',
    filename: 'drums-stem.wav'
  },
  'bass': {
    data: 'UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAAAAAAAAAAAAAA==',
    contentType: 'audio/wav',
    filename: 'bass-stem.wav'
  },
  'piano': {
    data: 'UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAAAAAAAAAAAAAA==',
    contentType: 'audio/wav',
    filename: 'piano-stem.wav'
  },
  'vocals': {
    data: 'UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAAAAAAAAAAAAAA==',
    contentType: 'audio/wav',
    filename: 'vocals-stem.wav'
  },
  'other': {
    data: 'UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAAAAAAAAAAAAAA==',
    contentType: 'audio/wav',
    filename: 'other-stem.wav'
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fileType = url.pathname.split('/').pop();

    if (!fileType || !demoAudioFiles[fileType]) {
      return new Response('File not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const file = demoAudioFiles[fileType];
    const audioData = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));

    console.log(`Serving demo audio file: ${file.filename}`);

    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': audioData.length.toString(),
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