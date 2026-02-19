/**
 * ControlTimeline Module — Public API
 * 
 * Usage:
 *   import { type ControlTimelineV1, parseControlTimelineV1, buildMusicGenRequest } from '@/lib/controlTimeline';
 */

// Core types
export type {
  GenreId,
  MixProfile,
  SectionLabel,
  Pattern16,
  Microtiming16,
  ControlTimelineSection,
  ControlTimelineGlobal,
  ControlTimelineVocals,
  ControlTimelineCurves,
  ControlTimelineGroove,
  ControlTimelineV1,
} from './controlTimeline';

// Helpers
export {
  framesToSeconds,
  secondsToFrames,
  beatsToFrames,
  constantCurve,
  linearRamp,
} from './controlTimeline';

// Validation
export {
  ControlTimelineV1Schema,
  parseControlTimelineV1,
  safeParseControlTimelineV1,
  normalizeSections,
} from './controlTimeline.zod';

// MusicGen adapter
export type { MusicGenRequest } from './musicgenAdapter';
export { buildMusicGenRequest } from './musicgenAdapter';

// Dataset logging
export type { DatasetRecord } from './datasetLogger';
export { logDatasetRecord, createDatasetRecord } from './datasetLogger';

// Groove presets
export { GROOVE_PRESETS, getGrooveForGenre } from './groovePresets';
