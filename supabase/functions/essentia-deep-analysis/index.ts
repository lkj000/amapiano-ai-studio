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

// Fallback heuristic analysis when OpenAI is unavailable
function generateFallbackAnalysis(audioFeatures: any, analysisType: string) {
  // BPM can be in rhythm or temporal depending on source
  const bpm = audioFeatures.rhythm?.bpm || audioFeatures.temporal?.bpm || 120;
  const energy = audioFeatures.temporal?.energy || 0.5;
  const spectralCentroid = audioFeatures.spectral?.centroid || 5000;
  const key = audioFeatures.tonal?.key || 'C';
  const scale = audioFeatures.tonal?.scale || 'major';
  
  // Heuristic genre detection based on BPM and spectral characteristics
  let primaryGenre = 'Electronic';
  let subgenre = 'House';
  if (bpm >= 110 && bpm <= 120) {
    primaryGenre = 'Amapiano';
    subgenre = 'Piano';
  } else if (bpm >= 120 && bpm <= 130) {
    primaryGenre = 'House';
    subgenre = 'Deep House';
  } else if (bpm >= 130 && bpm <= 140) {
    primaryGenre = 'Afro House';
    subgenre = 'Tribal';
  } else if (bpm >= 140) {
    primaryGenre = 'Gqom';
    subgenre = 'Durban';
  }

  // Heuristic mood based on energy and key
  const valence = scale === 'major' ? 0.7 : 0.4;
  const arousal = Math.min(energy * 1.5, 1);
  const primaryMood = valence > 0.5 && arousal > 0.5 ? 'Energetic' : 
                      valence > 0.5 ? 'Peaceful' : 
                      arousal > 0.5 ? 'Intense' : 'Melancholic';

  // Danceability based on BPM and rhythm strength
  const danceScore = bpm >= 100 && bpm <= 140 ? 0.8 : 0.6;
  
  const analysis: any = {
    confidence: 0.65,
    insights: 'Analysis performed using heuristic fallback (AI quota exceeded). Results are approximate.',
    source: 'heuristic_fallback'
  };

  if (analysisType === 'genre' || analysisType === 'all') {
    analysis.genres = [
      { name: primaryGenre, confidence: 0.7, subgenre },
      { name: 'Electronic', confidence: 0.5, subgenre: 'Dance' }
    ];
  }

  if (analysisType === 'mood' || analysisType === 'all') {
    analysis.mood = {
      primary: primaryMood,
      secondary: valence > 0.5 ? 'Uplifting' : 'Contemplative',
      valence,
      arousal,
      emotions: [primaryMood.toLowerCase(), 'groovy', 'rhythmic']
    };
  }

  if (analysisType === 'danceability' || analysisType === 'all') {
    analysis.danceability = {
      score: danceScore,
      grooveFactor: 0.75,
      danceStyles: ['House', 'Amapiano', 'Afro Dance'],
      rhythmicComplexity: 0.6
    };
  }

  if (analysisType === 'cultural' || analysisType === 'all') {
    analysis.cultural = {
      authenticity: bpm >= 110 && bpm <= 120 ? 0.8 : 0.5,
      traditions: ['South African Electronic', 'Afro House'],
      instruments: ['Log drums', 'Synth bass', 'Piano'],
      regionalMarkers: ['Township sound', 'Johannesburg'],
      fusionElements: ['House', 'Jazz']
    };
  }

  return analysis;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioFeatures, analysisType }: DeepAnalysisRequest = await req.json();
    
    console.log(`[ESSENTIA-DEEP] Analyzing audio with type: ${analysisType}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    // If no API key, use fallback immediately
    if (!LOVABLE_API_KEY) {
      console.log('[ESSENTIA-DEEP] No Lovable API key, using heuristic fallback');
      const fallbackAnalysis = generateFallbackAnalysis(audioFeatures, analysisType);
      return new Response(JSON.stringify({
        success: true,
        analysis: fallbackAnalysis,
        analysisType,
        model: 'heuristic_fallback',
        timestamp: Date.now(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build specialized prompts based on analysis type
    const systemPrompts: Record<string, string> = {
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
- BPM: ${audioFeatures.temporal?.bpm || audioFeatures.rhythm?.bpm || 'N/A'}
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompts[analysisType] || systemPrompts.all },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    // Handle rate limit / quota errors with fallback
    if (response.status === 429) {
      console.warn('[ESSENTIA-DEEP] Rate limit hit, using fallback');
      const fallbackAnalysis = generateFallbackAnalysis(audioFeatures, analysisType);
      return new Response(JSON.stringify({
        success: true,
        analysis: fallbackAnalysis,
        analysisType,
        model: 'heuristic_fallback',
        warning: 'Rate limit exceeded - using heuristic analysis',
        timestamp: Date.now(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (response.status === 402) {
      console.warn('[ESSENTIA-DEEP] Payment required, using fallback');
      const fallbackAnalysis = generateFallbackAnalysis(audioFeatures, analysisType);
      return new Response(JSON.stringify({
        success: true,
        analysis: fallbackAnalysis,
        analysisType,
        model: 'heuristic_fallback',
        warning: 'AI credits exhausted - using heuristic analysis',
        timestamp: Date.now(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ESSENTIA-DEEP] AI API error:', response.status, errorText);
      const fallbackAnalysis = generateFallbackAnalysis(audioFeatures, analysisType);
      return new Response(JSON.stringify({
        success: true,
        analysis: fallbackAnalysis,
        analysisType,
        model: 'heuristic_fallback',
        warning: `API error (${response.status}) - using heuristic analysis`,
        timestamp: Date.now(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      const fallbackAnalysis = generateFallbackAnalysis(audioFeatures, analysisType);
      return new Response(JSON.stringify({
        success: true,
        analysis: fallbackAnalysis,
        analysisType,
        model: 'heuristic_fallback',
        timestamp: Date.now(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, extract key information
      analysis = generateFallbackAnalysis(audioFeatures, analysisType);
      analysis.insights = content.substring(0, 500);
    }

    console.log('[ESSENTIA-DEEP] ✓ AI analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis,
      analysisType,
      model: 'lovable-ai',
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
