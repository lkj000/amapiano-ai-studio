/**
 * Suno verb: Adjust Speed
 * Exposes retimeCtl with clear UX semantics:
 * - "dj" mode: BPM changes (DJ-style pitch+speed)
 * - "arrangement" mode: duration changes, BPM stays constant (time-stretch)
 */
import type { ControlTimelineV1 } from "../controlTimeline";
import { retimeCtl } from "../transforms";

export type SpeedMode =
  | "dj"          // BPM changes proportionally — mode="bpm"
  | "arrangement"; // Duration changes, BPM constant — mode="stretch"

export interface AdjustSpeedOpts {
  /** Speed multiplier (e.g. 1.5 = 50% faster) */
  speed: number;
  /** UX mode: "dj" or "arrangement" */
  mode?: SpeedMode;
}

export function adjustSpeed(ctl: ControlTimelineV1, opts: AdjustSpeedOpts): ControlTimelineV1 {
  const mode = opts.mode ?? "arrangement";
  return retimeCtl(ctl, {
    speed: opts.speed,
    mode: mode === "dj" ? "bpm" : "stretch",
  });
}
