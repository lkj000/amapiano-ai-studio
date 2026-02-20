/**
 * Audio Job Specifications
 * Structured job descriptors for backend audio operations.
 * These are CTL-adjacent but model-agnostic — any backend can consume them.
 */

import type { ControlTimelineV1 } from "../controlTimeline/controlTimeline";
import { stableHash, stableHashSync } from "../controlTimeline/stableHash";

// ============ Job Kinds ============

export type JobKind =
  | "render"          // CTL → audio generation
  | "stems"           // Audio → stem separation
  | "cover"           // Source audio + style CTL → cover
  | "mashup"          // Two CTLs + source audios → mashup
  | "sample"          // Region extraction from audio
  | "render_video"    // Audio + visuals → video
  | "retime"          // Audio time-stretch/pitch-shift
  | "extend";         // Audio continuation

export type JobStatus = "pending" | "queued" | "running" | "completed" | "failed" | "cancelled";

// ============ Job Spec ============

export interface AudioJobSpec {
  /** Unique job identifier */
  id: string;
  /** Job kind */
  kind: JobKind;
  /** Idempotency key — hash of (kind + inputs + params) */
  idempotency_key: string;
  /** Creation timestamp */
  created_at: string;

  /** Input references */
  inputs: {
    /** Source audio URLs */
    audio_urls?: string[];
    /** Source stem URLs (pre-separated) */
    stem_urls?: string[];
    /** The control timeline driving generation */
    ctl?: ControlTimelineV1;
    /** Hash of the CTL for dedup */
    ctl_hash?: string;
  };

  /** Job-specific parameters */
  params: {
    /** Model identifier (e.g., "musicgen_large", "encodec_32k") */
    model_id?: string;
    /** Generation mode */
    mode?: string;
    /** Region of interest (frames) */
    region_start_frame?: number;
    region_end_frame?: number;
    /** Speed factor for retime jobs */
    speed?: number;
    /** Extension duration in seconds */
    extend_seconds?: number;
    /** Style delta for cover/style jobs */
    style_delta?: Record<string, unknown>;
    /** Additional model-specific params */
    extra?: Record<string, unknown>;
  };

  /** Expected outputs */
  outputs: {
    /** Where the result audio will be stored */
    audio_url?: string;
    /** Where separated stems will be stored */
    stem_urls?: Record<string, string>;
    /** Where video will be stored */
    video_url?: string;
  };

  /** Current status */
  status: JobStatus;
  /** Error message if failed */
  error?: string;
  /** Processing duration in ms */
  duration_ms?: number;
}

// ============ Builders ============

/** Generate a unique job ID */
function jobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Create a render job spec */
export function createRenderJob(
  ctl: ControlTimelineV1,
  opts?: { model_id?: string; audio_url?: string }
): AudioJobSpec {
  const key = stableHashSync({ kind: "render", ctl, model_id: opts?.model_id });
  return {
    id: jobId(),
    kind: "render",
    idempotency_key: key,
    created_at: new Date().toISOString(),
    inputs: { ctl, ctl_hash: stableHashSync(ctl) },
    params: { model_id: opts?.model_id ?? "musicgen_large" },
    outputs: { audio_url: opts?.audio_url },
    status: "pending",
  };
}

/** Create a stems job spec */
export function createStemsJob(
  audioUrl: string,
  opts?: { stem_urls?: Record<string, string> }
): AudioJobSpec {
  const key = stableHashSync({ kind: "stems", audioUrl });
  return {
    id: jobId(),
    kind: "stems",
    idempotency_key: key,
    created_at: new Date().toISOString(),
    inputs: { audio_urls: [audioUrl] },
    params: {},
    outputs: { stem_urls: opts?.stem_urls },
    status: "pending",
  };
}

/** Create a cover job spec */
export function createCoverJob(
  sourceAudioUrl: string,
  ctl: ControlTimelineV1,
  opts?: { model_id?: string; style_delta?: Record<string, unknown> }
): AudioJobSpec {
  const key = stableHashSync({ kind: "cover", sourceAudioUrl, ctl, style: opts?.style_delta });
  return {
    id: jobId(),
    kind: "cover",
    idempotency_key: key,
    created_at: new Date().toISOString(),
    inputs: { audio_urls: [sourceAudioUrl], ctl, ctl_hash: stableHashSync(ctl) },
    params: { model_id: opts?.model_id, style_delta: opts?.style_delta },
    outputs: {},
    status: "pending",
  };
}

/** Create a mashup job spec */
export function createMashupJob(
  audioUrlA: string,
  audioUrlB: string,
  mergedCtl: ControlTimelineV1,
  opts?: { model_id?: string }
): AudioJobSpec {
  const key = stableHashSync({ kind: "mashup", audioUrlA, audioUrlB, ctl: mergedCtl });
  return {
    id: jobId(),
    kind: "mashup",
    idempotency_key: key,
    created_at: new Date().toISOString(),
    inputs: { audio_urls: [audioUrlA, audioUrlB], ctl: mergedCtl, ctl_hash: stableHashSync(mergedCtl) },
    params: { model_id: opts?.model_id },
    outputs: {},
    status: "pending",
  };
}

/** Create a sample extraction job spec */
export function createSampleJob(
  audioUrl: string,
  startFrame: number,
  endFrame: number
): AudioJobSpec {
  const key = stableHashSync({ kind: "sample", audioUrl, startFrame, endFrame });
  return {
    id: jobId(),
    kind: "sample",
    idempotency_key: key,
    created_at: new Date().toISOString(),
    inputs: { audio_urls: [audioUrl] },
    params: { region_start_frame: startFrame, region_end_frame: endFrame },
    outputs: {},
    status: "pending",
  };
}
