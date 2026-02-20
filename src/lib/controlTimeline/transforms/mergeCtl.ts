import type { ControlTimelineSection, ControlTimelineV1, SectionLabel } from "../controlTimeline";
import { validateCtl, resampleCurve, shiftSections } from "./_helpers";
import { clamp01 } from "../utils";

/**
 * Merge (mashup) two CTLs into one.
 * mergeMode "overlay" = mashup (curves blended, same duration)
 * mergeMode "append"  = medley (B appended after A)
 */
export function mergeCtl(
  a: ControlTimelineV1,
  b: ControlTimelineV1,
  opts?: {
    durationFrames?: number;
    curveStrategy?: "avg" | "max" | "a_over_b" | "b_over_a";
    bpmPolicy?: "a" | "b" | "avg";
    sectionPolicy?: "concat" | "a_only" | "b_only";
    labelPrefix?: boolean;
    /** "overlay" = mashup (default), "append" = medley (B after A) */
    mergeMode?: "overlay" | "append";
  }
): ControlTimelineV1 {
  const mergeMode = opts?.mergeMode ?? "overlay";

  if (mergeMode === "append") {
    return appendMerge(a, b, opts);
  }
  return overlayMerge(a, b, opts);
}

function overlayMerge(
  a: ControlTimelineV1,
  b: ControlTimelineV1,
  opts?: Parameters<typeof mergeCtl>[2]
): ControlTimelineV1 {
  const curveStrategy = opts?.curveStrategy ?? "avg";
  const bpmPolicy = opts?.bpmPolicy ?? "a";
  const sectionPolicy = opts?.sectionPolicy ?? "concat";

  const T = opts?.durationFrames ?? Math.max(a.duration_frames, b.duration_frames);

  const aCurves: any = {};
  const bCurves: any = {};

  for (const [k, v] of Object.entries(a.curves)) {
    if (!Array.isArray(v)) continue;
    aCurves[k] = v.length === T ? v : resampleCurve(v as number[], T, k === "vocal_presence" ? 0 : 0.5);
  }
  for (const [k, v] of Object.entries(b.curves)) {
    if (!Array.isArray(v)) continue;
    bCurves[k] = v.length === T ? v : resampleCurve(v as number[], T, k === "vocal_presence" ? 0 : 0.5);
  }

  const curves: any = {};
  const keys = new Set<string>([...Object.keys(aCurves), ...Object.keys(bCurves)]);
  for (const k of keys) {
    const ac = aCurves[k] as number[] | undefined;
    const bc = bCurves[k] as number[] | undefined;
    const fallback = k === "vocal_presence" ? 0 : 0.5;

    const aa = ac ?? new Array<number>(T).fill(fallback);
    const bb = bc ?? new Array<number>(T).fill(fallback);

    const out = new Array<number>(T);
    for (let i = 0; i < T; i++) {
      const x = aa[i] ?? fallback;
      const y = bb[i] ?? fallback;
      let v = x;

      if (curveStrategy === "avg") v = (x + y) / 2;
      if (curveStrategy === "max") v = Math.max(x, y);
      if (curveStrategy === "a_over_b") v = x;
      if (curveStrategy === "b_over_a") v = y;

      out[i] = clamp01(v);
    }
    curves[k] = out;
  }

  let sections: ControlTimelineSection[] = [];
  if (sectionPolicy === "a_only") sections = a.sections.map(s => ({ ...s }));
  else if (sectionPolicy === "b_only") sections = b.sections.map(s => ({ ...s }));
  else {
    sections = [
      ...a.sections.map(s => ({ ...s })),
      ...b.sections.map(s => ({ ...s })),
    ];
  }

  sections = sections
    .map(s => ({
      ...s,
      start_frame: Math.max(0, Math.min(T, s.start_frame)),
      end_frame: Math.max(0, Math.min(T, s.end_frame)),
    }))
    .filter(s => s.end_frame > s.start_frame);

  const global = { ...a.global };
  if (bpmPolicy === "b") global.bpm = b.global.bpm;
  if (bpmPolicy === "avg") global.bpm = Math.max(40, Math.min(220, (a.global.bpm + b.global.bpm) / 2));
  global.swing = clamp01(global.swing);

  return validateCtl({
    schema_version: "ctl_v1",
    codec_id: a.codec_id,
    frame_rate_hz: 50,
    duration_frames: T,
    global,
    sections,
    curves,
    groove: a.groove,
  });
}

/** Append mode: B's curves are concatenated after A's, sections shifted */
function appendMerge(
  a: ControlTimelineV1,
  b: ControlTimelineV1,
  opts?: Parameters<typeof mergeCtl>[2]
): ControlTimelineV1 {
  const bpmPolicy = opts?.bpmPolicy ?? "a";
  const T = a.duration_frames + b.duration_frames;

  // Concatenate curves
  const curves: any = {};
  const allKeys = new Set<string>([
    ...Object.keys(a.curves),
    ...Object.keys(b.curves),
  ]);

  for (const k of allKeys) {
    const fallback = k === "vocal_presence" ? 0 : 0.5;
    const aCurve = (a.curves as any)[k] as number[] | undefined;
    const bCurve = (b.curves as any)[k] as number[] | undefined;

    const partA = aCurve ?? new Array<number>(a.duration_frames).fill(fallback);
    const partB = bCurve ?? new Array<number>(b.duration_frames).fill(fallback);

    curves[k] = [...partA, ...partB];
  }

  // Sections: A's sections + B's sections shifted by A's duration
  const sections: ControlTimelineSection[] = [
    ...a.sections.map(s => ({ ...s })),
    ...shiftSections(b.sections.map(s => ({ ...s })), a.duration_frames),
  ];

  const global = { ...a.global };
  if (bpmPolicy === "b") global.bpm = b.global.bpm;
  if (bpmPolicy === "avg") global.bpm = Math.max(40, Math.min(220, (a.global.bpm + b.global.bpm) / 2));
  global.swing = clamp01(global.swing);

  return validateCtl({
    schema_version: "ctl_v1",
    codec_id: a.codec_id,
    frame_rate_hz: 50,
    duration_frames: T,
    global,
    sections,
    curves,
    groove: a.groove,
  });
}
