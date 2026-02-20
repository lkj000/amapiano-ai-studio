import type { ControlTimelineV1, SectionLabel } from "../controlTimeline";
import { validateCtl, makeFillSection } from "./_helpers";
import { clamp01 } from "../utils";

/**
 * Extend a CTL by appending a new tail segment.
 * Specify extraSeconds or extraFrames, a section label, and an optional ramp direction.
 */
export function extendCtl(
  ctl: ControlTimelineV1,
  opts: {
    extraSeconds?: number;
    extraFrames?: number;
    label?: SectionLabel;
    ramp?: "up" | "down" | "flat";
    inheritGroove?: boolean;
  }
): ControlTimelineV1 {
  const extraFrames =
    opts.extraFrames ??
    Math.max(0, Math.ceil((opts.extraSeconds ?? 0) * ctl.frame_rate_hz));

  if (extraFrames <= 0) return validateCtl({ ...ctl });

  const oldT = ctl.duration_frames;
  const newT = oldT + extraFrames;
  const ramp = opts.ramp ?? "flat";
  const label = opts.label ?? "outro";

  const curves: any = {};
  for (const [k, v] of Object.entries(ctl.curves)) {
    if (!Array.isArray(v)) continue;

    const base = v as number[];
    const fallback = k === "vocal_presence" ? 0 : 0.5;
    const out = new Array<number>(newT);

    for (let i = 0; i < oldT; i++) out[i] = base[i] ?? fallback;

    const startVal = out[oldT - 1] ?? fallback;
    for (let i = 0; i < extraFrames; i++) {
      const t = extraFrames <= 1 ? 1 : i / (extraFrames - 1);
      let val = startVal;
      if (ramp === "up") val = clamp01(startVal + (1 - startVal) * t);
      if (ramp === "down") val = clamp01(startVal * (1 - t));
      out[oldT + i] = clamp01(Number.isFinite(val) ? val : fallback);
    }

    curves[k] = out;
  }

  const sections = [
    ...ctl.sections.map(s => ({ ...s })),
    makeFillSection(oldT, newT, label),
  ];

  const out: ControlTimelineV1 = {
    ...ctl,
    duration_frames: newT,
    sections,
    curves,
  };

  return validateCtl(out);
}
