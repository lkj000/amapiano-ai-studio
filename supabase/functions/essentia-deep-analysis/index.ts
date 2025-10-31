import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeepAnalysisRequest {
  audioFeatures: any;
  analysisType: 'genre' | 'mood' | 'danceability' | 'cultural' | 'all';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { audioFeatures, analysisType }: DeepAnalysisRequest = await req.json();
    
    console.log(`[ESSENTIA-DEEP] Analyzing audio with type: ${analysisType}`);

    // Build specialized prompts based on analysis type
    const systemPrompts = {
      genre: `You are an expert music genre classifier trained on Essentia's deep learning models. 
Analyze audio features and classify into detailed genres and subgenres with confidence scores.
Focus on: tempo, rhythm patterns, harmonic structure, instrumentation, production style.`,
      
      mood: `You are an expert music mood analyzer using state-of-the-art emotion recognition.
Analyze audio features to determine emotional content across valence (positive/negative) and arousal (calm/energetic).
Provide mood classifications: happy, sad, angry, relaxed, energetic, melancholic, uplifting, etc.`,
      
      danceability: `You are a danceability expert analyzing music for rhythmic and groove characteristics.
Evaluate: beat strength, rhythm stability, tempo consistency, syncopation, groove factors.
Provide danceability score (0-1) and specific dance style compatibility.`,
      
      cultural: `You are an ethnomusicologist and cultural authenticity expert specializing in global music traditions.
Analyze for cultural markers, traditional instruments, regional characteristics, fusion elements.
Focus on Amapiano, Afrobeat, and South African music traditions while being open to global influences.`,
      
      all: `You are a comprehensive music analysis AI combining genre classification, mood detection, 
danceability analysis, and cultural authenticity assessment. Provide holistic music understanding.`
    };

    const userPrompt = `Analyze this audio with the following extracted features:

**Spectral Features:**
- Spectral Centroid: ${audioFeatures.spectral?.centroid || 'N/A'}
- Spectral Rolloff: ${audioFeatures.spectral?.rolloff || 'N/A'}
- Spectral Flux: ${audioFeatures.spectral?.flux || 'N/A'}
- MFCCs: ${audioFeatures.spectral?.mfcc?.slice(0, 5).join(', ') || 'N/A'}...

**Temporal Features:**
- BPM: ${audioFeatures.temporal?.bpm || 'N/A'}
- Zero Crossing Rate: ${audioFeatures.temporal?.zeroCrossingRate || 'N/A'}
- Energy: ${audioFeatures.temporal?.energy || 'N/A'}
- RMS: ${audioFeatures.temporal?.rms || 'N/A'}

**Tonal Features:**
- Key: ${audioFeatures.tonal?.key || 'N/A'}
- Scale: ${audioFeatures.tonal?.scale || 'N/A'}
- Chroma: ${audioFeatures.tonal?.chroma?.slice(0, 5).join(', ') || 'N/A'}...

**Rhythm Features:**
- Onset Rate: ${audioFeatures.rhythm?.onsetRate || 'N/A'}
- Beat Strength: ${audioFeatures.rhythm?.strength || 'N/A'}

Provide detailed analysis in JSON format with:
${analysisType === 'genre' || analysisType === 'all' ? `
- genres: [{ name, confidence, subgenre }]` : ''}
${analysisType === 'mood' || analysisType === 'all' ? `
- mood: { primary, secondary, valence, arousal, emotions: [] }` : ''}
${analysisType === 'danceability' || analysisType === 'all' ? `
- danceability: { score, grooveFactor, danceStyles: [], rhythmicComplexity }` : ''}
${analysisType === 'cultural' || analysisType === 'all' ? `
- cultural: { authenticity, traditions: [], instruments: [], regionalMarkers: [], fusionElements: [] }` : ''}
- confidence: overall confidence score (0-1)
- insights: key observations`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompts[analysisType] },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ESSENTIA-DEEP] OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    console.log('[ESSENTIA-DEEP] Analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis,
      analysisType,
      model: 'gpt-4o',
      timestamp: Date.now(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ESSENTIA-DEEP] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
