/**
 * Suno verb: Use Styles & Lyrics
 * Applies a style delta and optionally schedules vocal presence.
 */
import type { ControlTimelineV1 } from "../controlTimeline";
import { applyStyle } from "../transforms";
import type { StyleDelta } from "../transforms";
import { clamp01 } from "../utils";

export interface UseStylesOpts {
  /** Style modifications */
  style: StyleDelta;
  /** Vocal schedule: array of { startSec, endSec, presence } */
  vocalSchedule?: Array<{
    startSec: number;
    endSec: number;
    presence: number;
  }>;
}

export function useStylesAndLyrics(
  ctl: ControlTimelineV1,
  opts: UseStylesOpts
): ControlTimelineV1 {
  let result = applyStyle(ctl, opts.style);

  // Apply vocal presence schedule
  if (opts.vocalSchedule?.length) {
    const T = result.duration_frames;
    const FR = result.frame_rate_hz;
    const vp = new Array<number>(T).fill(0);

    for (const seg of opts.vocalSchedule) {
      const startFrame = Math.max(0, Math.min(T, Math.round(seg.startSec * FR)));
      const endFrame = Math.max(startFrame, Math.min(T, Math.round(seg.endSec * FR)));
      const p = clamp01(seg.presence);
      for (let i = startFrame; i < endFrame; i++) {
        vp[i] = Math.max(vp[i], p); // max-merge overlapping schedules
      }
    }

    result = {
      ...result,
      curves: {
        ...result.curves,
        vocal_presence: vp,
      },
    };
  }

  return result;
}
