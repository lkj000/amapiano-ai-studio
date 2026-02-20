/**
 * Suno verb: Mashup
 * Merges two CTLs in overlay mode (curves blended).
 */
import type { ControlTimelineV1 } from "../controlTimeline";
import { mergeCtl } from "../transforms";

export interface MashupOpts {
  /** Curve blending strategy */
  curveStrategy?: "avg" | "max" | "a_over_b" | "b_over_a";
  /** BPM resolution */
  bpmPolicy?: "a" | "b" | "avg";
}

export function mashup(
  ctlA: ControlTimelineV1,
  ctlB: ControlTimelineV1,
  opts?: MashupOpts
): ControlTimelineV1 {
  return mergeCtl(ctlA, ctlB, {
    mergeMode: "overlay",
    curveStrategy: opts?.curveStrategy ?? "avg",
    bpmPolicy: opts?.bpmPolicy ?? "avg",
    sectionPolicy: "concat",
  });
}

/** Medley: appends B after A */
export function medley(
  ctlA: ControlTimelineV1,
  ctlB: ControlTimelineV1,
  opts?: { bpmPolicy?: "a" | "b" | "avg" }
): ControlTimelineV1 {
  return mergeCtl(ctlA, ctlB, {
    mergeMode: "append",
    bpmPolicy: opts?.bpmPolicy ?? "a",
  });
}
