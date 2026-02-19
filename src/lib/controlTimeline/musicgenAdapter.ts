/**
 * MusicGen Adapter — Converts ControlTimelineV1 into a structured prompt
 * for the Modal-hosted MusicGen inference endpoint.
 */

import type { ControlTimelineV1 } from './controlTimeline';
import { framesToSeconds } from './controlTimeline';

export interface MusicGenRequest {
  prompt: string;
  duration_seconds: number;
  seed?: number;
  extra?: Record<string, unknown>;
}

function summarizePattern(name: string, p: readonly (0 | 1)[]): string {
  return `${name}=[${p.join('')}]`;
}

function curveAvg(curve: number[]): number {
  if (curve.length === 0) return 0;
  return curve.reduce((a, b) => a + b, 0) / curve.length;
}

/** Downsample a curve to a target length via linear interpolation */
function downsampleCurve(curve: number[], targetLen: number): number[] {
  if (targetLen <= 0) return [];
  if (curve.length === 0) return Array(targetLen).fill(0);
  const out: number[] = [];
  for (let i = 0; i < targetLen; i++) {
    const t = targetLen === 1 ? 0 : i / (targetLen - 1);
    const idx = t * (curve.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(curve.length - 1, lo + 1);
    const w = idx - lo;
    out.push(+(curve[lo] * (1 - w) + curve[hi] * w).toFixed(3));
  }
  return out;
}

/**
 * Build a MusicGen-compatible request from a ControlTimeline + user text.
 * The prompt encodes groove, arrangement, and cultural parameters as
 * structured text that conditions generation.
 */
export function buildMusicGenRequest(
  ctl: ControlTimelineV1,
  userText: string
): MusicGenRequest {
  const { bpm, genre, mix_profile, swing, key } = ctl.global;
  const durSec = framesToSeconds(ctl.duration_frames);

  // Sections as human-readable time ranges
  const sections = ctl.sections
    .map(s => `${s.label}:${framesToSeconds(s.start_frame).toFixed(1)}s-${framesToSeconds(s.end_frame).toFixed(1)}s`)
    .join(', ');

  // Groove template in prompt (high leverage for Amapiano)
  const g = ctl.groove;
  const grooveLine = [
    `groove_template=${g.template_id}`,
    summarizePattern('kick16', g.kick_16),
    summarizePattern('log16', g.logdrum_16),
    `swing=${swing.toFixed(2)}`,
  ].join(' | ');

  // Curve summaries (avoid dumping thousands of floats)
  const energyAvg = curveAvg(ctl.curves.energy);
  const logAvg = curveAvg(ctl.curves.log_drum_density);
  const bassAvg = curveAvg(ctl.curves.bass_presence);

  const keyStr = key ? ` Key: ${key}.` : '';

  const prompt = [
    userText,
    `Genre: ${genre}. Tempo: ${bpm} BPM.${keyStr} Mix: ${mix_profile}. Swing: ${swing.toFixed(2)}.`,
    `Arrangement sections: ${sections}.`,
    `Amapiano groove control: ${grooveLine}.`,
    `Energy avg=${energyAvg.toFixed(2)}, logdrum density avg=${logAvg.toFixed(2)}, bass avg=${bassAvg.toFixed(2)}.`,
    'Production: beat-grid tight, DJ-friendly intro/outro, clean low end.',
  ].join('\n');

  return {
    prompt,
    duration_seconds: durSec,
    seed: ctl.seed,
    extra: {
      ctl_schema: ctl.schema_version,
      codec_id: ctl.codec_id,
      curves_1hz: {
        energy: downsampleCurve(ctl.curves.energy, Math.ceil(durSec)),
        log_drum_density: downsampleCurve(ctl.curves.log_drum_density, Math.ceil(durSec)),
        bass_presence: downsampleCurve(ctl.curves.bass_presence, Math.ceil(durSec)),
        pad_warmth: downsampleCurve(ctl.curves.pad_warmth, Math.ceil(durSec)),
        perc_density: downsampleCurve(ctl.curves.perc_density, Math.ceil(durSec)),
      },
    },
  };
}
