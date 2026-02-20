/**
 * Suno-parity verb API
 * Thin wrappers over CTL transforms with clear UX semantics.
 */

export { extend, type ExtendOpts } from "./extend";
export { adjustSpeed, type AdjustSpeedOpts, type SpeedMode } from "./adjustSpeed";
export { mashup, medley, type MashupOpts } from "./mashup";
export { prepareCover, type CoverOpts, type CoverResult } from "./cover";
export { useStylesAndLyrics, type UseStylesOpts } from "./useStylesAndLyrics";
export { sampleThisSong, type SampleOpts } from "./sampleThisSong";
export { getStems, type GetStemsOpts } from "./getStems";
