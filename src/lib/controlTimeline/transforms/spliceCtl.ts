import type { ControlTimelineSection, ControlTimelineV1, SectionLabel } from "../controlTimeline";
import { validateCtl, sliceCurve, makeFillSection } from "./_helpers";

/**
 * Replace a region [startFrame, endFrame) with new content.
 * Preserves total duration by default (keepDuration=true).
 *
 * - If replacementCtl is provided, its curves/sections are spliced in.
 * - Otherwise generates a neutral/edge-matched replacement region.
 */
export function spliceCtl(
  ctl: ControlTimelineV1,
  opts: {
    startFrame: number;
    endFrame: number;
    replacementCtl?: ControlTimelineV1;
    replacementLabel?: SectionLabel;
    keepDuration?: boolean;
    curvePolicy?: "neutral" | "match_edges";
  }
): ControlTimelineV1 {
  const T = ctl.duration_frames;

  const start = Math.max(0, Math.min(T, Math.round(opts.startFrame)));
  const end = Math.max(start, Math.min(T, Math.round(opts.endFrame)));
  const keepDuration = opts.keepDuration ?? true;
  const curvePolicy = opts.curvePolicy ?? "match_edges";

  const leftLen = start;
  const midLen = end - start;
  const rightLen = T - end;

  let replLen = midLen;
  if (opts.replacementCtl) replLen = opts.replacementCtl.duration_frames;
  if (keepDuration || !opts.replacementCtl) {
    replLen = midLen;
  }

  const newT = keepDuration ? T : (leftLen + replLen + rightLen);

  // --- Curves ---
  const curves: any = {};
  for (const [k, curve] of Object.entries(ctl.curves)) {
    if (!Array.isArray(curve)) continue;

    const fallback = k === "vocal_presence" ? 0 : 0.5;
    const left = sliceCurve(curve as number[], 0, start, fallback);
    const right = sliceCurve(curve as number[], end, T, fallback);

    let mid: number[] = [];

    if (opts.replacementCtl) {
      const replCurve = (opts.replacementCtl.curves as any)[k] as number[] | undefined;
      if (replCurve && replCurve.length) {
        if (keepDuration) {
          mid = replCurve.slice(0, Math.min(replCurve.length, midLen));
          if (mid.length < midLen) {
            mid = mid.concat(new Array(midLen - mid.length).fill(mid[mid.length - 1] ?? fallback));
          }
        } else {
          mid = replCurve.slice();
        }
      }
    }

    if (!mid.length) {
      const L = keepDuration ? midLen : replLen;
      if (curvePolicy === "neutral") {
        mid = new Array(L).fill(fallback);
      } else {
        const leftEdge = left[left.length - 1] ?? fallback;
        const rightEdge = right[0] ?? leftEdge;
        mid = new Array(L);
        for (let i = 0; i < L; i++) {
          const t = L <= 1 ? 0 : i / (L - 1);
          mid[i] = leftEdge * (1 - t) + rightEdge * t;
        }
      }
    }

    curves[k] = left.concat(mid, right);
  }

  // --- Sections ---
  const leftSections: ControlTimelineSection[] = ctl.sections
    .filter(s => s.end_frame <= start)
    .map(s => ({ ...s }));

  const rightSections: ControlTimelineSection[] = ctl.sections
    .filter(s => s.start_frame >= end)
    .map(s => ({
      ...s,
      start_frame: s.start_frame - (end - start) + replLen,
      end_frame: s.end_frame - (end - start) + replLen,
    }));

  const replacementSections: ControlTimelineSection[] = (() => {
    if (opts.replacementCtl) {
      const replSecs = opts.replacementCtl.sections.map(s => ({ ...s }));
      const shift = start - (replSecs[0]?.start_frame ?? start);
      return replSecs.map(s => ({
        ...s,
        start_frame: s.start_frame + shift,
        end_frame: s.end_frame + shift,
      }));
    }
    const label = opts.replacementLabel ?? "verse";
    return [makeFillSection(start, start + replLen, label)];
  })();

  const sections = [...leftSections, ...replacementSections, ...rightSections]
    .map(s => ({
      ...s,
      start_frame: Math.max(0, Math.min(newT, s.start_frame)),
      end_frame: Math.max(0, Math.min(newT, s.end_frame)),
    }))
    .filter(s => s.end_frame > s.start_frame);

  const out: ControlTimelineV1 = {
    ...ctl,
    duration_frames: newT,
    sections,
    curves,
  };

  return validateCtl(out);
}
