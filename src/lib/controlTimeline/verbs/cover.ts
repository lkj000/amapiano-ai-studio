/**
 * Suno verb: Cover
 * CTL-only stub: applies style + vocal presence curve, produces a job spec.
 * Actual audio generation is deferred to the backend.
 */
import type { ControlTimelineV1 } from "../controlTimeline";
import { applyStyle } from "../transforms";
import type { StyleDelta } from "../transforms";
import { createCoverJob, type AudioJobSpec } from "../../audioJobs/jobSpec";

export interface CoverOpts {
  /** Source audio URL */
  sourceAudioUrl: string;
  /** Style changes to apply */
  style?: StyleDelta;
  /** Vocal presence level (0-1) to set across the timeline */
  vocalPresence?: number;
  /** Model to use for generation */
  modelId?: string;
}

export interface CoverResult {
  /** The modified CTL with style applied */
  ctl: ControlTimelineV1;
  /** Job spec ready for backend submission */
  jobSpec: AudioJobSpec;
}

export function prepareCover(ctl: ControlTimelineV1, opts: CoverOpts): CoverResult {
  // Apply style delta
  let modified = opts.style ? applyStyle(ctl, opts.style) : { ...ctl };

  // Set vocal presence if specified
  if (typeof opts.vocalPresence === "number") {
    const T = modified.duration_frames;
    const vp = Math.max(0, Math.min(1, opts.vocalPresence));
    modified = {
      ...modified,
      curves: {
        ...modified.curves,
        vocal_presence: new Array<number>(T).fill(vp),
      },
    };
  }

  const jobSpec = createCoverJob(opts.sourceAudioUrl, modified, {
    model_id: opts.modelId,
    style_delta: opts.style as Record<string, unknown>,
  });

  return { ctl: modified, jobSpec };
}
