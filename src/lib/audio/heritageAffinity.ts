/**
 * Heritage Affinity Scoring System
 * 
 * Measures cultural authenticity and alignment with South African musical heritage.
 * Goes beyond genre classification to evaluate cultural resonance.
 * 
 * PhD Research: Computational cultural musicology for African electronic music.
 */

import { AudioFeatures } from '../ml/NeuralGenreClassifier';
import { calculatePatternDensity, calculateRhythmicComplexity } from '../dsp/euclideanRhythm';

export interface HeritageAffinityScore {
  overall: number;                    // 0-100 Heritage Affinity Score
  breakdown: {
    rhythmic: number;                 // Alignment with African polyrhythms
    harmonic: number;                 // Jazz/Gospel chord influence
    timbral: number;                  // Log drum, shaker characteristics
    cultural: number;                 // Regional style markers
    linguistic: number;               // SA language integration
  };
  regionalStyle: string;              // Detected regional style
  culturalMarkers: string[];          // Identified cultural elements
  recommendations: string[];          // Suggestions for improvement
}

export interface CulturalMarker {
  name: string;
  weight: number;
  detected: boolean;
  confidence: number;
}

/**
 * Regional Heritage Profiles
 */
export const HERITAGE_PROFILES: Record<string, {
  name: string;
  province: string;
  languages: string[];
  rhythmicCharacteristics: string[];
  harmonicTendencies: string[];
  bpmRange: [number, number];
  swingRange: [number, number];
  culturalMarkers: string[];
}> = {
  gauteng_johannesburg: {
    name: 'Johannesburg / Egoli',
    province: 'Gauteng',
    languages: ['zulu', 'sotho', 'english', 'tswana', 'tsonga'],
    rhythmicCharacteristics: ['soulful swing', 'melodic log drums', 'gospel influence'],
    harmonicTendencies: ['minor 7th', 'jazz voicings', 'rhodes piano'],
    bpmRange: [110, 118],
    swingRange: [0.55, 0.62],
    culturalMarkers: ['kasi culture', 'urban sophistication', 'pantsula influence']
  },
  gauteng_pretoria: {
    name: 'Pretoria / Tshwane',
    province: 'Gauteng',
    languages: ['pedi', 'tswana', 'ndebele', 'afrikaans'],
    rhythmicCharacteristics: ['jazzy syncopation', 'cleaner swing', 'precise timing'],
    harmonicTendencies: ['extended chords', 'chromatic movement', 'keyboard-led'],
    bpmRange: [112, 120],
    swingRange: [0.53, 0.58],
    culturalMarkers: ['bolobedu influence', 'academic precision', 'fusion elements']
  },
  kwazulu_natal_durban: {
    name: 'Durban / eThekwini',
    province: 'KwaZulu-Natal',
    languages: ['zulu', 'english'],
    rhythmicCharacteristics: ['aggressive drops', 'gqom influence', 'heavy bass'],
    harmonicTendencies: ['dark minor', 'sparse harmony', 'bass-focused'],
    bpmRange: [115, 125],
    swingRange: [0.50, 0.56],
    culturalMarkers: ['sghubu culture', 'warrior energy', 'coastal vibe']
  },
  western_cape: {
    name: 'Cape Town / iKapa',
    province: 'Western Cape',
    languages: ['afrikaans', 'xhosa', 'english'],
    rhythmicCharacteristics: ['smooth grooves', 'house influence', 'laid-back feel'],
    harmonicTendencies: ['deep house chords', 'organic textures', 'atmospheric'],
    bpmRange: [118, 124],
    swingRange: [0.52, 0.58],
    culturalMarkers: ['Cape jazz', 'goema rhythm', 'multicultural fusion']
  },
  limpopo: {
    name: 'Limpopo',
    province: 'Limpopo',
    languages: ['pedi', 'venda', 'tsonga', 'ndebele'],
    rhythmicCharacteristics: ['bolobedu queens', 'traditional drums', 'earthy feel'],
    harmonicTendencies: ['pentatonic hints', 'call-response', 'vocal harmonies'],
    bpmRange: [108, 116],
    swingRange: [0.56, 0.62],
    culturalMarkers: ['traditional fusion', 'rural authenticity', 'ancestral connection']
  },
  mpumalanga: {
    name: 'Mpumalanga',
    province: 'Mpumalanga',
    languages: ['swati', 'ndebele', 'zulu', 'tsonga'],
    rhythmicCharacteristics: ['reed dance influence', 'celebratory', 'communal'],
    harmonicTendencies: ['major keys', 'bright voicings', 'uplifting'],
    bpmRange: [110, 118],
    swingRange: [0.54, 0.60],
    culturalMarkers: ['umhlanga', 'royal ceremonies', 'nature sounds']
  },
  free_state: {
    name: 'Free State / Foreisetata',
    province: 'Free State',
    languages: ['sotho', 'tswana', 'afrikaans'],
    rhythmicCharacteristics: ['famo music hints', 'accordion influence', 'steady groove'],
    harmonicTendencies: ['folk harmonies', 'simple progressions', 'singable melodies'],
    bpmRange: [112, 120],
    swingRange: [0.54, 0.58],
    culturalMarkers: ['basotho heritage', 'mining culture', 'pastoral feel']
  },
  eastern_cape: {
    name: 'Eastern Cape / iMpuma-Koloni',
    province: 'Eastern Cape',
    languages: ['xhosa', 'afrikaans', 'english'],
    rhythmicCharacteristics: ['click consonant rhythms', 'call-response', 'ceremonial'],
    harmonicTendencies: ['vocal stacking', 'overtone-rich', 'drone elements'],
    bpmRange: [108, 118],
    swingRange: [0.55, 0.60],
    culturalMarkers: ['umqombothi', 'initiation songs', 'storytelling tradition']
  }
};

/**
 * Cultural markers detection weights
 */
const CULTURAL_MARKER_WEIGHTS: Record<string, number> = {
  'log_drum_presence': 0.15,
  'shaker_density': 0.10,
  'piano_voicing': 0.12,
  'swing_authenticity': 0.15,
  'bpm_range': 0.10,
  'key_signature': 0.08,
  'call_response': 0.10,
  'bass_character': 0.08,
  'regional_style': 0.07,
  'linguistic_integration': 0.05
};

/**
 * Calculate Heritage Affinity Score
 */
export function calculateHeritageAffinity(
  audioFeatures: AudioFeatures,
  detectedElements?: {
    hasLogDrum?: boolean;
    hasShaker?: boolean;
    shakerDensity?: number;
    pianoVoicing?: string;
    swingAmount?: number;
    bassStyle?: string;
    vocalLanguage?: string;
  }
): HeritageAffinityScore {
  const markers: CulturalMarker[] = [];
  
  // Rhythmic heritage score
  const rhythmicScore = calculateRhythmicHeritage(audioFeatures, detectedElements);
  
  // Harmonic heritage score
  const harmonicScore = calculateHarmonicHeritage(audioFeatures, detectedElements);
  
  // Timbral heritage score
  const timbralScore = calculateTimbralHeritage(audioFeatures, detectedElements);
  
  // Cultural markers score
  const culturalScore = calculateCulturalMarkers(audioFeatures, detectedElements, markers);
  
  // Linguistic integration score
  const linguisticScore = calculateLinguisticHeritage(detectedElements?.vocalLanguage);
  
  // Calculate weighted overall score
  const overall = Math.round(
    rhythmicScore * 0.25 +
    harmonicScore * 0.20 +
    timbralScore * 0.25 +
    culturalScore * 0.20 +
    linguisticScore * 0.10
  );
  
  // Detect regional style
  const regionalStyle = detectRegionalStyle(audioFeatures, detectedElements);
  
  // Generate recommendations
  const recommendations = generateHeritageRecommendations(
    { rhythmic: rhythmicScore, harmonic: harmonicScore, timbral: timbralScore, cultural: culturalScore, linguistic: linguisticScore },
    markers
  );
  
  return {
    overall,
    breakdown: {
      rhythmic: rhythmicScore,
      harmonic: harmonicScore,
      timbral: timbralScore,
      cultural: culturalScore,
      linguistic: linguisticScore
    },
    regionalStyle,
    culturalMarkers: markers.filter(m => m.detected).map(m => m.name),
    recommendations
  };
}

function calculateRhythmicHeritage(
  features: AudioFeatures,
  elements?: { swingAmount?: number }
): number {
  let score = 50;
  
  // BPM in amapiano range (108-122)
  if (features.bpm >= 108 && features.bpm <= 122) {
    score += 25;
    if (features.bpm >= 112 && features.bpm <= 118) {
      score += 10; // Sweet spot
    }
  } else if (features.bpm >= 100 && features.bpm <= 130) {
    score += 10; // Acceptable range
  }
  
  // Swing amount
  if (elements?.swingAmount) {
    if (elements.swingAmount >= 0.54 && elements.swingAmount <= 0.62) {
      score += 15; // Authentic Gauteng swing
    } else if (elements.swingAmount >= 0.50 && elements.swingAmount <= 0.65) {
      score += 8; // Close to authentic
    }
  }
  
  return Math.min(100, score);
}

function calculateHarmonicHeritage(
  features: AudioFeatures,
  elements?: { pianoVoicing?: string }
): number {
  let score = 50;
  
  // Minor keys are more common in amapiano
  if (features.key.includes('m')) {
    score += 15;
  }
  
  // Jazz voicings
  if (elements?.pianoVoicing) {
    if (['minor7', 'minor9', 'dominant7'].includes(elements.pianoVoicing)) {
      score += 20;
    }
  }
  
  // Spectral characteristics
  if (features.spectralCentroid > 1500 && features.spectralCentroid < 3000) {
    score += 15; // Rhodes/piano range
  }
  
  return Math.min(100, score);
}

function calculateTimbralHeritage(
  features: AudioFeatures,
  elements?: { hasLogDrum?: boolean; hasShaker?: boolean; shakerDensity?: number }
): number {
  let score = 40;
  
  // Log drum presence is essential
  if (elements?.hasLogDrum) {
    score += 30;
  }
  
  // Shaker with appropriate density
  if (elements?.hasShaker) {
    score += 10;
    if (elements.shakerDensity && elements.shakerDensity >= 0.6 && elements.shakerDensity <= 0.85) {
      score += 15; // Authentic shaker density
    }
  }
  
  // Energy profile
  if (features.energy >= 0.4 && features.energy <= 0.75) {
    score += 5; // Balanced energy typical of amapiano
  }
  
  return Math.min(100, score);
}

function calculateCulturalMarkers(
  features: AudioFeatures,
  elements: any,
  markers: CulturalMarker[]
): number {
  let score = 50;
  
  // Detect and score cultural markers
  markers.push({
    name: 'Township Authenticity',
    weight: 0.15,
    detected: features.bpm >= 110 && features.bpm <= 120 && features.energy >= 0.5,
    confidence: 0.8
  });
  
  markers.push({
    name: 'Jazz/Gospel Influence',
    weight: 0.12,
    detected: features.key.includes('m') && elements?.pianoVoicing?.includes('7'),
    confidence: 0.7
  });
  
  markers.push({
    name: 'Log Drum Character',
    weight: 0.15,
    detected: elements?.hasLogDrum === true,
    confidence: elements?.hasLogDrum ? 0.9 : 0
  });
  
  markers.push({
    name: 'Polyrhythmic Layering',
    weight: 0.10,
    detected: elements?.shakerDensity && elements.shakerDensity > 0.5,
    confidence: 0.75
  });
  
  // Calculate score from markers
  for (const marker of markers) {
    if (marker.detected) {
      score += marker.weight * marker.confidence * 100;
    }
  }
  
  return Math.min(100, score);
}

function calculateLinguisticHeritage(vocalLanguage?: string): number {
  if (!vocalLanguage) return 50;
  
  const languageScores: Record<string, number> = {
    'zulu': 95,
    'xhosa': 92,
    'sotho': 90,
    'tswana': 88,
    'pedi': 88,
    'tsonga': 85,
    'venda': 85,
    'swati': 85,
    'ndebele': 85,
    'afrikaans': 75,
    'english': 70,
    'mixed': 90, // Code-switching is authentic
  };
  
  return languageScores[vocalLanguage.toLowerCase()] || 60;
}

function detectRegionalStyle(
  features: AudioFeatures,
  elements?: any
): string {
  let bestMatch = 'gauteng_johannesburg';
  let bestScore = 0;
  
  for (const [region, profile] of Object.entries(HERITAGE_PROFILES)) {
    let score = 0;
    
    // BPM match
    if (features.bpm >= profile.bpmRange[0] && features.bpm <= profile.bpmRange[1]) {
      score += 30;
    }
    
    // Swing match
    if (elements?.swingAmount) {
      if (elements.swingAmount >= profile.swingRange[0] && elements.swingAmount <= profile.swingRange[1]) {
        score += 25;
      }
    }
    
    // Energy profile
    if (region.includes('durban') && features.energy > 0.7) {
      score += 20;
    } else if (region.includes('johannesburg') && features.energy >= 0.5 && features.energy <= 0.75) {
      score += 20;
    } else if (region.includes('cape') && features.energy < 0.6) {
      score += 15;
    }
    
    // Language match
    if (elements?.vocalLanguage && profile.languages.includes(elements.vocalLanguage)) {
      score += 25;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = region;
    }
  }
  
  return bestMatch;
}

function generateHeritageRecommendations(
  scores: { rhythmic: number; harmonic: number; timbral: number; cultural: number; linguistic: number },
  markers: CulturalMarker[]
): string[] {
  const recommendations: string[] = [];
  
  if (scores.rhythmic < 70) {
    recommendations.push('Add more authentic Gauteng swing (0.56-0.60) to rhythmic elements');
  }
  
  if (scores.harmonic < 70) {
    recommendations.push('Consider using minor 7th and 9th chord voicings for jazz influence');
  }
  
  if (scores.timbral < 70) {
    recommendations.push('Include log drum with 60-80Hz fundamental and proper pitch envelope');
    recommendations.push('Add shaker pattern with 12-16 hits per bar');
  }
  
  if (scores.cultural < 70) {
    recommendations.push('Incorporate more township-specific cultural elements');
  }
  
  if (scores.linguistic < 70) {
    recommendations.push('Consider adding vocals in isiZulu, isiXhosa, or Sesotho for authenticity');
  }
  
  const missingMarkers = markers.filter(m => !m.detected && m.weight > 0.10);
  for (const marker of missingMarkers.slice(0, 2)) {
    recommendations.push(`Consider adding: ${marker.name}`);
  }
  
  return recommendations;
}

/**
 * Get heritage profile for a specific region
 */
export function getHeritageProfile(region: string) {
  return HERITAGE_PROFILES[region] || HERITAGE_PROFILES.gauteng_johannesburg;
}

/**
 * List all available heritage profiles
 */
export function listHeritageProfiles(): Array<{ key: string; name: string; province: string }> {
  return Object.entries(HERITAGE_PROFILES).map(([key, profile]) => ({
    key,
    name: profile.name,
    province: profile.province
  }));
}
