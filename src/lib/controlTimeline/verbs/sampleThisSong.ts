/**
 * Suno verb: Sample This Song
 * Creates a region extraction plan (start/end frames) as a job spec.
 */
import type { ControlTimelineV1 } from "../controlTimeline";
import { createSampleJob, type AudioJobSpec } from "../../audioJobs/jobSpec";

export interface SampleOpts {
  /** Source audio URL */
  audioUrl: string;
  /** Start time in seconds */
  startSec: number;
  /** End time in seconds */
  endSec: number;
}

export function sampleThisSong(ctl: ControlTimelineV1, opts: SampleOpts): AudioJobSpec {
  const FR = ctl.frame_rate_hz;
  const startFrame = Math.max(0, Math.round(opts.startSec * FR));
  const endFrame = Math.max(startFrame, Math.min(ctl.duration_frames, Math.round(opts.endSec * FR)));

  return createSampleJob(opts.audioUrl, startFrame, endFrame);
}
