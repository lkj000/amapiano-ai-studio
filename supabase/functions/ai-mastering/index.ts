import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  processAudioBuffer,
  measureLoudness,
  type MasteringSettings
} from "../_shared/dsp-processor.ts";
import {
  parseWavHeader,
  decodeWavToFloat32,
  encodeFloat32ToWav,
  arrayBufferToBase64
} from "../_shared/audio-codec.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MasteringRequest {
  audioUrl?: string;
  audioData?: string; // Base64 encoded audio
  settings: MasteringSettings;
  format?: 'wav' | 'mp3'; // Output format
  quality?: 'preview' | 'master'; // Preview = quick, Master = full quality
}

interface MasteringResponse {
  success: boolean;
  masteredAudioBase64?: string;
  masteredUrl?: string;
  jobId?: string;
  status: string;
  inputAnalysis: {
    lufs: number;
    peakDb: number;
    truePeakDb: number;
  };
  outputAnalysis: {
    lufs: number;
    peakDb: number;
    truePeakDb: number;
  };
  processingInfo: {
    timeMs: number;
    sampleRate: number;
    channels: number;
    samplesProcessed: number;
  };
  settings: MasteringSettings;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: MasteringRequest = await req.json();
    const { audioUrl, audioData, settings, quality = 'master' } = body;

    if (!audioUrl && !audioData) {
      return new Response(
        JSON.stringify({ error: 'Audio URL or audio data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ai-mastering] Starting real DSP mastering...');
    console.log('[ai-mastering] Settings:', JSON.stringify(settings));

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('audio_analysis_results')
      .insert({
        user_id: user.id,
        audio_url: audioUrl || 'base64-upload',
        analysis_type: 'mastering',
        analysis_data: {
          settings,
          status: 'processing',
          startedAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error('[ai-mastering] Failed to create job:', jobError);
    }

    let audioBuffer: ArrayBuffer;

    // Fetch or decode audio data
    if (audioUrl) {
      console.log('[ai-mastering] Fetching audio from URL:', audioUrl);
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
      }
      audioBuffer = await audioResponse.arrayBuffer();
    } else if (audioData) {
      console.log('[ai-mastering] Decoding base64 audio data...');
      // Handle base64 data
      const base64Clean = audioData.replace(/^data:[^;]+;base64,/, '');
      const binaryString = atob(base64Clean);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioBuffer = bytes.buffer;
    } else {
      throw new Error('No audio source provided');
    }

    console.log('[ai-mastering] Audio buffer size:', audioBuffer.byteLength);

    // Check file size limit (max 15MB for edge function memory constraints)
    const MAX_BUFFER_SIZE = 15 * 1024 * 1024; // 15MB
    if (audioBuffer.byteLength > MAX_BUFFER_SIZE) {
      const sizeMB = (audioBuffer.byteLength / (1024 * 1024)).toFixed(1);
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'failed', 
          error: `Audio file too large (${sizeMB}MB). Maximum size is 15MB. Try a shorter clip or lower quality source.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse WAV header
    const header = parseWavHeader(audioBuffer);
    if (!header) {
      const magic = new Uint8Array(audioBuffer.slice(0, 4));
      const looksLikeMp3 =
        (magic[0] === 0x49 && magic[1] === 0x44 && magic[2] === 0x33) || // "ID3"
        (magic[0] === 0xff && (magic[1] & 0xe0) === 0xe0); // frame sync

      const hint = looksLikeMp3
        ? 'Unsupported input format (looks like MP3). Please upload WAV/PCM or convert to WAV before mastering.'
        : 'Invalid WAV file format (WAV/PCM required).';

      // Best-effort: mark the job failed
      if (job?.id) {
        try {
          await supabase
            .from('audio_analysis_results')
            .update({
              analysis_data: {
                settings,
                status: 'failed',
                error: hint,
                failedAt: new Date().toISOString(),
              },
            })
            .eq('id', job.id);
        } catch {
          // ignore
        }
      }

      return new Response(
        JSON.stringify({ success: false, status: 'failed', error: hint }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[ai-mastering] WAV info:', {
      sampleRate: header.sampleRate,
      channels: header.channels,
      bitsPerSample: header.bitsPerSample,
      dataSize: header.dataSize
    });

    // Decode audio samples
    const inputSamples = decodeWavToFloat32(audioBuffer, header);
    console.log('[ai-mastering] Decoded samples:', inputSamples.length);

    // Measure input loudness
    const inputLoudness = measureLoudness(inputSamples, header.sampleRate);
    console.log('[ai-mastering] Input loudness:', inputLoudness);

    // Process audio with real DSP
    console.log('[ai-mastering] Starting DSP processing...');
    const startTime = Date.now();
    
    const result = processAudioBuffer(
      inputSamples,
      header.channels,
      header.sampleRate,
      settings
    );

    const processingTime = Date.now() - startTime;
    console.log('[ai-mastering] DSP processing complete in', processingTime, 'ms');
    console.log('[ai-mastering] Output loudness:', result.outputLoudness);

    // Encode output to WAV - always use 16-bit to reduce memory
    const outputBitsPerSample = 16;
    const outputWav = encodeFloat32ToWav(
      result.samples,
      header.sampleRate,
      header.channels,
      outputBitsPerSample
    );

    console.log('[ai-mastering] Output WAV size:', outputWav.byteLength);

    // Correct base64 encoding - use arrayBufferToBase64 from shared module
    // which handles the entire buffer properly
    const outputBase64 = arrayBufferToBase64(outputWav);

    // Skip storage upload in edge function to save CPU time
    // Client can upload to storage if needed
    const masteredUrl: string | undefined = undefined;

    const response: MasteringResponse = {
      success: true,
      masteredAudioBase64: `data:audio/wav;base64,${outputBase64}`,
      masteredUrl,
      jobId: job?.id,
      status: 'complete',
      inputAnalysis: {
        lufs: Math.round(result.inputLoudness.lufs * 10) / 10,
        peakDb: Math.round(result.inputLoudness.peak * 10) / 10,
        truePeakDb: Math.round(result.inputLoudness.truePeak * 10) / 10
      },
      outputAnalysis: {
        lufs: Math.round(result.outputLoudness.lufs * 10) / 10,
        peakDb: Math.round(result.outputLoudness.peak * 10) / 10,
        truePeakDb: Math.round(result.outputLoudness.truePeak * 10) / 10
      },
      processingInfo: {
        timeMs: processingTime,
        sampleRate: header.sampleRate,
        channels: header.channels,
        samplesProcessed: inputSamples.length
      },
      settings
    };

    // Update job with completion
    if (job?.id) {
      await supabase
        .from('audio_analysis_results')
        .update({
          analysis_data: {
            ...response,
            completedAt: new Date().toISOString()
          }
        })
        .eq('id', job.id);
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[ai-mastering] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        status: 'failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
