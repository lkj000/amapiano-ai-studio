/**
 * Dataset Logger — Saves ControlTimeline + generation outputs as training data.
 * Every render becomes a training-ready record: (prompt, ctl, audio, metrics).
 */

import type { ControlTimelineV1 } from './controlTimeline';
import { supabase } from '@/integrations/supabase/client';

/** Cross-environment UUID helper */
function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface DatasetRecord {
  id: string;
  created_at: string;
  model: string;
  ctl: ControlTimelineV1;
  user_prompt: string;
  generation_params: Record<string, unknown>;
  outputs: {
    audio_url?: string;
    tokens_url?: string;
    stems_url?: string;
    beats_json_url?: string;
  };
  metrics?: Record<string, number>;
}

/**
 * Log a dataset record to Supabase for future training/evaluation.
 * Stores in the audio_analysis_results table as a 'ctl_dataset' analysis type.
 */
export async function logDatasetRecord(rec: DatasetRecord): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id ?? 'anonymous';
  const { error } = await supabase.from('audio_analysis_results').insert([{
    user_id: userId,
    audio_url: rec.outputs.audio_url ?? '',
    analysis_type: 'ctl_dataset',
    analysis_data: {
      record_id: rec.id,
      model: rec.model,
      ctl: rec.ctl,
      user_prompt: rec.user_prompt,
      generation_params: rec.generation_params,
      outputs: rec.outputs,
      metrics: rec.metrics,
    } as any,
  }]);

  if (error) {
    console.error('[DatasetLogger] Failed to log record:', error.message);
  }
}

/**
 * Create a minimal dataset record from a generation run.
 */
export function createDatasetRecord(
  ctl: ControlTimelineV1,
  userPrompt: string,
  model: string,
  audioUrl?: string,
  metrics?: Record<string, number>
): DatasetRecord {
  return {
    id: uuid(),
    created_at: new Date().toISOString(),
    model,
    ctl,
    user_prompt: userPrompt,
    generation_params: {
      bpm: ctl.global.bpm,
      genre: ctl.global.genre,
      mix_profile: ctl.global.mix_profile,
      duration_frames: ctl.duration_frames,
    },
    outputs: { audio_url: audioUrl },
    metrics,
  };
}
