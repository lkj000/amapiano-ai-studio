/**
 * DJ Audio Analyzer — thin wrapper around SharedAnalysisPipeline
 * Converts shared AnalysisResult into DJ-specific DJTrack/TrackFeatures types.
 */

import { DJTrack, TrackFeatures, TrackSegment } from './DJAgentTypes';
import {
  analyzeAudioFromUrl,
  getCamelotCompatibility as sharedCamelotCompat,
  type AnalysisResult,
  type AudioSegment,
} from '@/lib/audio/SharedAnalysisPipeline';

/**
 * Analyze a DJ track using the shared pipeline.
 * Limits to 45s at 11025 Hz for memory safety during batch processing.
 */
export async function analyzeTrackReal(track: DJTrack): Promise<DJTrack> {
  const result: AnalysisResult = await analyzeAudioFromUrl(track.fileUrl, {
    maxAnalysisDurationSec: 45,
    decodeSampleRate: 11025,
    numBins: 32,
    includeGenre: false,
  });

  const features: TrackFeatures = {
    bpm: result.bpm,
    bpmConfidence: result.bpmConfidence,
    key: result.key,
    camelot: result.camelot,
    lufsIntegrated: result.lufsIntegrated,
    energyCurve: result.energyCurve,
    segments: result.segments.map(segmentToTrackSegment),
    vocalActivityCurve: result.vocalActivityCurve,
  };

  return { ...track, durationSec: result.durationSec, features };
}

function segmentToTrackSegment(seg: AudioSegment): TrackSegment {
  return {
    type: seg.type,
    startSec: seg.startSec,
    endSec: seg.endSec,
    energy: seg.energy,
  };
}

// Re-export Camelot compatibility from shared pipeline
export const getCamelotCompatibility = sharedCamelotCompat;
