import type { ControlTimelineV1 } from "../controlTimeline";
import { validateCtl } from "./_helpers";
import { clamp01 } from "../utils";
import { getGrooveForGenre } from "../groovePresets";

export type StyleDelta = {
  genre?: string;
  mix_profile?: string;
  bpm_delta?: number;
  swing_delta?: number;
  key?: string;
  mood_tags_add?: string[];
  curve_deltas?: Partial<Record<
    "energy" | "log_drum_density" | "perc_density" | "pad_warmth" | "bass_presence" | "vocal_presence",
    number
  >>;
  groove_template_id?: string;
};

/**
 * Apply a style delta to CTL (non-destructive transform).
 * Updates global genre/mix/BPM/swing/mood, applies curve deltas, optionally swaps groove.
 */
export function applyStyle(ctl: ControlTimelineV1, delta: StyleDelta): ControlTimelineV1 {
  const global = { ...ctl.global };

  if (delta.genre) global.genre = delta.genre as any;
  if (delta.mix_profile) global.mix_profile = delta.mix_profile as any;
  if (typeof delta.bpm_delta === "number") global.bpm = Math.max(40, Math.min(220, global.bpm + delta.bpm_delta));
  if (typeof delta.swing_delta === "number") global.swing = clamp01(global.swing + delta.swing_delta);
  if (delta.key) global.key = delta.key;

  if (delta.mood_tags_add?.length) {
    const existing = new Set(global.mood_tags ?? []);
    for (const t of delta.mood_tags_add) existing.add(t);
    global.mood_tags = Array.from(existing).slice(0, 12);
  }

  const curves: any = { ...ctl.curves };
  if (delta.curve_deltas) {
    for (const [k, d] of Object.entries(delta.curve_deltas)) {
      const arr = curves[k];
      if (!Array.isArray(arr) || typeof d !== "number") continue;
      curves[k] = arr.map((v: number) => clamp01(v + d));
    }
  }

  let groove = ctl.groove;
  if (delta.genre) groove = getGrooveForGenre(delta.genre);
  if (delta.groove_template_id && groove.template_id !== delta.groove_template_id) {
    groove = { ...groove, template_id: delta.groove_template_id };
  }

  return validateCtl({
    ...ctl,
    global,
    curves,
    groove,
  });
}
