import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpectralFeatures {
  stemName: string;
  audioUrl: string;
  spectralCentroid?: number;
  spectralRolloff?: number;
  zeroCrossingRate?: number;
  rmsEnergy?: number;
  pitchRange?: { low: number; high: number };
  harmonicity?: number;
}

interface ClassificationResult {
  stemName: string;
  primaryCategory: string;
  subCategories: string[];
  confidence: number;
  instruments: {
    id: string;
    name: string;
    category: string;
    confidence: number;
  }[];
}

// Instrument definitions aligned with EnhancedInstrumentSelector
const INSTRUMENT_DEFINITIONS = {
  bass: [
    { id: 'log_drum', name: 'Log Drum', markers: ['sub-heavy', 'rhythmic-bass', 'amapiano-signature'] },
    { id: 'sub_bass', name: 'Sub Bass', markers: ['deep-sine', 'low-frequency', 'sustained'] },
    { id: 'synth_bass', name: 'Synth Bass', markers: ['electronic', 'modulated', 'mid-bass'] },
    { id: 'bass_guitar', name: 'Bass Guitar', markers: ['plucked', 'harmonic-rich', 'organic'] },
  ],
  percussion: [
    { id: 'kick', name: 'Kick Drum', markers: ['transient-heavy', 'low-punch', 'four-on-floor'] },
    { id: 'shakers', name: 'Shakers', markers: ['high-frequency', 'continuous', 'rhythmic'] },
    { id: 'congas', name: 'Congas', markers: ['tonal-percussion', 'mid-range', 'african'] },
    { id: 'bongos', name: 'Bongos', markers: ['high-pitched', 'tonal', 'accent'] },
    { id: 'claps', name: 'Claps', markers: ['broadband-transient', 'snare-like', 'backbeat'] },
    { id: 'rimshot', name: 'Rimshot', markers: ['sharp-attack', 'syncopated', 'woody'] },
    { id: 'djembe', name: 'Djembe', markers: ['west-african', 'bass-slap', 'tonal'] },
  ],
  keys: [
    { id: 'rhodes', name: 'Rhodes', markers: ['electric-piano', 'warm-bell', 'jazzy'] },
    { id: 'acoustic_piano', name: 'Acoustic Piano', markers: ['grand-piano', 'harmonic-rich', 'dynamic'] },
    { id: 'kalimba', name: 'Kalimba', markers: ['thumb-piano', 'metallic-tines', 'african'] },
  ],
  strings: [
    { id: 'guitar_electric', name: 'Electric Guitar', markers: ['amplified', 'distortion-possible', 'jazz-fusion'] },
    { id: 'guitar_acoustic', name: 'Acoustic Guitar', markers: ['fingerpicking', 'natural', 'warm'] },
    { id: 'violin', name: 'Violin', markers: ['bowed', 'high-range', 'emotive'] },
  ],
  brass: [
    { id: 'saxophone', name: 'Saxophone', markers: ['reed', 'jazzy', 'soulful', 'breathy'] },
    { id: 'trumpet', name: 'Trumpet', markers: ['brass', 'bright', 'fanfare', 'stabs'] },
  ],
  synth: [
    { id: 'synth_pad', name: 'Synth Pad', markers: ['sustained', 'atmospheric', 'evolving'] },
    { id: 'synth_lead', name: 'Synth Lead', markers: ['melodic', 'bright', 'monophonic'] },
    { id: 'synth_pluck', name: 'Synth Pluck', markers: ['bell-like', 'short-decay', 'harmonic'] },
    { id: 'marimba_synth', name: 'Marimba Synth', markers: ['tropical', 'mallet', 'rhythmic'] },
  ],
  vocal: [
    { id: 'vocal_chops', name: 'Vocal Chops', markers: ['processed', 'rhythmic', 'pitched'] },
    { id: 'vocal_chants', name: 'Vocal Chants', markers: ['group', 'unison', 'call-response'] },
    { id: 'vocals', name: 'Lead Vocals', markers: ['solo', 'lyrics', 'melodic'] },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stems, spectralData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!stems || !Array.isArray(stems)) {
      return new Response(
        JSON.stringify({ error: 'No stems provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[STEM-CLASSIFY] Classifying', stems.length, 'stems');

    // Build analysis prompt with spectral data if available
    const stemDescriptions = stems.map((stem: SpectralFeatures, idx: number) => {
      const spectral = spectralData?.[idx] || {};
      return `
Stem ${idx + 1}: "${stem.stemName}"
- Spectral Centroid: ${spectral.spectralCentroid?.toFixed(0) || 'N/A'} Hz (brightness indicator)
- Spectral Rolloff: ${spectral.spectralRolloff?.toFixed(0) || 'N/A'} Hz (energy concentration)
- Zero Crossing Rate: ${spectral.zeroCrossingRate?.toFixed(4) || 'N/A'} (percussive vs tonal)
- RMS Energy: ${spectral.rmsEnergy?.toFixed(4) || 'N/A'} (loudness)
- Pitch Range: ${spectral.pitchRange ? `${spectral.pitchRange.low}-${spectral.pitchRange.high} Hz` : 'N/A'}
- Harmonicity: ${spectral.harmonicity?.toFixed(2) || 'N/A'} (tonal purity)
      `.trim();
    }).join('\n\n');

    const systemPrompt = `You are an expert audio engineer and musicologist specializing in Amapiano music analysis. 
Your task is to classify audio stems into specific instrument categories based on their spectral characteristics.

Available instrument categories and instruments:
${Object.entries(INSTRUMENT_DEFINITIONS).map(([cat, instruments]) => 
  `${cat.toUpperCase()}: ${instruments.map(i => i.name).join(', ')}`
).join('\n')}

For each stem, analyze the spectral features and classify:
1. Primary category (bass, percussion, keys, strings, brass, synth, vocal)
2. Specific instruments likely present (from the list above)
3. Confidence level (0-1)

Consider Amapiano-specific characteristics:
- Log drums have distinctive sub-bass with rhythmic punch
- Shakers are high-frequency with continuous 16th note patterns
- Rhodes/keys often have jazzy chord progressions
- Synth pads provide atmospheric textures
- Brass (sax/trumpet) adds soulful melodic lines`;

    const userPrompt = `Classify these audio stems based on their spectral analysis:

${stemDescriptions}

Return a JSON array with classifications for each stem.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'classify_stems',
            description: 'Classify audio stems into instrument categories',
            parameters: {
              type: 'object',
              properties: {
                classifications: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      stemName: { type: 'string' },
                      primaryCategory: { 
                        type: 'string',
                        enum: ['bass', 'percussion', 'keys', 'strings', 'brass', 'synth', 'vocal', 'other']
                      },
                      subCategories: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      confidence: { type: 'number' },
                      instruments: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            category: { type: 'string' },
                            confidence: { type: 'number' }
                          },
                          required: ['id', 'name', 'category', 'confidence']
                        }
                      }
                    },
                    required: ['stemName', 'primaryCategory', 'confidence', 'instruments']
                  }
                }
              },
              required: ['classifications']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'classify_stems' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[STEM-CLASSIFY] AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add credits' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI classification failed: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log('[STEM-CLASSIFY] AI response received');

    // Parse tool call response
    let classifications: ClassificationResult[] = [];
    
    const toolCalls = aiResult.choices?.[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const args = JSON.parse(toolCalls[0].function.arguments);
      classifications = args.classifications;
    }

    // Apply rule-based refinements based on spectral data
    classifications = classifications.map((classification, idx) => {
      const spectral = spectralData?.[idx];
      if (!spectral) return classification;

      // Refine based on spectral characteristics
      const refined = { ...classification };
      
      // High spectral centroid + high ZCR = likely percussion or brass
      if (spectral.spectralCentroid > 4000 && spectral.zeroCrossingRate > 0.1) {
        if (refined.primaryCategory === 'other') {
          refined.primaryCategory = spectral.harmonicity > 0.5 ? 'brass' : 'percussion';
          refined.confidence = Math.min(refined.confidence + 0.1, 1);
        }
      }
      
      // Low spectral centroid + sustained = bass or synth pad
      if (spectral.spectralCentroid < 500 && spectral.spectralRolloff < 2000) {
        if (refined.primaryCategory === 'other') {
          refined.primaryCategory = 'bass';
          refined.confidence = Math.min(refined.confidence + 0.15, 1);
        }
      }

      // High harmonicity + mid-range = likely keys or synth
      if (spectral.harmonicity > 0.7 && spectral.spectralCentroid > 500 && spectral.spectralCentroid < 3000) {
        if (refined.primaryCategory === 'other') {
          refined.primaryCategory = 'keys';
          refined.confidence = Math.min(refined.confidence + 0.1, 1);
        }
      }

      return refined;
    });

    console.log('[STEM-CLASSIFY] Classification complete:', classifications.length, 'stems');

    return new Response(
      JSON.stringify({ 
        success: true, 
        classifications,
        instrumentDefinitions: INSTRUMENT_DEFINITIONS
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STEM-CLASSIFY] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Classification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
