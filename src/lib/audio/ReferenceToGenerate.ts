/**
 * Reference-to-Generate Pipeline
 * 
 * Analyzes a reference audio track and extracts production constraints
 * that can be fed into the Text-to-Production generator to create
 * a new Amapiano track matching the reference's vibe.
 */

import {
  analyzeAudioFromUrl,
  analyzeAudioBuffer,
  type AnalysisResult,
  type GenreClassification,
} from './SharedAnalysisPipeline';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReferenceConstraints {
  /** Detected BPM — used as target for generation */
  bpm: number;
  bpmConfidence: number;
  
  /** Musical key in standard notation (e.g. "Cm", "G") */
  key: string;
  /** Camelot wheel code for harmonic compatibility */
  camelot: string;
  
  /** Target loudness in LUFS */
  targetLufs: number;
  
  /** Energy profile: normalized 0-1 values representing the track's energy arc */
  energyProfile: number[];
  /** Average energy level */
  avgEnergy: number;
  
  /** Vocal presence: 0 (instrumental) to 1 (heavily vocal) */
  vocalPresence: number;
  
  /** Genre classification with Amapiano subgenre detection */
  genre: GenreClassification;
  
  /** Whether the reference is already Amapiano-family */
  isAmapiano: boolean;
  
  /** Suggested production prompt derived from analysis */
  suggestedPrompt: string;
  
  /** Section structure detected in the reference */
  structure: {
    type: string;
    durationSec: number;
    energy: number;
  }[];
  
  /** Raw analysis for advanced use */
  rawAnalysis: AnalysisResult;
}

// ─── Core Pipeline ──────────────────────────────────────────────────────────

/**
 * Analyze a reference track from URL and extract generation constraints.
 */
export async function analyzeReference(fileUrl: string): Promise<ReferenceConstraints> {
  const analysis = await analyzeAudioFromUrl(fileUrl, {
    maxAnalysisDurationSec: 60,
    decodeSampleRate: 22050,
    numBins: 64,
    includeGenre: true,
  });

  return buildConstraints(analysis);
}

/**
 * Analyze a reference track from an AudioBuffer.
 */
export async function analyzeReferenceBuffer(buffer: AudioBuffer): Promise<ReferenceConstraints> {
  const analysis = await analyzeAudioBuffer(buffer, {
    maxAnalysisDurationSec: 60,
    numBins: 64,
    includeGenre: true,
  });

  return buildConstraints(analysis);
}

/**
 * Build generation constraints from raw analysis.
 */
function buildConstraints(analysis: AnalysisResult): ReferenceConstraints {
  const genre: GenreClassification = analysis.genre || {
    isAmapiano: false,
    confidence: 0,
    indicators: [],
  };
  
  const avgEnergy = analysis.energyCurve.reduce((a, b) => a + b, 0) / analysis.energyCurve.length;
  
  const vocalPresence = analysis.vocalActivityCurve.length > 0
    ? analysis.vocalActivityCurve.reduce((a, b) => a + b, 0) / analysis.vocalActivityCurve.length
    : 0;

  const isAmapiano = genre.isAmapiano;

  const structure = analysis.segments.map(seg => ({
    type: seg.type,
    durationSec: Math.round((seg.endSec - seg.startSec) * 10) / 10,
    energy: Math.round(seg.energy * 100) / 100,
  }));

  const suggestedPrompt = generatePrompt(analysis, genre, avgEnergy, vocalPresence, isAmapiano);

  return {
    bpm: analysis.bpm,
    bpmConfidence: analysis.bpmConfidence,
    key: analysis.key,
    camelot: analysis.camelot,
    targetLufs: analysis.lufsIntegrated,
    energyProfile: analysis.energyCurve,
    avgEnergy: Math.round(avgEnergy * 100) / 100,
    vocalPresence: Math.round(vocalPresence * 100) / 100,
    genre,
    isAmapiano,
    suggestedPrompt,
    structure,
    rawAnalysis: analysis,
  };
}

// ─── Prompt Generation ──────────────────────────────────────────────────────

/**
 * Generate a natural language production prompt from reference analysis.
 */
function generatePrompt(
  analysis: AnalysisResult,
  genre: GenreClassification,
  avgEnergy: number,
  vocalPresence: number,
  isAmapiano: boolean
): string {
  const parts: string[] = [];

  // Genre / style
  if (isAmapiano) {
    const subgenreLabel = genre.subgenre
      ? genre.subgenre.replace(/_/g, ' ')
      : 'Amapiano';
    parts.push(subgenreLabel);
  } else {
    parts.push(`Amapiano-inspired track`);
  }

  // BPM
  parts.push(`${Math.round(analysis.bpm)} BPM`);

  // Key
  parts.push(`in ${analysis.key}`);

  // Energy descriptor
  if (avgEnergy > 0.75) parts.push('high energy');
  else if (avgEnergy > 0.5) parts.push('medium energy');
  else if (avgEnergy > 0.3) parts.push('mellow');
  else parts.push('ambient / downtempo');

  // Vocal presence
  if (vocalPresence > 0.6) parts.push('with prominent vocals');
  else if (vocalPresence > 0.3) parts.push('with subtle vocal elements');
  else parts.push('instrumental');

  // Structure hint
  const hasDrop = analysis.segments.some(s => s.type === 'drop');
  const hasBreakdown = analysis.segments.some(s => s.type === 'breakdown');
  if (hasDrop && hasBreakdown) parts.push('with build-up and drop');
  else if (hasDrop) parts.push('with impactful drop');

  // Loudness target
  if (analysis.lufsIntegrated > -8) parts.push('loud master');
  else if (analysis.lufsIntegrated < -12) parts.push('dynamic range preserved');

  return parts.join(', ');
}

/**
 * Convert constraints to a structured parameter object
 * suitable for the Text-to-Production pipeline.
 */
export function constraintsToProductionParams(constraints: ReferenceConstraints): {
  bpm: number;
  key: string;
  targetLufs: number;
  energyTarget: number;
  vocalLevel: 'none' | 'subtle' | 'prominent';
  style: string;
  sections: { type: string; bars: number }[];
} {
  const vocalLevel: 'none' | 'subtle' | 'prominent' =
    constraints.vocalPresence > 0.6 ? 'prominent' :
    constraints.vocalPresence > 0.3 ? 'subtle' : 'none';

  const barsPerSec = constraints.bpm / 60 / 4; // bars per second
  const sections = constraints.structure.map(s => ({
    type: s.type,
    bars: Math.max(4, Math.round(s.durationSec * barsPerSec / 4) * 4), // quantize to 4-bar
  }));

  return {
    bpm: Math.round(constraints.bpm),
    key: constraints.key,
    targetLufs: constraints.targetLufs,
    energyTarget: constraints.avgEnergy,
    vocalLevel,
    style: constraints.isAmapiano
      ? (constraints.genre.subgenre || 'amapiano')
      : 'amapiano',
    sections,
  };
}
