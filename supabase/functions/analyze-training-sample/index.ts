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

    const sampleUrl = urlData.publicUrl;

    // Call Modal backend for real audio analysis
    const modalUrl = Deno.env.get('MODAL_API_URL') || 'https://mabgwej--aura-x-backend-fastapi-app.modal.run';
    const analysisResp = await fetch(`${modalUrl}/audio/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_url: sampleUrl, extract_features: true }),
    });

    if (!analysisResp.ok) throw new Error(`Modal analysis failed: ${analysisResp.status}`);
    const modalData = await analysisResp.json();

    // Map Modal response to our schema
    const analysis = {
      bpm: modalData.bpm || 110,
      key: modalData.key || 'Am',
      energy: modalData.energy_level || 0.7,
      danceability: modalData.danceability || 0.8,
      spectralFeatures: {
        centroid: modalData.spectral_centroid || 2000,
        rolloff: modalData.spectral_rolloff || 4000,
        flux: modalData.spectral_flux || 0.5,
        logDrumPresence: modalData.log_drum_presence || 0.85,
      },
      embedding: modalData.embedding || Array.from({ length: 512 }, () => 0), // zeros if no embedding
    };

    const analysisResults = {
      bpm: analysis.bpm,
      key_signature: analysis.key,
      energy: analysis.energy,
      danceability: analysis.danceability,
      valence: modalData.valence || 0.5,
      spectral_centroid: analysis.spectralFeatures.centroid,
      spectral_rolloff: analysis.spectralFeatures.rolloff,
      log_drum_presence: analysis.spectralFeatures.logDrumPresence,
      bassline_score: modalData.bassline_score || 0.5,
      shaker_presence: modalData.shaker_presence || 0.4,
      vocal_style_score: modalData.vocal_style_score || 0.4,
    };

    // Calculate authenticity score (weighted average)
    const authenticityScore = (
      analysisResults.log_drum_presence * 0.25 +
      analysisResults.bassline_score * 0.25 +
      analysisResults.shaker_presence * 0.2 +
      analysisResults.danceability * 0.15 +
      (analysisResults.bpm >= 110 && analysisResults.bpm <= 125 ? 0.15 : 0)
    );

    const embedding = analysis.embedding;

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
