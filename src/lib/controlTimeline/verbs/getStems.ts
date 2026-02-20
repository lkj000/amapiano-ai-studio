/**
 * Suno verb: Get Stems
 * Not a CTL transform — creates a consistent stem separation job spec.
 */
import { createStemsJob, type AudioJobSpec } from "../../audioJobs/jobSpec";

export interface GetStemsOpts {
  /** Source audio URL */
  audioUrl: string;
  /** Expected output stem URLs (optional pre-allocation) */
  stemUrls?: Record<string, string>;
}

export function getStems(opts: GetStemsOpts): AudioJobSpec {
  return createStemsJob(opts.audioUrl, { stem_urls: opts.stemUrls });
}
