/**
 * DJ Stem Separator — wraps the stem-splitter edge function
 * for batch processing DJ library tracks.
 * Returns stem URLs keyed by stem type.
 */

import { DJTrack, DJTrackStems } from './DJAgentTypes';
import { toast } from 'sonner';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 120; // 4 minutes max per track

interface StemSplitterStartResponse {
  predictionId?: string;
  error?: string;
}

interface StemSplitterPollResponse {
  status: 'processing' | 'succeeded' | 'failed';
  stems?: Record<string, string> | { id: string; audioUrl: string }[];
  error?: string;
}

/**
 * Separate a single track into stems via the stem-splitter edge function.
 * Returns a DJTrackStems object with URLs for each stem.
 */
async function separateSingleTrack(track: DJTrack): Promise<DJTrackStems> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Fetch the audio file and create a File object for upload
  const resp = await fetch(track.fileUrl);
  const blob = await resp.blob();
  const file = new File([blob], `${track.title}.${track.fileFormat}`, { type: blob.type });

  const formData = new FormData();
  formData.append('audio', file);

  // Start separation job
  const startResp = await fetch(`${supabaseUrl}/functions/v1/stem-splitter`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${supabaseKey}` },
    body: formData,
  });

  if (!startResp.ok) {
    const err = await startResp.json().catch(() => ({}));
    throw new Error(err.error || `Failed to start separation for "${track.title}"`);
  }

  const startData: StemSplitterStartResponse = await startResp.json();
  if (!startData.predictionId) {
    throw new Error(startData.error || `No prediction ID for "${track.title}"`);
  }

  // Poll for completion
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    const pollResp = await fetch(`${supabaseUrl}/functions/v1/stem-splitter`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ predictionId: startData.predictionId }),
    });

    if (!pollResp.ok) continue;

    const pollData: StemSplitterPollResponse = await pollResp.json();

    if (pollData.status === 'failed') {
      throw new Error(pollData.error || `Stem separation failed for "${track.title}"`);
    }

    if (pollData.status === 'succeeded' && pollData.stems) {
      // Normalize response format
      const stems: DJTrackStems = {};

      if (Array.isArray(pollData.stems)) {
        for (const s of pollData.stems) {
          const key = s.id.toLowerCase() as keyof DJTrackStems;
          if (['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'].includes(key)) {
            stems[key] = s.audioUrl;
          }
        }
      } else {
        for (const [key, url] of Object.entries(pollData.stems)) {
          const normalized = key.toLowerCase() as keyof DJTrackStems;
          if (['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'].includes(normalized)) {
            stems[normalized] = url;
          }
        }
      }

      console.log(`[DJ Stems] ✅ Separated "${track.title}":`, Object.keys(stems));
      return stems;
    }
  }

  throw new Error(`Stem separation timed out for "${track.title}"`);
}

/**
 * Batch-separate all tracks in the DJ library.
 * Processes sequentially to avoid overwhelming the API.
 * Returns tracks with stems attached.
 */
export async function separateDJTracks(
  tracks: DJTrack[],
  onProgress?: (completed: number, total: number, currentTitle: string) => void
): Promise<DJTrack[]> {
  const results: DJTrack[] = [];

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    onProgress?.(i, tracks.length, track.title);

    try {
      console.log(`[DJ Stems] 🎵 Separating ${i + 1}/${tracks.length}: "${track.title}"`);
      const stems = await separateSingleTrack(track);
      results.push({ ...track, stems });
    } catch (err) {
      console.error(`[DJ Stems] ❌ Failed "${track.title}":`, err);
      toast.error(`Stem separation failed for "${track.title}" — using full mix`);
      results.push(track); // Keep track without stems
    }
  }

  const stemmedCount = results.filter(t => t.stems).length;
  console.log(`[DJ Stems] 📊 Completed: ${stemmedCount}/${tracks.length} tracks separated`);

  return results;
}
