/**
 * ControlTimeline v1 — Runtime Validation with Zod
 * Authoritative validator (JSON Schema cannot enforce cross-field constraints).
 */

import { z } from 'zod';
import type { ControlTimelineV1, ControlTimelineSection, SectionLabel } from './controlTimeline';

// ============ Primitives ============

const GenreIdSchema = z.enum([
  'amapiano_private_school',
  'amapiano_sgija',
  'amapiano_bacardi',
  'afro_house',
  'deep_house',
  'afrobeats',
  'hip_hop',
  'pop',
  'other',
]);

const MixProfileSchema = z.enum(['club', 'warm', 'radio', 'lofi', 'cinematic']);

const SectionLabelSchema = z.enum(['intro', 'verse', 'pre', 'chorus', 'break', 'drop', 'outro']);

const bit = z.union([z.literal(0), z.literal(1)]);

const Pattern16Schema = z.tuple([
  bit, bit, bit, bit,
  bit, bit, bit, bit,
  bit, bit, bit, bit,
  bit, bit, bit, bit,
]);

const Microtiming16Schema = z.tuple([
  z.number(), z.number(), z.number(), z.number(),
  z.number(), z.number(), z.number(), z.number(),
  z.number(), z.number(), z.number(), z.number(),
  z.number(), z.number(), z.number(), z.number(),
]).superRefine((arr, ctx) => {
  for (let i = 0; i < 16; i++) {
    const val = arr[i] as number;
    if (val < -0.08 || val > 0.08) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `microtiming_16[${i}] out of range [-0.08, 0.08]`,
      });
    }
  }
});

const CurveSchema = z.array(z.number().min(0).max(1));

// ============ Composite Schemas ============

const VocalsSchema = z.object({
  enabled: z.boolean().optional(),
  language_tags: z.array(z.string()).optional(),
  presence: z.number().min(0).max(1).optional(),
}).optional();

const GlobalSchema = z.object({
  title: z.string().optional(),
  bpm: z.number().min(40).max(220),
  swing: z.number().min(0).max(1),
  key: z.string().regex(/^[A-G](#|b)?(maj|min)$/).optional(),
  genre: GenreIdSchema,
  mood_tags: z.array(z.string()).max(12).optional(),
  mix_profile: MixProfileSchema,
  vocals: VocalsSchema,
});

const SectionSchema = z.object({
  start_frame: z.number().int().min(0),
  end_frame: z.number().int().min(1),
  label: SectionLabelSchema,
  notes: z.string().optional(),
});

const CurvesSchema = z.object({
  energy: CurveSchema,
  log_drum_density: CurveSchema,
  perc_density: CurveSchema,
  pad_warmth: CurveSchema,
  bass_presence: CurveSchema,
  vocal_presence: CurveSchema.optional(),
});

const GrooveSchema = z.object({
  template_id: z.string().min(1),
  kick_16: Pattern16Schema,
  snare_clap_16: Pattern16Schema,
  hat_16: Pattern16Schema,
  logdrum_16: Pattern16Schema,
  microtiming_16: Microtiming16Schema,
});

// ============ Top-Level Schema ============

export const ControlTimelineV1Schema = z.object({
  schema_version: z.literal('ctl_v1'),
  codec_id: z.string().min(1),
  frame_rate_hz: z.literal(50),
  duration_frames: z.number().int().min(50),
  seed: z.number().int().optional(),
  global: GlobalSchema,
  sections: z.array(SectionSchema).min(1),
  curves: CurvesSchema,
  groove: GrooveSchema,
}).superRefine((ctl, ctx) => {
  const T = ctl.duration_frames;

  // Validate curve lengths match duration_frames
  const curveKeys = ['energy', 'log_drum_density', 'perc_density', 'pad_warmth', 'bass_presence', 'vocal_presence'] as const;
  for (const k of curveKeys) {
    const arr = ctl.curves[k];
    if (!arr) continue;
    if (arr.length !== T) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `curves.${k} length ${arr.length} !== duration_frames ${T}`,
      });
    }
  }

  // Validate section bounds
  for (let i = 0; i < ctl.sections.length; i++) {
    const s = ctl.sections[i];
    if (s.end_frame <= s.start_frame) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `sections[${i}] end_frame must be > start_frame`,
      });
    }
    if (s.start_frame >= T || s.end_frame > T) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `sections[${i}] out of bounds (0..${T})`,
      });
    }
  }

  // Enforce non-overlapping sections
  const sorted = [...ctl.sections].sort((a, b) => a.start_frame - b.start_frame);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start_frame < sorted[i - 1].end_frame) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `sections overlap between index ${i - 1} and ${i}`,
      });
      break;
    }
  }
});

// ============ Parse / Validate ============

export function parseControlTimelineV1(input: unknown): ControlTimelineV1 {
  return ControlTimelineV1Schema.parse(input) as ControlTimelineV1;
}

export function safeParseControlTimelineV1(input: unknown) {
  return ControlTimelineV1Schema.safeParse(input);
}

// ============ Helpers ============

/**
 * Fill gaps and trim overlaps between sections.
 * Returns a sorted, contiguous section array covering [0, durationFrames).
 */
export function normalizeSections(
  sections: ControlTimelineSection[],
  durationFrames: number,
  fillLabel: SectionLabel = 'verse'
): ControlTimelineSection[] {
  // Clip to bounds and discard degenerate sections
  const clipped = sections
    .map((s) => ({
      ...s,
      start_frame: Math.max(0, Math.min(durationFrames, s.start_frame)),
      end_frame: Math.max(0, Math.min(durationFrames, s.end_frame)),
    }))
    .filter((s) => s.end_frame > s.start_frame);

  const sorted = [...clipped].sort((a, b) => a.start_frame - b.start_frame);
  const result: typeof sorted = [];
  let cursor = 0;

  for (const s of sorted) {
    // Fill gap before this section
    if (s.start_frame > cursor) {
      result.push({ start_frame: cursor, end_frame: s.start_frame, label: fillLabel });
    }
    // Trim overlap: start from cursor if it's past this section's start
    const start = Math.max(cursor, s.start_frame);
    if (s.end_frame > start) {
      result.push({ ...s, start_frame: start });
      cursor = s.end_frame;
    } else {
      cursor = Math.max(cursor, s.end_frame);
    }
  }

  // Fill trailing gap
  if (cursor < durationFrames) {
    result.push({ start_frame: cursor, end_frame: durationFrames, label: fillLabel });
  }

  return result;
}
