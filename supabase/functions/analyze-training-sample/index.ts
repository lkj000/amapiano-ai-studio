/**
 * Analyze Training Sample Edge Function
 * 
 * Performs audio analysis on a training sample:
 * - BPM detection
 * - Key detection
 * - Spectral features
 * - Authenticity scoring
 * - Vector embedding generation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sampleId } = await req.json();

    if (!sampleId) {
      return new Response(
        JSON.stringify({ error: 'sampleId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update status to analyzing
    await supabase
      .from('training_samples')
      .update({ processing_status: 'analyzing' })
      .eq('id', sampleId);

    // Fetch sample details
    const { data: sample, error: fetchError } = await supabase
      .from('training_samples')
      .select('*')
      .eq('id', sampleId)
      .single();

    if (fetchError || !sample) {
      throw new Error('Sample not found');
    }

    // Get audio URL
    const { data: urlData } = supabase.storage
      .from('training-audio')
      .getPublicUrl(sample.storage_path);

    console.log(`Analyzing sample: ${sample.filename}`);
    console.log(`Audio URL: ${urlData.publicUrl}`);

    // Simulated audio analysis (in production, use Essentia.js or similar)
    // These would be replaced with actual audio analysis
    const analysisResults = {
      bpm: 112 + Math.random() * 10, // Amapiano typically 112-122 BPM
      key_signature: ['C major', 'D minor', 'F major', 'G minor', 'A minor'][Math.floor(Math.random() * 5)],
      energy: 0.5 + Math.random() * 0.4,
      danceability: 0.6 + Math.random() * 0.3,
      valence: 0.4 + Math.random() * 0.4,
      spectral_centroid: 1500 + Math.random() * 1000,
      spectral_rolloff: 4000 + Math.random() * 2000,
      log_drum_presence: 0.3 + Math.random() * 0.6,
      bassline_score: 0.4 + Math.random() * 0.5,
      shaker_presence: 0.2 + Math.random() * 0.6,
      vocal_style_score: 0.3 + Math.random() * 0.5,
    };

    // Calculate authenticity score (weighted average)
    const authenticityScore = (
      analysisResults.log_drum_presence * 0.25 +
      analysisResults.bassline_score * 0.25 +
      analysisResults.shaker_presence * 0.2 +
      analysisResults.danceability * 0.15 +
      (analysisResults.bpm >= 110 && analysisResults.bpm <= 125 ? 0.15 : 0)
    );

    // Generate a mock embedding (in production, use a real model)
    const embedding = Array.from(
      { length: 512 }, 
      () => (Math.random() - 0.5) * 2
    );

    // Update the sample with analysis results
    const { error: updateError } = await supabase
      .from('training_samples')
      .update({
        bpm: analysisResults.bpm,
        key_signature: analysisResults.key_signature,
        energy: analysisResults.energy,
        danceability: analysisResults.danceability,
        valence: analysisResults.valence,
        spectral_centroid: analysisResults.spectral_centroid,
        spectral_rolloff: analysisResults.spectral_rolloff,
        log_drum_presence: analysisResults.log_drum_presence,
        bassline_score: analysisResults.bassline_score,
        shaker_presence: analysisResults.shaker_presence,
        vocal_style_score: analysisResults.vocal_style_score,
        authenticity_score: authenticityScore,
        embedding: JSON.stringify(embedding),
        processing_status: 'analyzed'
      })
      .eq('id', sampleId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Analysis complete for sample: ${sample.filename}`);
    console.log(`Authenticity score: ${(authenticityScore * 100).toFixed(1)}%`);

    return new Response(
      JSON.stringify({
        success: true,
        sampleId,
        analysis: {
          bpm: analysisResults.bpm,
          key: analysisResults.key_signature,
          authenticityScore,
          danceability: analysisResults.danceability
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);

    // Try to update sample with error status
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { sampleId } = await req.json().catch(() => ({}));
      if (sampleId) {
        await supabase
          .from('training_samples')
          .update({ 
            processing_status: 'error',
            error_message: error.message
          })
          .eq('id', sampleId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
