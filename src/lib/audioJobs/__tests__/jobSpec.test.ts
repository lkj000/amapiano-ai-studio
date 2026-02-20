import { describe, it, expect } from "vitest";
import { stableStringify, stableHashSync } from "../../controlTimeline/stableHash";
import { createRenderJob, createStemsJob, createSampleJob } from "../jobSpec";
import type { ControlTimelineV1 } from "../../controlTimeline/controlTimeline";
import { ControlTimelineV1Schema } from "../../controlTimeline/controlTimeline.zod";

function baseCtl(): ControlTimelineV1 {
  const T = 500;
  const mk = (v: number) => new Array<number>(T).fill(v);
  return ControlTimelineV1Schema.parse({
    schema_version: "ctl_v1",
    codec_id: "encodec_32k_4cb_50hz_v1",
    frame_rate_hz: 50,
    duration_frames: T,
    global: { bpm: 112, swing: 0.2, genre: "amapiano_private_school", mix_profile: "warm" },
    sections: [{ start_frame: 0, end_frame: 500, label: "verse" }],
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

describe("stableHash", () => {
  it("stableStringify is deterministic regardless of key order", () => {
    const a = stableStringify({ b: 2, a: 1 });
    const b = stableStringify({ a: 1, b: 2 });
    expect(a).toBe(b);
  });

  it("stableHashSync produces consistent hashes", () => {
    const obj = { kind: "render", model: "musicgen" };
    const h1 = stableHashSync(obj);
    const h2 = stableHashSync(obj);
    expect(h1).toBe(h2);
    expect(h1.length).toBeGreaterThan(4);
  });
});

describe("AudioJobSpec builders", () => {
  it("createRenderJob produces valid spec with idempotency key", () => {
    const ctl = baseCtl();
    const job = createRenderJob(ctl);
    expect(job.kind).toBe("render");
    expect(job.status).toBe("pending");
    expect(job.idempotency_key).toBeTruthy();
    expect(job.inputs.ctl_hash).toBeTruthy();
  });

  it("createStemsJob has correct inputs", () => {
    const job = createStemsJob("https://example.com/song.mp3");
    expect(job.kind).toBe("stems");
    expect(job.inputs.audio_urls).toEqual(["https://example.com/song.mp3"]);
  });

  it("createSampleJob encodes region frames", () => {
    const job = createSampleJob("https://example.com/song.mp3", 100, 300);
    expect(job.params.region_start_frame).toBe(100);
    expect(job.params.region_end_frame).toBe(300);
  });

  it("same inputs produce same idempotency key", () => {
    const j1 = createStemsJob("https://example.com/song.mp3");
    const j2 = createStemsJob("https://example.com/song.mp3");
    expect(j1.idempotency_key).toBe(j2.idempotency_key);
  });
});
