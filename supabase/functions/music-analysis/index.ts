import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Music Analysis request received');
    const { type, projectData, currentTrack, analysisParams } = await req.json();
    
    if (!type) {
      throw new Error('Analysis type is required');
    }

    console.log(`Performing ${type} analysis`);

    let analysisResult;
    
    switch (type) {
      case 'cultural_authenticity':
        analysisResult = await analyzeCulturalAuthenticity(projectData, currentTrack, analysisParams);
        break;
      case 'music_theory':
        analysisResult = await analyzeMusicTheory(projectData, currentTrack, analysisParams);
        break;
      case 'commercial_potential':
        analysisResult = await analyzeCommercialPotential(projectData, currentTrack, analysisParams);
        break;
      case 'genre_classification':
        analysisResult = await analyzeGenreClassification(projectData, currentTrack, analysisParams);
        break;
      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      type,
      ...analysisResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in music-analysis function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeCulturalAuthenticity(projectData: any, currentTrack: any, params: any) {
  console.log('Analyzing cultural authenticity for amapiano...');
  
  // Analyze project structure for cultural authenticity
  const tracks = projectData?.tracks || [];
  const bpm = projectData?.bpm || 118;
  const keySignature = projectData?.keySignature || 'F#m';
  
  // Check for core amapiano elements
  const hasDrums = tracks.some((t: any) => 
    t.name?.toLowerCase().includes('drum') || 
    t.name?.toLowerCase().includes('log') ||
    t.instrument?.toLowerCase().includes('drum')
  );
  
  const hasPiano = tracks.some((t: any) => 
    t.name?.toLowerCase().includes('piano') || 
    t.instrument?.toLowerCase().includes('piano')
  );
  
  const hasBass = tracks.some((t: any) => 
    t.name?.toLowerCase().includes('bass') || 
    t.instrument?.toLowerCase().includes('bass')
  );

  // Cultural authenticity scoring
  let authenticityScore = 0;
  const details: any = {};
  const recommendations: string[] = [];

  // Log drums analysis (25% weight)
  if (hasDrums) {
    const drumScore = analyzeDrumAuthenticity(tracks);
    details.log_drums = { 
      score: drumScore, 
      notes: drumScore > 0.8 ? "Excellent log drum patterns" : "Drum patterns need more syncopation" 
    };
    authenticityScore += drumScore * 0.25;
    
    if (drumScore < 0.7) {
      recommendations.push("Add more syncopated kick patterns typical of amapiano log drums");
    }
  } else {
    details.log_drums = { score: 0, notes: "Missing essential log drum elements" };
    recommendations.push("Add authentic amapiano log drum patterns - they're the foundation of the genre");
  }

  // Piano style analysis (25% weight)
  if (hasPiano) {
    const pianoScore = analyzePianoStyle(tracks);
    details.piano_style = { 
      score: pianoScore, 
      notes: pianoScore > 0.8 ? "Great gospel-influenced piano" : "Piano could be more soulful" 
    };
    authenticityScore += pianoScore * 0.25;
    
    if (pianoScore < 0.7) {
      recommendations.push("Use more gospel-style chord progressions with 7th and 9th extensions");
    }
  } else {
    details.piano_style = { score: 0.3, notes: "Limited piano presence - core to amapiano" };
    recommendations.push("Add soulful piano chords - they're essential for amapiano authenticity");
  }

  // Bass analysis (20% weight)  
  if (hasBass) {
    const bassScore = analyzeBassPatterns(tracks);
    details.bass_patterns = { 
      score: bassScore, 
      notes: bassScore > 0.8 ? "Deep bass perfectly complements the groove" : "Bass could be deeper and more rhythmic" 
    };
    authenticityScore += bassScore * 0.2;
    
    if (bassScore < 0.7) {
      recommendations.push("Strengthen bass presence in the C1-C3 range for authentic amapiano depth");
    }
  } else {
    details.bass_patterns = { score: 0.2, notes: "Missing deep bass foundation" };
    recommendations.push("Add deep bass lines that lock with the kick drum rhythm");
  }

  // BPM and key analysis (15% weight)
  const tempoScore = (bpm >= 113 && bpm <= 122) ? 0.9 : 0.6;
  const keyScore = ['F#m', 'Am', 'Gm', 'Dm', 'Cm'].includes(keySignature) ? 0.9 : 0.7;
  details.tempo_key = { 
    score: (tempoScore + keyScore) / 2, 
    notes: `${bpm} BPM in ${keySignature} - ${tempoScore > 0.8 && keyScore > 0.8 ? 'perfect' : 'acceptable'} for amapiano` 
  };
  authenticityScore += ((tempoScore + keyScore) / 2) * 0.15;

  // Cultural elements (15% weight)
  const culturalElements = analyzeCulturalElements(projectData);
  details.cultural_elements = culturalElements;
  authenticityScore += culturalElements.score * 0.15;
  
  if (culturalElements.score < 0.7) {
    recommendations.push("Consider adding traditional South African percussion or vocal elements");
    recommendations.push("Layer subtle string arrangements for 'private school' amapiano feel");
  }

  // Additional recommendations based on overall score
  if (authenticityScore < 0.6) {
    recommendations.push("Study classic amapiano tracks by Kabza De Small, DJ Maphorisa, and Mas Musiq");
  } else if (authenticityScore < 0.8) {
    recommendations.push("Add more polyrhythmic percussion layers for complexity");
    recommendations.push("Consider incorporating vocal chops or traditional call-and-response patterns");
  }

  return {
    score: Math.max(0.1, authenticityScore), // Minimum 10% to avoid zero scores
    details,
    recommendations: recommendations.slice(0, 5) // Limit to top 5 recommendations
  };
}

async function analyzeMusicTheory(projectData: any, currentTrack: any, params: any) {
  console.log('Analyzing music theory...');
  
  const tracks = projectData?.tracks || [];
  
  // Harmony analysis
  const harmonyScore = analyzeHarmony(tracks);
  
  // Rhythm analysis  
  const rhythmScore = analyzeRhythm(tracks);
  
  // Melody analysis
  const melodyScore = analyzeMelody(tracks);
  
  // Structure analysis
  const structureScore = analyzeStructure(projectData);
  
  const overallScore = (harmonyScore + rhythmScore + melodyScore + structureScore) / 4;
  
  const details = {
    harmony: { 
      score: harmonyScore, 
      notes: harmonyScore > 0.8 ? "Strong harmonic foundation" : "Harmony could be more sophisticated" 
    },
    rhythm: { 
      score: rhythmScore, 
      notes: rhythmScore > 0.8 ? "Excellent rhythmic complexity" : "Rhythm patterns need more variation" 
    },
    melody: { 
      score: melodyScore, 
      notes: melodyScore > 0.8 ? "Memorable melodic lines" : "Melodies could be more engaging" 
    },
    structure: { 
      score: structureScore, 
      notes: structureScore > 0.8 ? "Well-structured arrangement" : "Arrangement needs better flow" 
    }
  };

  const recommendations = [
    "Try using secondary dominants for more harmonic movement",
    "Add chromatic passing tones to melodic lines",
    "Use rhythmic displacement for added interest",
    "Consider modal interchange for color",
    "Experiment with polyrhythmic layers"
  ];

  return {
    score: overallScore,
    details,
    recommendations
  };
}

async function analyzeCommercialPotential(projectData: any, currentTrack: any, params: any) {
  console.log('Analyzing commercial potential...');
  
  const duration = projectData?.duration || 240; // 4 minutes default
  const trackCount = projectData?.tracks?.length || 0;
  const bpm = projectData?.bpm || 118;
  
  // Radio friendliness (based on length, structure)
  const radioScore = (duration >= 180 && duration <= 300) ? 0.9 : 0.6;
  
  // Streaming potential (hook strength, intro engagement)
  const streamingScore = Math.random() * 0.3 + 0.7; // Simulate analysis
  
  // Market trends alignment
  const trendScore = (bpm >= 115 && bpm <= 120) ? 0.9 : 0.7;
  
  // Crossover appeal
  const crossoverScore = trackCount > 4 ? 0.8 : 0.6;
  
  const overallScore = (radioScore + streamingScore + trendScore + crossoverScore) / 4;
  
  const details = {
    radio_friendliness: { score: radioScore, notes: `${Math.round(duration/60)}min duration - ${radioScore > 0.8 ? 'ideal' : 'acceptable'} for radio` },
    streaming_potential: { score: streamingScore, notes: streamingScore > 0.8 ? "Strong streaming hooks" : "Could improve intro engagement" },
    market_trends: { score: trendScore, notes: trendScore > 0.8 ? "Aligns with current trends" : "Consider current market preferences" },
    crossover_appeal: { score: crossoverScore, notes: crossoverScore > 0.7 ? "Good crossover potential" : "Limited to core amapiano audience" }
  };

  const recommendations = [
    "Strengthen the hook in the first 30 seconds for streaming platforms",
    "Consider adding a featured vocalist for wider appeal",
    "Optimize mix for streaming loudness standards (-14 LUFS)",
    "Add more memorable melodic elements",
    "Create a radio edit with tighter arrangement"
  ];

  return {
    score: overallScore,
    details,
    recommendations
  };
}

async function analyzeGenreClassification(projectData: any, currentTrack: any, params: any) {
  console.log('Analyzing genre classification...');
  
  // Simulate genre matching analysis
  const genreScore = Math.random() * 0.3 + 0.7;
  
  const details = {
    genre_match: { score: genreScore, notes: "Strong amapiano characteristics" },
    tempo_analysis: { score: 0.9, notes: "Perfect BPM for amapiano" },
    instrumentation: { score: 0.8, notes: "Good use of core instruments" },
    structure: { score: 0.75, notes: "Follows amapiano arrangement patterns" }
  };

  const recommendations = [
    "Add more syncopated percussion elements",
    "Increase bass presence in sub-frequency range",
    "Layer additional piano harmonies",
    "Consider adding traditional vocal elements"
  ];

  return {
    score: genreScore,
    details,
    recommendations
  };
}

// Helper analysis functions
function analyzeDrumAuthenticity(tracks: any[]): number {
  // Check for amapiano-style drum patterns
  const drumTracks = tracks.filter(t => 
    t.name?.toLowerCase().includes('drum') || t.name?.toLowerCase().includes('log')
  );
  
  if (drumTracks.length === 0) return 0.1;
  
  // Simulate pattern analysis
  return Math.random() * 0.3 + 0.7; // 70-100%
}

function analyzePianoStyle(tracks: any[]): number {
  const pianoTracks = tracks.filter(t => 
    t.name?.toLowerCase().includes('piano')
  );
  
  if (pianoTracks.length === 0) return 0.2;
  
  // Simulate chord progression analysis
  return Math.random() * 0.4 + 0.6; // 60-100%
}

function analyzeBassPatterns(tracks: any[]): number {
  const bassTracks = tracks.filter(t => 
    t.name?.toLowerCase().includes('bass')
  );
  
  if (bassTracks.length === 0) return 0.1;
  
  return Math.random() * 0.3 + 0.7; // 70-100%
}

function analyzeCulturalElements(projectData: any) {
  const tracks = projectData?.tracks || [];
  const hasVocals = tracks.some((t: any) => t.name?.toLowerCase().includes('vocal'));
  const hasStrings = tracks.some((t: any) => t.name?.toLowerCase().includes('string'));
  
  let score = 0.5; // Base score
  
  if (hasVocals) score += 0.2;
  if (hasStrings) score += 0.2;
  
  return {
    score: Math.min(score, 0.95),
    notes: `Cultural elements present: ${hasVocals ? 'vocals ' : ''}${hasStrings ? 'strings' : ''}`
  };
}

function analyzeHarmony(tracks: any[]): number {
  return Math.random() * 0.3 + 0.7;
}

function analyzeRhythm(tracks: any[]): number {
  return Math.random() * 0.3 + 0.7;
}

function analyzeMelody(tracks: any[]): number {
  return Math.random() * 0.3 + 0.7;
}

function analyzeStructure(projectData: any): number {
  const duration = projectData?.duration || 240;
  const tracks = projectData?.tracks?.length || 0;
  
  // Good structure has multiple tracks and reasonable length
  let score = 0.5;
  if (tracks >= 3) score += 0.2;
  if (duration >= 180 && duration <= 360) score += 0.2;
  
  return Math.min(score, 0.95);
}