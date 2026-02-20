import { describe, it, expect } from "vitest";
import type { ControlTimelineV1 } from "../../controlTimeline";
import { ControlTimelineV1Schema } from "../../controlTimeline.zod";
import { extend, adjustSpeed, mashup, medley, useStylesAndLyrics, sampleThisSong, getStems, prepareCover } from "../index";

function baseCtl(): ControlTimelineV1 {
  const T = 500;
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
      kick_16: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare_clap_16: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      hat_16: [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      logdrum_16: [0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0],
      microtiming_16: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    },
  }) as ControlTimelineV1;
}

describe("Suno verbs", () => {
  it("extend adds duration with correct label", () => {
    const ctl = baseCtl();
    const out = extend(ctl, { seconds: 5, label: "outro", ramp: "down" });
    expect(out.duration_frames).toBeGreaterThan(ctl.duration_frames);
    expect(out.sections.at(-1)?.label).toBe("outro");
    expect(() => ControlTimelineV1Schema.parse(out)).not.toThrow();
  });

  it("adjustSpeed in dj mode changes BPM", () => {
    const ctl = baseCtl();
    const out = adjustSpeed(ctl, { speed: 1.5, mode: "dj" });
    expect(out.global.bpm).toBeCloseTo(112 * 1.5, 0);
  });

  it("adjustSpeed in arrangement mode changes duration", () => {
    const ctl = baseCtl();
    const out = adjustSpeed(ctl, { speed: 2.0, mode: "arrangement" });
    expect(out.duration_frames).toBeLessThan(ctl.duration_frames);
    expect(out.global.bpm).toBe(112); // BPM unchanged
  });

  it("mashup blends two CTLs with overlay", () => {
    const a = baseCtl();
    const b = baseCtl();
    const out = mashup(a, b, { curveStrategy: "avg" });
    expect(out.duration_frames).toBe(Math.max(a.duration_frames, b.duration_frames));
    expect(() => ControlTimelineV1Schema.parse(out)).not.toThrow();
  });

  it("medley appends B after A", () => {
    const a = baseCtl();
    const b = baseCtl();
    const out = medley(a, b);
    expect(out.duration_frames).toBe(a.duration_frames + b.duration_frames);
    expect(out.curves.energy).toHaveLength(out.duration_frames);
    expect(() => ControlTimelineV1Schema.parse(out)).not.toThrow();
  });

  it("useStylesAndLyrics applies vocal schedule", () => {
    const ctl = baseCtl();
    const out = useStylesAndLyrics(ctl, {
      style: { bpm_delta: 4 },
      vocalSchedule: [
        { startSec: 0, endSec: 3, presence: 0.8 },
        { startSec: 6, endSec: 8, presence: 1.0 },
      ],
    });
    expect(out.global.bpm).toBe(116);
    expect(out.curves.vocal_presence).toBeDefined();
    expect(out.curves.vocal_presence![0]).toBe(0.8);
    expect(out.curves.vocal_presence![400]).toBe(0); // between schedules
  });

  it("sampleThisSong returns valid job spec", () => {
    const ctl = baseCtl();
    const job = sampleThisSong(ctl, { audioUrl: "https://example.com/song.mp3", startSec: 2, endSec: 6 });
    expect(job.kind).toBe("sample");
    expect(job.params.region_start_frame).toBe(100);
    expect(job.params.region_end_frame).toBe(300);
    expect(job.idempotency_key).toBeTruthy();
  });

  it("getStems returns valid job spec", () => {
    const job = getStems({ audioUrl: "https://example.com/song.mp3" });
    expect(job.kind).toBe("stems");
    expect(job.inputs.audio_urls).toEqual(["https://example.com/song.mp3"]);
  });

  it("prepareCover returns modified CTL and job spec", () => {
    const ctl = baseCtl();
    const result = prepareCover(ctl, {
      sourceAudioUrl: "https://example.com/song.mp3",
      style: { genre: "amapiano_sgija" },
      vocalPresence: 0.7,
    });
    expect(result.ctl.global.genre).toBe("amapiano_sgija");
    expect(result.ctl.curves.vocal_presence?.every(v => v === 0.7)).toBe(true);
    expect(result.jobSpec.kind).toBe("cover");
  });
});
