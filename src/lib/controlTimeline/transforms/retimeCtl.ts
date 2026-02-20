import type { ControlTimelineV1 } from "../controlTimeline";
import { validateCtl, resampleCurve } from "./_helpers";
import { clamp01 } from "../utils";

/**
 * Retime a CTL by changing playback speed (time scaling).
 * speed > 1.0 => faster (shorter duration)
 * speed < 1.0 => slower (longer duration)
 *
 * mode "stretch": keeps BPM unchanged (time-stretch semantics)
 * mode "bpm": changes BPM proportionally
 */
export function retimeCtl(
  ctl: ControlTimelineV1,
  opts: { speed: number; mode?: "stretch" | "bpm" }
): ControlTimelineV1 {
  const speed = Math.max(0.05, Math.min(8, opts.speed));
  const mode = opts.mode ?? "stretch";

  const oldT = ctl.duration_frames;
  const newT = Math.max(50, Math.ceil(oldT / speed));

  // Resample curves to new length
  const curves: any = {};
  for (const [k, v] of Object.entries(ctl.curves)) {
    if (!Array.isArray(v)) continue;
    const fallback = k === "vocal_presence" ? 0 : 0.5;
    curves[k] = resampleCurve(v as number[], newT, fallback);
  }

  // Scale sections
  const sections = ctl.sections
    .map(s => ({
      ...s,
      start_frame: Math.round(s.start_frame / speed),
      end_frame: Math.round(s.end_frame / speed),
    }))
    .map(s => ({
      ...s,
      start_frame: Math.max(0, Math.min(newT, s.start_frame)),
      end_frame: Math.max(0, Math.min(newT, s.end_frame)),
    }))
    .filter(s => s.end_frame > s.start_frame);

  // Global BPM handling
  const global = { ...ctl.global };
  if (mode === "bpm") {
    global.bpm = Math.max(40, Math.min(220, global.bpm * speed));
    global.swing = clamp01(global.swing);
  }

  const out: ControlTimelineV1 = {
    ...ctl,
    duration_frames: newT,
    global,
    sections,
    curves,
  };

  return validateCtl(out);
}
