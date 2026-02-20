import { describe, it, expect } from "vitest";
import type { ControlTimelineV1 } from "../../controlTimeline";
import { ControlTimelineV1Schema } from "../../controlTimeline.zod";
import { extendCtl } from "../extendCtl";
import { retimeCtl } from "../retimeCtl";
import { spliceCtl } from "../spliceCtl";
import { mergeCtl } from "../mergeCtl";
import { applyStyle } from "../applyStyle";

function baseCtl(): ControlTimelineV1 {
  const T = 500; // 10s at 50Hz
  const mk = (v: number) => new Array<number>(T).fill(v);
  return ControlTimelineV1Schema.parse({
    schema_version: "ctl_v1",
    codec_id: "encodec_32k_4cb_50hz_v1",
    frame_rate_hz: 50,
    duration_frames: T,
    global: { bpm: 112, swing: 0.2, genre: "amapiano_private_school", mix_profile: "warm" },
    sections: [
      { start_frame: 0, end_frame: 200, label: "intro" },
      { start_frame: 200, end_frame: 500, label: "verse" },
    ],
    curves: {
      energy: mk(0.5),
      log_drum_density: mk(0.6),
      perc_density: mk(0.4),
      pad_warmth: mk(0.7),
      bass_presence: mk(0.55),
    },
    groove: {
      template_id: "private_school_3step",
      kick_16: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      snare_clap_16: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
      hat_16: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
      logdrum_16: [0,0,1,0, 0,1,0,0, 1,0,0,1, 0,0,1,0],
      microtiming_16: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    },
  }) as ControlTimelineV1;
}

describe("CTL transforms", () => {
  it("extendCtl increases duration and appends a section", () => {
    const ctl = baseCtl();
    const out = extendCtl(ctl, { extraSeconds: 5, label: "outro", ramp: "down" });
    expect(out.duration_frames).toBeGreaterThan(ctl.duration_frames);
    expect(out.sections.at(-1)?.label).toBe("outro");
    expect(out.curves.energy).toHaveLength(out.duration_frames);
  });

  it("retimeCtl changes duration with speed while keeping schema valid", () => {
    const ctl = baseCtl();
    const out = retimeCtl(ctl, { speed: 2.0, mode: "stretch" });
    expect(out.duration_frames).toBeLessThan(ctl.duration_frames);
    expect(out.curves.energy).toHaveLength(out.duration_frames);
    expect(() => ControlTimelineV1Schema.parse(out)).not.toThrow();
  });

  it("spliceCtl replaces a region and preserves duration by default", () => {
    const ctl = baseCtl();
    const out = spliceCtl(ctl, { startFrame: 100, endFrame: 300, replacementLabel: "chorus" });
    expect(out.duration_frames).toBe(ctl.duration_frames);
    expect(out.sections.some(s => s.label === "chorus")).toBe(true);
    expect(out.curves.energy).toHaveLength(out.duration_frames);
  });

  it("mergeCtl merges curves with avg strategy and validates", () => {
    const a = baseCtl();
    const b = applyStyle(baseCtl(), { bpm_delta: 4, curve_deltas: { energy: 0.2 }, genre: "amapiano_sgija" });

    const out = mergeCtl(a, b, { curveStrategy: "avg", bpmPolicy: "avg" });
    expect(out.duration_frames).toBe(Math.max(a.duration_frames, b.duration_frames));
    expect(out.curves.energy).toHaveLength(out.duration_frames);
    expect(out.global.bpm).toBeGreaterThan(0);
  });

  it("applyStyle adjusts global and curves within bounds", () => {
    const ctl = baseCtl();
    const out = applyStyle(ctl, { bpm_delta: 6, swing_delta: 0.1, curve_deltas: { bass_presence: 0.3 } });
    expect(out.global.bpm).toBe(118);
    expect(out.global.swing).toBeGreaterThanOrEqual(0);
    expect(out.global.swing).toBeLessThanOrEqual(1);
    expect(Math.max(...out.curves.bass_presence)).toBeLessThanOrEqual(1);
  });
});
