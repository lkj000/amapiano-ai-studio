/**
 * Tone.js Utility Functions
 * 
 * Provides safe access to Tone.js objects to avoid AudioContext autoplay warnings.
 * The issue: accessing Tone.context or Tone.Transport triggers AudioContext creation,
 * which causes browser warnings if done before user interaction.
 */

import * as Tone from 'tone';

// Track whether Tone has been initialized by user gesture
let toneInitialized = false;

/**
 * Check if Tone.js audio context has been started by user gesture
 */
export const isToneStarted = (): boolean => {
  return toneInitialized;
};

/**
 * Mark Tone.js as initialized (call after Tone.start())
 */
export const markToneStarted = (): void => {
  toneInitialized = true;
};

/**
 * Safely start Tone.js - only call after user gesture
 */
export const safeToneStart = async (): Promise<boolean> => {
  try {
    await Tone.start();
    toneInitialized = true;
    console.log('[ToneUtils] Audio context started');
    return true;
  } catch (error) {
    console.error('[ToneUtils] Failed to start audio context:', error);
    return false;
  }
};

/**
 * Safely get audio context state without triggering creation
 * Returns 'suspended' if not yet started
 */
export const getToneState = (): AudioContextState => {
  if (!toneInitialized) {
    return 'suspended';
  }
  return Tone.context.state;
};

/**
 * Check if Tone is ready for audio operations
 */
export const isToneReady = (): boolean => {
  return toneInitialized && Tone.context.state === 'running';
};
