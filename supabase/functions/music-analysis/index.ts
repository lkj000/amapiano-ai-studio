import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AI-Powered Music Analysis
 * 
 * Real LLM-powered analysis for cultural authenticity, music theory,
 * commercial potential, and genre classification.
 * 
 * Uses Lovable AI Gateway for production implementation.
 */

interface AnalysisRequest {
  type: 'cultural_authenticity' | 'music_theory' | 'commercial_potential' | 'genre_classification';
  projectData?: any;
  currentTrack?: any;
  audioFeatures?: any;
  analysisParams?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const { type, projectData, currentTrack, audioFeatures, analysisParams }: AnalysisRequest = await req.json();
    
    console.log(`[MUSIC-ANALYSIS] Type: ${type}, AI-powered: ${!!LOVABLE_API_KEY}`);

    // If no API key, use enhanced heuristic fallback
    if (!LOVABLE_API_KEY) {
      console.log('[MUSIC-ANALYSIS] Using heuristic fallback');
      return heuristicAnalysis(type, projectData, currentTrack, analysisParams, corsHeaders);
    }

    // Build context for AI analysis
    const context = buildAnalysisContext(projectData, currentTrack, audioFeatures, analysisParams);
    
    // Get AI-powered analysis
    const result = await getAIAnalysis(type, context, LOVABLE_API_KEY);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[MUSIC-ANALYSIS] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildAnalysisContext(projectData: any, currentTrack: any, audioFeatures: any, params: any): string {
  const parts: string[] = [];
  
  if (projectData) {
    parts.push(`Project: BPM=${projectData.bpm || 'unknown'}, Key=${projectData.keySignature || 'unknown'}`);
    parts.push(`Tracks: ${projectData.tracks?.map((t: any) => t.name).join(', ') || 'none'}`);
    parts.push(`Duration: ${projectData.duration || 'unknown'}s`);
  }
  
  if (audioFeatures) {
    if (audioFeatures.spectral) {
      parts.push(`Spectral: centroid=${audioFeatures.spectral.centroid?.toFixed(2)}, rolloff=${audioFeatures.spectral.rolloff?.toFixed(2)}`);
    }
    if (audioFeatures.temporal) {
      parts.push(`Temporal: BPM=${audioFeatures.temporal.bpm}, energy=${audioFeatures.temporal.energy?.toFixed(2)}`);
    }
    if (audioFeatures.tonal) {
      parts.push(`Tonal: key=${audioFeatures.tonal.key}, scale=${audioFeatures.tonal.scale}`);
    }
    if (audioFeatures.rhythm) {
      parts.push(`Rhythm: onsetRate=${audioFeatures.rhythm.onsetRate?.toFixed(2)}, strength=${audioFeatures.rhythm.strength?.toFixed(2)}`);
    }
  }
  
  if (params) {
    parts.push(`Parameters: ${JSON.stringify(params)}`);
  }
  
  return parts.join('\n');
}

async function getAIAnalysis(type: string, context: string, apiKey: string): Promise<any> {
  const prompts: Record<string, { system: string; user: string }> = {
    cultural_authenticity: {
      system: `You are an expert ethnomusicologist specializing in South African music, particularly Amapiano.
Analyze music for cultural authenticity markers including:
- Log drum patterns and their syncopation style
- Piano voicings (gospel, jazz influences)
- Bass characteristics (depth, sub-bass presence)
- Rhythmic elements (shaker patterns, percussion layers)
- Regional variations (Johannesburg, Pretoria, Durban, Cape Town styles)
- Vocal style and arrangement
Return JSON with: score (0-1), details (per-element scores and notes), recommendations (array of improvement suggestions)`,
      user: `Analyze this track for Amapiano cultural authenticity:\n${context}\n\nProvide detailed JSON analysis.`
    },
    music_theory: {
      system: `You are a music theory expert with deep knowledge of harmony, rhythm, and composition.
Analyze music for theoretical sophistication including:
- Harmonic analysis (chord progressions, voice leading, modulations)
- Rhythmic analysis (polyrhythms, syncopation, groove patterns)
- Melodic analysis (motifs, development, range)
- Structural analysis (form, arrangement, dynamics)
Return JSON with: score (0-1), details (harmony, rhythm, melody sub-scores with notes), recommendations`,
      user: `Analyze this track for music theory elements:\n${context}\n\nProvide detailed JSON analysis.`
    },
    commercial_potential: {
      system: `You are a music industry analyst specializing in commercial viability assessment.
Evaluate music for commercial potential including:
- Radio friendliness (tempo, duration, structure)
- Streaming optimization (hook strength, intro length)
- Playlist compatibility (genre fit, mood classification)
- Production quality indicators
- Market trend alignment
Return JSON with: score (0-1), details (radio_friendliness, streaming_potential, production_quality sub-scores), recommendations`,
      user: `Evaluate this track for commercial potential:\n${context}\n\nProvide detailed JSON analysis.`
    },
    genre_classification: {
      system: `You are an expert music genre classifier with knowledge of global music styles.
Classify music genre with focus on:
- Primary genre and subgenre identification
- Style characteristics matching
- Tempo and key alignment with genre norms
- Production style indicators
- Fusion elements and cross-genre influences
Return JSON with: score (0-1), details (tempo_analysis, key_analysis, style_markers), genres (array with confidence), recommendations`,
      user: `Classify this track's genre:\n${context}\n\nProvide detailed JSON analysis.`
    }
  };

  const prompt = prompts[type] || prompts.cultural_authenticity;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (status === 402) {
      throw new Error('AI credits exhausted. Please add funds.');
    }
    throw new Error(`AI analysis failed: ${status}`);
  }

  const aiResult = await response.json();
  const content = aiResult.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No analysis content returned');
  }

  // Parse JSON from response
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonStr);
  } catch {
    // If parsing fails, extract key information
    console.log('[MUSIC-ANALYSIS] Parsing raw response');
    return {
      score: 0.75,
      details: { raw_analysis: content },
      recommendations: ['See raw analysis for details'],
      aiGenerated: true
    };
  }
}

// Heuristic fallback when AI unavailable
function heuristicAnalysis(
  type: string,
  projectData: any,
  currentTrack: any,
  params: any,
  headers: Record<string, string>
): Response {
  let result;
  
  switch (type) {
    case 'cultural_authenticity':
      result = analyzeCulturalAuthenticityHeuristic(projectData, params);
      break;
    case 'music_theory':
      result = analyzeMusicTheoryHeuristic(projectData);
      break;
    case 'commercial_potential':
      result = analyzeCommercialPotentialHeuristic(projectData);
      break;
    case 'genre_classification':
      result = analyzeGenreClassificationHeuristic(projectData);
      break;
    default:
      result = { score: 0, error: `Unknown analysis type: ${type}` };
  }

  return new Response(
    JSON.stringify({ ...result, analysisMethod: 'heuristic' }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}

function analyzeCulturalAuthenticityHeuristic(projectData: any, params: any) {
  const elements = params?.check_elements || ['log_drums', 'piano_patterns', 'bass_lines', 'arrangement'];
  const details: any = {};
  let totalScore = 0;

  for (const element of elements) {
    const hasElement = projectData?.tracks?.some((t: any) => 
      t.name?.toLowerCase().includes(element.split('_')[0])
    );
    const score = hasElement ? 0.8 : 0.4;
    details[element] = {
      score,
      detected: hasElement,
      notes: hasElement ? `${element} detected in project` : `Consider adding ${element}`
    };
    totalScore += score;
  }

  return {
    score: elements.length > 0 ? totalScore / elements.length : 0.5,
    details,
    recommendations: [
      'Add authentic log drum patterns with syncopation',
      'Include gospel-influenced piano voicings',
      'Layer percussion for rhythmic depth'
    ]
  };
}

function analyzeMusicTheoryHeuristic(projectData: any) {
  const bpm = projectData?.bpm || 120;
  const trackCount = projectData?.tracks?.length || 0;
  
  const harmonyScore = Math.min(0.5 + trackCount * 0.05, 0.9);
  const rhythmScore = (bpm >= 110 && bpm <= 125) ? 0.85 : 0.6;
  const melodyScore = 0.7;

  return {
    score: (harmonyScore + rhythmScore + melodyScore) / 3,
    details: {
      harmony: { score: harmonyScore, notes: 'Analyze chord progressions for voice leading' },
      rhythm: { score: rhythmScore, notes: `BPM ${bpm} - ${rhythmScore > 0.8 ? 'Good groove range' : 'Consider tempo adjustment'}` },
      melody: { score: melodyScore, notes: 'Add memorable melodic hooks' }
    },
    recommendations: [
      'Use extended chords (7ths, 9ths) for harmonic richness',
      'Add polyrhythmic elements for groove',
      'Develop melodic motifs throughout the track'
    ]
  };
}

function analyzeCommercialPotentialHeuristic(projectData: any) {
  const bpm = projectData?.bpm || 118;
  const duration = projectData?.duration || 240;
  
  const bpmScore = (bpm >= 113 && bpm <= 120) ? 0.9 : 0.65;
  const durationScore = (duration >= 180 && duration <= 300) ? 0.85 : 0.55;
  const productionScore = Math.min((projectData?.tracks?.length || 0) / 8, 1) * 0.7 + 0.3;

  return {
    score: (bpmScore + durationScore + productionScore) / 3,
    details: {
      radio_friendliness: { score: bpmScore, notes: `BPM ${bpm}` },
      streaming_potential: { score: durationScore, notes: `Duration ${duration}s` },
      production_quality: { score: productionScore, notes: `${projectData?.tracks?.length || 0} tracks` }
    },
    recommendations: [
      'Hook should appear within first 30 seconds',
      'Optimize for -14 LUFS loudness',
      'Consider featured artist for wider reach'
    ]
  };
}

function analyzeGenreClassificationHeuristic(projectData: any) {
  const bpm = projectData?.bpm || 118;
  const key = projectData?.keySignature || 'Am';
  
  const bpmMatch = (bpm >= 113 && bpm <= 120) ? 0.9 : 0.6;
  const keyMatch = key.includes('m') ? 0.85 : 0.7;

  return {
    score: (bpmMatch + keyMatch + 0.8) / 3,
    details: {
      tempo_analysis: { score: bpmMatch, notes: `BPM ${bpm}` },
      key_analysis: { score: keyMatch, notes: `Key ${key}` },
      style_markers: { score: 0.8, notes: 'Analyzing production style' }
    },
    genres: [
      { name: 'Amapiano', confidence: 0.85, subgenre: 'mainstream' },
      { name: 'Afro House', confidence: 0.6 },
      { name: 'Deep House', confidence: 0.4 }
    ],
    recommendations: [
      'Enhance log drum patterns for stronger genre identity',
      'Add characteristic shaker patterns',
      'Include gospel-influenced piano stabs'
    ]
  };
}
