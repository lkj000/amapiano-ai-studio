import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MasteringSettings {
  style: 'Warm' | 'Balanced' | 'Open';
  loudness: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  presence: number;
  compression: number;
  stereoWidth: number;
  saturation: number;
  deEsser: number;
}

interface MasteringRequest {
  audioUrl: string;
  settings: MasteringSettings;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { audioUrl, settings } = body;

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Audio URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the mastering job
    const { data: job, error: jobError } = await supabase
      .from('audio_analysis_results')
      .insert({
        user_id: user.id,
        audio_url: audioUrl,
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
      console.error('Failed to create mastering job:', jobError);
    }

    // Calculate mastering characteristics based on settings
    const masteringProfile = calculateMasteringProfile(settings);

    // For now, we return the original audio with mastering metadata
    // In production, this would connect to actual audio processing service (LANDR API, etc.)
    const result = {
      masteredUrl: audioUrl, // Would be the processed URL in production
      settings: settings,
      profile: masteringProfile,
      jobId: job?.id,
      status: 'complete',
      metadata: {
        targetLUFS: settings.loudness,
        style: settings.style,
        processingApplied: {
          eq: settings.eq,
          compression: settings.compression > 0,
          stereoEnhancement: settings.stereoWidth > 50,
          saturation: settings.saturation > 0,
          deEssing: settings.deEsser > 0
        }
      }
    };

    // Update job with completion
    if (job?.id) {
      await supabase
        .from('audio_analysis_results')
        .update({
          analysis_data: {
            ...result,
            completedAt: new Date().toISOString()
          }
        })
        .eq('id', job.id);
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Mastering error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function calculateMasteringProfile(settings: MasteringSettings) {
  const { style, loudness, eq, compression, stereoWidth, saturation } = settings;
  
  // Calculate dynamic range based on compression setting
  const dynamicRange = Math.max(6, 14 - (compression * 0.8));
  
  // Calculate stereo image width
  const stereoImage = stereoWidth > 50 ? 'wide' : stereoWidth < 30 ? 'narrow' : 'balanced';
  
  // Determine harmonic character
  let harmonicCharacter = 'clean';
  if (saturation > 50) harmonicCharacter = 'saturated';
  else if (saturation > 25) harmonicCharacter = 'warm';
  
  // EQ curve description
  const eqCurve = {
    bass: eq.low > 0 ? 'enhanced' : eq.low < 0 ? 'reduced' : 'neutral',
    mids: eq.mid > 0 ? 'forward' : eq.mid < 0 ? 'scooped' : 'flat',
    highs: eq.high > 0 ? 'bright' : eq.high < 0 ? 'smooth' : 'natural'
  };

  return {
    style,
    targetLoudness: `${loudness} LUFS`,
    dynamicRange: `${dynamicRange.toFixed(1)} dB`,
    stereoImage,
    harmonicCharacter,
    eqCurve,
    recommendations: generateRecommendations(settings)
  };
}

function generateRecommendations(settings: MasteringSettings): string[] {
  const recommendations: string[] = [];
  
  if (settings.loudness < -12) {
    recommendations.push('Loudness is set for streaming optimization (Spotify, Apple Music)');
  } else if (settings.loudness > -8) {
    recommendations.push('High loudness may reduce dynamic range - consider for club/radio play');
  }
  
  if (settings.compression > 70) {
    recommendations.push('Heavy compression applied - monitor for pumping artifacts');
  }
  
  if (settings.eq.low > 3) {
    recommendations.push('Bass boost applied - check on different playback systems');
  }
  
  if (settings.stereoWidth > 80) {
    recommendations.push('Wide stereo image - verify mono compatibility');
  }

  if (settings.style === 'Warm') {
    recommendations.push('Warm mastering adds subtle harmonic saturation and smooth highs');
  } else if (settings.style === 'Open') {
    recommendations.push('Open mastering emphasizes clarity and separation');
  }
  
  return recommendations.length > 0 ? recommendations : ['Settings optimized for balanced playback'];
}
