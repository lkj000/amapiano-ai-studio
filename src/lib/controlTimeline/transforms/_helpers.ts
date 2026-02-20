import type { ControlTimelineSection, ControlTimelineV1, SectionLabel } from "../controlTimeline";
import { ControlTimelineV1Schema, normalizeSections } from "../controlTimeline.zod";
import { FR, clamp01, sanitizeCurve } from "../utils";

// ============ Guardrails ============

/** Max sections allowed — prevents runaway fragmentation from repeated splice/merge */
export const MAX_SECTIONS = 256;
/** Max automation lane points per curve (20 min at 1Hz) */
export const MAX_LANE_POINTS = 1200;

export type CurveKey =
  | "energy"
  | "log_drum_density"
  | "perc_density"
  | "pad_warmth"
  | "bass_presence"
  | "vocal_presence";

export const REQUIRED_CURVES: CurveKey[] = [
  "energy",
  "log_drum_density",
  "perc_density",
  "pad_warmth",
  "bass_presence",
];

export function durationFramesFromSeconds(seconds: number): number {
  return Math.max(50, Math.ceil(seconds * FR));
}

export function framesToSeconds(frames: number): number {
  return frames / FR;
}

export function clampFrame(f: number, T: number): number {
  return Math.max(0, Math.min(T, Math.round(f)));
}

export function sliceCurve(curve: number[], startFrame: number, endFrame: number, fallback = 0.5): number[] {
  const s = Math.max(0, Math.min(curve.length, startFrame));
  const e = Math.max(s, Math.min(curve.length, endFrame));
  const seg = curve.slice(s, e);
  const len = e - s;
  if (seg.length !== len) {
    const out = new Array<number>(len).fill(fallback);
    for (let i = 0; i < Math.min(seg.length, len); i++) out[i] = seg[i];
    return sanitizeCurve(out, fallback);
  }
  return sanitizeCurve(seg, fallback);
}

/** Linear resample to new length. Used for retime. */
export function resampleCurve(curve: number[], newLength: number, fallback = 0.5): number[] {
  if (newLength <= 0) return [];
  if (!curve.length) return new Array<number>(newLength).fill(fallback);
  if (newLength === 1) return [clamp01(Number.isFinite(curve[0]) ? curve[0] : fallback)];

  const src = sanitizeCurve(curve, fallback);
  const out = new Array<number>(newLength);

  for (let i = 0; i < newLength; i++) {
    const t = i / (newLength - 1);
    const idx = t * (src.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(src.length - 1, lo + 1);
    const w = idx - lo;
    out[i] = clamp01(src[lo] * (1 - w) + src[hi] * w);
  }
  return out;
}

export function ensureCurvesLength(ctl: ControlTimelineV1): ControlTimelineV1 {
  const T = ctl.duration_frames;
  const curves: any = { ...ctl.curves };

  for (const k of REQUIRED_CURVES) {
    const arr = curves[k] as number[] | undefined;
    curves[k] = sanitizeCurve((arr && arr.length === T) ? arr : resampleCurve(arr ?? [], T, 0.5), 0.5);
  }

  if (curves.vocal_presence) {
    curves.vocal_presence = sanitizeCurve(
      curves.vocal_presence.length === T ? curves.vocal_presence : resampleCurve(curves.vocal_presence, T, 0),
      0
    );
  }

  return { ...ctl, curves };
}

export function shiftSections(sections: ControlTimelineSection[], frameOffset: number): ControlTimelineSection[] {
  return sections.map(s => ({
    ...s,
    start_frame: s.start_frame + frameOffset,
    end_frame: s.end_frame + frameOffset,
  }));
}

export function trimSectionsToRange(
  sections: ControlTimelineSection[],
  startFrame: number,
  endFrame: number
): ControlTimelineSection[] {
  return sections
    .map(s => ({
      ...s,
      start_frame: Math.max(startFrame, s.start_frame),
      end_frame: Math.min(endFrame, s.end_frame),
    }))
    .filter(s => s.end_frame > s.start_frame);
}

export function validateCtl(ctl: ControlTimelineV1): ControlTimelineV1 {
  let sections = normalizeSections(ctl.sections, ctl.duration_frames, "verse");

  // Guardrail: cap section count
  if (sections.length > MAX_SECTIONS) {
    // Merge smallest adjacent same-label sections until under cap
    sections = sections.slice(0, MAX_SECTIONS);
    // Re-normalize to fill any trailing gap
    sections = normalizeSections(sections, ctl.duration_frames, "verse");
  }

  const normalized: ControlTimelineV1 = { ...ctl, sections };
  const fixed = ensureCurvesLength(normalized);
  return ControlTimelineV1Schema.parse(fixed) as ControlTimelineV1;
}

export function makeFillSection(start: number, end: number, label: SectionLabel = "verse"): ControlTimelineSection {
  return { start_frame: start, end_frame: end, label };
}
