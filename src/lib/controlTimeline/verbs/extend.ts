/**
 * Suno verb: Extend
 * Appends additional time to a CTL with configurable section label and ramp.
 */
import type { ControlTimelineV1, SectionLabel } from "../controlTimeline";
import { extendCtl } from "../transforms";

export interface ExtendOpts {
  /** Extension duration in seconds */
  seconds?: number;
  /** Extension duration in frames (overrides seconds) */
  frames?: number;
  /** Section label for the extension */
  label?: SectionLabel;
  /** Curve ramp direction */
  ramp?: "up" | "down" | "flat";
}

export function extend(ctl: ControlTimelineV1, opts: ExtendOpts): ControlTimelineV1 {
  return extendCtl(ctl, {
    extraSeconds: opts.seconds,
    extraFrames: opts.frames,
    label: opts.label ?? "outro",
    ramp: opts.ramp ?? "flat",
    inheritGroove: true,
  });
}
