/**
 * ControlTimeline — Shared Utilities
 * Single source of truth for curve sanitization, clamping, and constants.
 */

/** Frame rate constant — 50 Hz */
export const FR = 50;

/** Clamp a number to [0, 1] */
export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Return x if finite, otherwise fallback */
export function finiteOr(x: number, fallback: number): number {
  return Number.isFinite(x) ? x : fallback;
}

/** Replace NaN/Infinity with fallback, clamp to [0,1]. In-place for perf. */
export function sanitizeCurve(curve: number[], fallback = 0.5): number[] {
  for (let i = 0; i < curve.length; i++) {
    curve[i] = clamp01(finiteOr(curve[i], fallback));
  }
  return curve;
}

/** Safe average for tests/metrics */
export function curveAvg(curve: number[], fallback = 0): number {
  if (!curve.length) return fallback;
  let sum = 0;
  for (const v of curve) sum += finiteOr(v, fallback);
  return sum / curve.length;
}
