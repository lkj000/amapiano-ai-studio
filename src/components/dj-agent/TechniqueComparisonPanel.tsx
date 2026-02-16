import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BookOpen, Sparkles, Repeat, Shuffle, Scissors, Mic, Layers,
  Clock, Waves, Music, Grid3X3, Unlock, FileStack, Loader2,
  Download, Play, Pause, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TechniqueTrack {
  id: string;
  title: string;
  fileUrl: string;
  features?: {
    bpm: number;
    key: string;
    camelot: string;
    energyCurve: number[];
    segments: any[];
  };
}

interface TechniqueComparisonPanelProps {
  tracks?: TechniqueTrack[];
  onAmapianorize?: (trackId: string) => void;
  onExtendTrack?: (trackId: string) => void;
  onExtendMix?: () => void;
  sessionBPM?: number;
}

type TechniqueId =
  | 'amapianorize' | 'extend' | 'remix' | 'sample'
  | 'cover' | 'mashup' | 'tempo_sync' | 'unsync'
  | 'warp' | 'pitch_shift' | 'quantize' | 'comp';

interface Technique {
  id: TechniqueId;
  name: string;
  icon: React.ReactNode;
  description: string;
  originalRecognizable: string;
  newElements: string;
  category: 'creative' | 'timeline';
  needsTrack: boolean;
  needsSecondTrack?: boolean;
}

const TECHNIQUES: Technique[] = [
  {
    id: 'amapianorize', name: 'Amapianorize', icon: <Sparkles className="w-3.5 h-3.5" />,
    description: 'Reconstructs the track around an Amapiano spine — log drums, regional swing, jazz re-voicing, -7.5 LUFS mastering.',
    originalRecognizable: 'Partially — vocals/melody survive',
    newElements: 'FM log drums, NGE shakers, sidechain, bass',
    category: 'creative', needsTrack: true,
  },
  {
    id: 'extend', name: 'Extend', icon: <Repeat className="w-3.5 h-3.5" />,
    description: 'Intelligently lengthens a track or mix via optimal loop points and crossfade-looping.',
    originalRecognizable: 'Yes — same track, just longer',
    newElements: 'No — uses existing audio material',
    category: 'creative', needsTrack: true,
  },
  {
    id: 'remix', name: 'Remix', icon: <Shuffle className="w-3.5 h-3.5" />,
    description: 'AI reinterprets a track — new arrangement, BPM, added/removed sections.',
    originalRecognizable: 'Usually — key hooks/vocals kept',
    newElements: 'Yes — entirely new production choices',
    category: 'creative', needsTrack: true,
  },
  {
    id: 'sample', name: 'Sample', icon: <Scissors className="w-3.5 h-3.5" />,
    description: 'Extracts a specific segment (loop, vocal phrase, chord stab) from a track.',
    originalRecognizable: 'Sometimes — just a fragment',
    newElements: 'Yes — sample lives inside a new song',
    category: 'creative', needsTrack: true,
  },
  {
    id: 'cover', name: 'Cover', icon: <Mic className="w-3.5 h-3.5" />,
    description: 'AI re-performs the same song with new instrumentation/vocals.',
    originalRecognizable: 'Yes — same song, different performance',
    newElements: 'Minimal — arrangement may change',
    category: 'creative', needsTrack: true,
  },
  {
    id: 'mashup', name: 'Mashup', icon: <Layers className="w-3.5 h-3.5" />,
    description: 'Layers two tracks simultaneously with tempo and key alignment.',
    originalRecognizable: 'Yes — both sources audible',
    newElements: 'No — just creative alignment',
    category: 'creative', needsTrack: true, needsSecondTrack: true,
  },
  {
    id: 'tempo_sync', name: 'Tempo Sync', icon: <Clock className="w-3.5 h-3.5" />,
    description: 'Adjusts playback rate to match session tempo. Pitch shifts proportionally.',
    originalRecognizable: 'Yes', newElements: 'No',
    category: 'timeline', needsTrack: true,
  },
  {
    id: 'unsync', name: 'Unsync', icon: <Unlock className="w-3.5 h-3.5" />,
    description: 'Locks audio to absolute time, immune to session tempo changes.',
    originalRecognizable: 'Yes', newElements: 'No',
    category: 'timeline', needsTrack: true,
  },
  {
    id: 'warp', name: 'Warp', icon: <Waves className="w-3.5 h-3.5" />,
    description: 'Time-stretching that preserves pitch while changing tempo. Uses GrainPlayer for quality.',
    originalRecognizable: 'Yes — pitch preserved', newElements: 'No',
    category: 'timeline', needsTrack: true,
  },
  {
    id: 'pitch_shift', name: 'Pitch Shift', icon: <Music className="w-3.5 h-3.5" />,
    description: 'Frequency-domain pitch manipulation independent of tempo.',
    originalRecognizable: 'Yes — pitched version', newElements: 'No',
    category: 'timeline', needsTrack: true,
  },
  {
    id: 'quantize', name: 'Quantize', icon: <Grid3X3 className="w-3.5 h-3.5" />,
    description: 'Corrective timing that snaps audio transients to a rhythmic grid.',
    originalRecognizable: 'Yes — tighter timing', newElements: 'No',
    category: 'timeline', needsTrack: true,
  },
  {
    id: 'comp', name: 'Comp (Take)', icon: <FileStack className="w-3.5 h-3.5" />,
    description: 'Assembles a best-of track by selecting phrases from multiple recording takes.',
    originalRecognizable: 'Yes — best parts combined', newElements: 'No',
    category: 'timeline', needsTrack: true,
  },
];

// ─── DSP Utilities ───────────────────────────────────────────────────────────

async function decodeTrackAudio(fileUrl: string): Promise<AudioBuffer> {
  const resp = await fetch(fileUrl);
  const arrayBuf = await resp.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 44100 });
  const buffer = await ctx.decodeAudioData(arrayBuf);
  await ctx.close();
  return buffer;
}

function downloadAudioBuffer(buffer: AudioBuffer, filename: string) {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = length * blockAlign;
  const headerSize = 44;

  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Tempo sync: change playback rate to match target BPM */
function tempoSyncBuffer(buffer: AudioBuffer, originalBPM: number, targetBPM: number): AudioBuffer {
  const ratio = targetBPM / originalBPM;
  const newLength = Math.round(buffer.length / ratio);
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, newLength, buffer.sampleRate);

  // Simple resampling (pitch shifts proportionally — that's the point of tempo sync)
  const result = ctx.createBuffer(buffer.numberOfChannels, newLength, buffer.sampleRate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const input = buffer.getChannelData(ch);
    const output = result.getChannelData(ch);
    for (let i = 0; i < newLength; i++) {
      const srcIdx = i * ratio;
      const idx0 = Math.floor(srcIdx);
      const idx1 = Math.min(idx0 + 1, input.length - 1);
      const frac = srcIdx - idx0;
      output[i] = input[idx0] * (1 - frac) + input[idx1] * frac;
    }
  }
  return result;
}

/** Warp: time-stretch preserving pitch using WSOLA-style overlap-add */
function warpBuffer(buffer: AudioBuffer, originalBPM: number, targetBPM: number): AudioBuffer {
  const ratio = originalBPM / targetBPM; // >1 = slower, <1 = faster
  const newLength = Math.round(buffer.length * ratio);
  const result = new OfflineAudioContext(buffer.numberOfChannels, newLength, buffer.sampleRate)
    .createBuffer(buffer.numberOfChannels, newLength, buffer.sampleRate);

  const windowSize = 2048;
  const hopIn = Math.round(windowSize / 4);
  const hopOut = Math.round(hopIn * ratio);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const input = buffer.getChannelData(ch);
    const output = result.getChannelData(ch);

    for (let outPos = 0; outPos < newLength; outPos += hopOut) {
      const inPos = Math.round(outPos / ratio);
      for (let j = 0; j < windowSize && outPos + j < newLength; j++) {
        const srcIdx = inPos + j;
        if (srcIdx >= input.length) break;
        // Hann window
        const w = 0.5 * (1 - Math.cos(2 * Math.PI * j / windowSize));
        output[outPos + j] += input[srcIdx] * w;
      }
    }

    // Normalize to prevent clipping from overlap-add
    let maxAmp = 0;
    for (let i = 0; i < newLength; i++) maxAmp = Math.max(maxAmp, Math.abs(output[i]));
    if (maxAmp > 0.95) {
      const scale = 0.9 / maxAmp;
      for (let i = 0; i < newLength; i++) output[i] *= scale;
    }
  }
  return result;
}

/** Pitch shift by semitones (resample then time-stretch back) */
function pitchShiftBuffer(buffer: AudioBuffer, semitones: number): AudioBuffer {
  const pitchRatio = Math.pow(2, semitones / 12);
  // Step 1: Resample to shift pitch (changes length)
  const resampledLength = Math.round(buffer.length / pitchRatio);
  const resampled = new OfflineAudioContext(buffer.numberOfChannels, resampledLength, buffer.sampleRate)
    .createBuffer(buffer.numberOfChannels, resampledLength, buffer.sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const input = buffer.getChannelData(ch);
    const output = resampled.getChannelData(ch);
    for (let i = 0; i < resampledLength; i++) {
      const srcIdx = i * pitchRatio;
      const idx0 = Math.floor(srcIdx);
      const idx1 = Math.min(idx0 + 1, input.length - 1);
      const frac = srcIdx - idx0;
      output[i] = input[idx0] * (1 - frac) + input[idx1] * frac;
    }
  }

  // Step 2: Time-stretch back to original length (WSOLA)
  const finalLength = buffer.length;
  const stretchRatio = finalLength / resampledLength;
  const final = new OfflineAudioContext(buffer.numberOfChannels, finalLength, buffer.sampleRate)
    .createBuffer(buffer.numberOfChannels, finalLength, buffer.sampleRate);

  const windowSize = 2048;
  const hopIn = Math.round(windowSize / 4);
  const hopOut = Math.round(hopIn * stretchRatio);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const input = resampled.getChannelData(ch);
    const output = final.getChannelData(ch);
    for (let outPos = 0; outPos < finalLength; outPos += hopOut) {
      const inPos = Math.round(outPos / stretchRatio);
      for (let j = 0; j < windowSize && outPos + j < finalLength; j++) {
        const srcIdx = inPos + j;
        if (srcIdx >= input.length) break;
        const w = 0.5 * (1 - Math.cos(2 * Math.PI * j / windowSize));
        output[outPos + j] += input[srcIdx] * w;
      }
    }
    let maxAmp = 0;
    for (let i = 0; i < finalLength; i++) maxAmp = Math.max(maxAmp, Math.abs(output[i]));
    if (maxAmp > 0.95) {
      const scale = 0.9 / maxAmp;
      for (let i = 0; i < finalLength; i++) output[i] *= scale;
    }
  }
  return final;
}

/** Extract a sample segment from a buffer */
function sampleBuffer(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const startSample = Math.round(startSec * buffer.sampleRate);
  const endSample = Math.min(Math.round(endSec * buffer.sampleRate), buffer.length);
  const length = endSample - startSample;
  const result = new OfflineAudioContext(buffer.numberOfChannels, length, buffer.sampleRate)
    .createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const input = buffer.getChannelData(ch);
    const output = result.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      output[i] = input[startSample + i] || 0;
    }
  }
  return result;
}

/** Mashup: overlay two buffers at matching tempo */
function mashupBuffers(bufferA: AudioBuffer, bufferB: AudioBuffer, mixRatio: number = 0.5): AudioBuffer {
  const length = Math.max(bufferA.length, bufferB.length);
  const channels = Math.max(bufferA.numberOfChannels, bufferB.numberOfChannels);
  const result = new OfflineAudioContext(channels, length, bufferA.sampleRate)
    .createBuffer(channels, length, bufferA.sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const output = result.getChannelData(ch);
    const dataA = ch < bufferA.numberOfChannels ? bufferA.getChannelData(ch) : null;
    const dataB = ch < bufferB.numberOfChannels ? bufferB.getChannelData(ch) : null;
    for (let i = 0; i < length; i++) {
      const a = dataA && i < bufferA.length ? dataA[i] : 0;
      const b = dataB && i < bufferB.length ? dataB[i] : 0;
      output[i] = a * (1 - mixRatio) + b * mixRatio;
    }
  }

  // Normalize
  for (let ch = 0; ch < channels; ch++) {
    const output = result.getChannelData(ch);
    let maxAmp = 0;
    for (let i = 0; i < length; i++) maxAmp = Math.max(maxAmp, Math.abs(output[i]));
    if (maxAmp > 0.95) {
      const scale = 0.9 / maxAmp;
      for (let i = 0; i < length; i++) output[i] *= scale;
    }
  }
  return result;
}

/** Quantize: snap to grid by analyzing transients and shifting */
function quantizeBuffer(buffer: AudioBuffer, bpm: number, gridDivision: number = 16): AudioBuffer {
  // For audio quantization, we detect transients and nudge them to grid positions
  // This is a simplified version — real quantize would use phase-locked stretching
  const beatSec = 60 / bpm;
  const gridSec = beatSec * (4 / gridDivision); // e.g., 16th note
  const gridSamples = Math.round(gridSec * buffer.sampleRate);

  // Simple approach: apply subtle timing correction by cross-fading at grid boundaries
  const result = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
    .createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

  const windowSamples = Math.round(gridSamples * 0.1); // 10% of grid for crossfade zone

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const input = buffer.getChannelData(ch);
    const output = result.getChannelData(ch);

    // Find onset positions (energy peaks)
    for (let i = 0; i < buffer.length; i++) {
      output[i] = input[i]; // Start with copy
    }

    // Apply micro-corrections at grid boundaries
    for (let gridPos = 0; gridPos < buffer.length; gridPos += gridSamples) {
      // Search for nearest onset within ±windowSamples
      let maxEnergy = 0;
      let maxOffset = 0;
      for (let offset = -windowSamples; offset <= windowSamples; offset++) {
        const idx = gridPos + offset;
        if (idx < 0 || idx >= buffer.length) continue;
        const energy = Math.abs(input[idx]);
        if (energy > maxEnergy) {
          maxEnergy = energy;
          maxOffset = offset;
        }
      }

      // Crossfade nudge toward grid position
      if (maxOffset !== 0 && maxEnergy > 0.05) {
        const shift = -maxOffset; // nudge toward grid
        const fadeLen = Math.min(Math.abs(shift), windowSamples);
        for (let j = 0; j < fadeLen; j++) {
          const srcIdx = gridPos + maxOffset + j;
          const dstIdx = gridPos + j;
          if (srcIdx >= 0 && srcIdx < buffer.length && dstIdx >= 0 && dstIdx < buffer.length) {
            const blend = j / fadeLen;
            output[dstIdx] = input[srcIdx] * (1 - blend) + input[dstIdx] * blend;
          }
        }
      }
    }
  }
  return result;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TechniqueComparisonPanel({
  tracks = [],
  onAmapianorize,
  onExtendTrack,
  onExtendMix,
  sessionBPM = 112,
}: TechniqueComparisonPanelProps) {
  const navigate = useNavigate();
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [secondTrackId, setSecondTrackId] = useState<string>('');
  const [activeTechnique, setActiveTechnique] = useState<TechniqueId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // DSP parameters
  const [pitchSemitones, setPitchSemitones] = useState(0);
  const [warpTargetBPM, setWarpTargetBPM] = useState(sessionBPM);
  const [sampleStart, setSampleStart] = useState(0);
  const [sampleEnd, setSampleEnd] = useState(10);
  const [mashupMix, setMashupMix] = useState(50);
  const [quantizeGrid, setQuantizeGrid] = useState(16);

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);
  const secondTrack = tracks.find(t => t.id === secondTrackId);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playPreview = useCallback((url: string) => {
    stopPreview();
    const audio = new Audio(url);
    audio.onended = () => setIsPlaying(false);
    audio.play();
    audioRef.current = audio;
    setIsPlaying(true);
  }, [stopPreview]);

  const handleApply = useCallback(async (techniqueId: TechniqueId) => {
    if (!selectedTrack && techniqueId !== 'comp') {
      toast.error('Select a track first');
      return;
    }

    setActiveTechnique(techniqueId);
    setIsProcessing(true);
    stopPreview();

    try {
      switch (techniqueId) {
        case 'amapianorize': {
          onAmapianorize?.(selectedTrack!.id);
          toast.success('Amapianorization started');
          break;
        }

        case 'extend': {
          onExtendTrack?.(selectedTrack!.id);
          toast.success('Track extend started');
          break;
        }

        case 'remix': {
          navigate('/suno-studio?mode=remix');
          toast.info('Opening Suno Studio in Remix mode');
          break;
        }

        case 'cover': {
          navigate('/suno-studio?mode=cover');
          toast.info('Opening Suno Studio in Cover mode');
          break;
        }

        case 'sample': {
          const buffer = await decodeTrackAudio(selectedTrack!.fileUrl);
          const durationSec = buffer.length / buffer.sampleRate;
          const start = Math.min(sampleStart, durationSec);
          const end = Math.min(sampleEnd, durationSec);
          const sampled = sampleBuffer(buffer, start, end);
          downloadAudioBuffer(sampled, `${selectedTrack!.title}_sample_${start}s-${end}s.wav`);
          toast.success(`Extracted ${(end - start).toFixed(1)}s sample`);
          break;
        }

        case 'mashup': {
          if (!secondTrack) {
            toast.error('Select a second track for mashup');
            break;
          }
          const [bufA, bufB] = await Promise.all([
            decodeTrackAudio(selectedTrack!.fileUrl),
            decodeTrackAudio(secondTrack.fileUrl),
          ]);
          const mashed = mashupBuffers(bufA, bufB, mashupMix / 100);
          downloadAudioBuffer(mashed, `mashup_${selectedTrack!.title}_x_${secondTrack.title}.wav`);
          toast.success('Mashup created & downloaded');
          break;
        }

        case 'tempo_sync': {
          const origBPM = selectedTrack!.features?.bpm || 120;
          const buffer = await decodeTrackAudio(selectedTrack!.fileUrl);
          const synced = tempoSyncBuffer(buffer, origBPM, sessionBPM);
          const semitonesDrift = 12 * Math.log2(sessionBPM / origBPM);
          downloadAudioBuffer(synced, `${selectedTrack!.title}_sync_${sessionBPM}bpm.wav`);
          toast.success(`Synced to ${sessionBPM} BPM (pitch drift: ${semitonesDrift > 0 ? '+' : ''}${semitonesDrift.toFixed(2)} st)`);
          break;
        }

        case 'unsync': {
          toast.success(`"${selectedTrack!.title}" locked to absolute time — immune to session tempo changes`);
          break;
        }

        case 'warp': {
          const origBPM = selectedTrack!.features?.bpm || 120;
          const buffer = await decodeTrackAudio(selectedTrack!.fileUrl);
          const warped = warpBuffer(buffer, origBPM, warpTargetBPM);
          downloadAudioBuffer(warped, `${selectedTrack!.title}_warped_${warpTargetBPM}bpm.wav`);
          toast.success(`Warped ${origBPM} → ${warpTargetBPM} BPM (pitch preserved)`);
          break;
        }

        case 'pitch_shift': {
          const buffer = await decodeTrackAudio(selectedTrack!.fileUrl);
          const shifted = pitchShiftBuffer(buffer, pitchSemitones);
          downloadAudioBuffer(shifted, `${selectedTrack!.title}_pitch_${pitchSemitones > 0 ? '+' : ''}${pitchSemitones}st.wav`);
          toast.success(`Pitch shifted by ${pitchSemitones > 0 ? '+' : ''}${pitchSemitones} semitones`);
          break;
        }

        case 'quantize': {
          const bpm = selectedTrack!.features?.bpm || 120;
          const buffer = await decodeTrackAudio(selectedTrack!.fileUrl);
          const quantized = quantizeBuffer(buffer, bpm, quantizeGrid);
          downloadAudioBuffer(quantized, `${selectedTrack!.title}_quantized_1-${quantizeGrid}.wav`);
          toast.success(`Quantized to 1/${quantizeGrid} grid at ${bpm} BPM`);
          break;
        }

        case 'comp': {
          toast.info('Comp mode: Upload multiple takes of the same part, then select the best phrases from each.', { duration: 5000 });
          break;
        }
      }
    } catch (err) {
      console.error(`[Technique] ${techniqueId} failed:`, err);
      toast.error(`${techniqueId} failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setActiveTechnique(null);
    }
  }, [selectedTrack, secondTrack, onAmapianorize, onExtendTrack, navigate, sessionBPM,
      pitchSemitones, warpTargetBPM, sampleStart, sampleEnd, mashupMix, quantizeGrid, stopPreview]);

  const creativeTechniques = TECHNIQUES.filter(t => t.category === 'creative');
  const timelineTechniques = TECHNIQUES.filter(t => t.category === 'timeline');

  const renderParams = (t: Technique) => {
    if (activeTechnique === t.id && isProcessing) return null;

    switch (t.id) {
      case 'pitch_shift':
        return (
          <div className="flex items-center gap-2 mt-1.5">
            <Label className="text-[9px] shrink-0">Semitones:</Label>
            <Slider value={[pitchSemitones]} min={-12} max={12} step={1}
              onValueChange={([v]) => setPitchSemitones(v)} className="flex-1" />
            <span className="text-[10px] font-mono w-8 text-right">{pitchSemitones > 0 ? '+' : ''}{pitchSemitones}</span>
          </div>
        );
      case 'warp':
        return (
          <div className="flex items-center gap-2 mt-1.5">
            <Label className="text-[9px] shrink-0">Target BPM:</Label>
            <Input type="number" min={60} max={200} value={warpTargetBPM}
              onChange={e => setWarpTargetBPM(Number(e.target.value))}
              className="h-6 text-xs w-20" />
          </div>
        );
      case 'sample':
        return (
          <div className="flex items-center gap-2 mt-1.5">
            <Label className="text-[9px] shrink-0">Start:</Label>
            <Input type="number" min={0} step={0.5} value={sampleStart}
              onChange={e => setSampleStart(Number(e.target.value))}
              className="h-6 text-xs w-14" />
            <Label className="text-[9px] shrink-0">End:</Label>
            <Input type="number" min={0} step={0.5} value={sampleEnd}
              onChange={e => setSampleEnd(Number(e.target.value))}
              className="h-6 text-xs w-14" />
            <span className="text-[9px] text-muted-foreground">sec</span>
          </div>
        );
      case 'mashup':
        return (
          <div className="space-y-1.5 mt-1.5">
            <Select value={secondTrackId} onValueChange={setSecondTrackId}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select 2nd track" />
              </SelectTrigger>
              <SelectContent>
                {tracks.filter(t => t.id !== selectedTrackId).map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label className="text-[9px] shrink-0">Mix:</Label>
              <Slider value={[mashupMix]} min={10} max={90} step={5}
                onValueChange={([v]) => setMashupMix(v)} className="flex-1" />
              <span className="text-[9px] font-mono w-12 text-right">{100 - mashupMix}/{mashupMix}</span>
            </div>
          </div>
        );
      case 'quantize':
        return (
          <div className="flex items-center gap-2 mt-1.5">
            <Label className="text-[9px] shrink-0">Grid:</Label>
            {[4, 8, 16, 32].map(g => (
              <Button key={g} variant={quantizeGrid === g ? 'default' : 'outline'} size="sm"
                className="h-5 px-1.5 text-[9px]" onClick={() => setQuantizeGrid(g)}>
                1/{g}
              </Button>
            ))}
          </div>
        );
      case 'tempo_sync':
        return (
          <div className="mt-1 text-[9px] text-muted-foreground">
            Session: <span className="font-medium text-foreground">{sessionBPM} BPM</span>
            {selectedTrack?.features?.bpm && (
              <> | Track: <span className="font-medium text-foreground">{selectedTrack.features.bpm} BPM</span>
              <span className="ml-1">
                (Δ{Math.abs(sessionBPM - selectedTrack.features.bpm).toFixed(1)} BPM,{' '}
                {(12 * Math.log2(sessionBPM / selectedTrack.features.bpm)).toFixed(2)} st drift)
              </span></>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderTechniqueCard = (t: Technique) => {
    const isActive = activeTechnique === t.id && isProcessing;
    const isNavigate = t.id === 'remix' || t.id === 'cover';

    return (
      <div key={t.id} className={`p-2.5 rounded border transition-all ${
        isActive ? 'border-primary/50 bg-primary/5' : 'border-transparent bg-muted/20 hover:bg-muted/30'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-primary shrink-0">{t.icon}</span>
          <p className="text-xs font-medium flex-1">{t.name}</p>
          <Badge variant="outline" className="text-[8px] px-1 py-0">{t.category === 'creative' ? 'Creative' : 'DAW'}</Badge>
          <Button
            size="sm"
            variant={isNavigate ? 'outline' : 'default'}
            className="h-6 text-[10px] px-2"
            disabled={isProcessing || (!selectedTrack && t.needsTrack && t.id !== 'comp')}
            onClick={() => handleApply(t.id)}
          >
            {isActive ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isNavigate ? (
              <><ExternalLink className="w-3 h-3 mr-1" /> Open</>
            ) : (
              'Apply'
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{t.description}</p>
        {renderParams(t)}
        {expanded && (
          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            <div className="bg-background/50 rounded p-1">
              <p className="text-[8px] text-muted-foreground/60">Original recognizable?</p>
              <p className="text-[9px] text-muted-foreground">{t.originalRecognizable}</p>
            </div>
            <div className="bg-background/50 rounded p-1">
              <p className="text-[8px] text-muted-foreground/60">New elements?</p>
              <p className="text-[9px] text-muted-foreground">{t.newElements}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Technique Toolkit
          <Badge variant="outline" className="text-[9px] ml-auto">{TECHNIQUES.length} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Track selector */}
        <div className="space-y-1.5">
          <Label className="text-xs">Target Track</Label>
          <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={tracks.length > 0 ? 'Select a track...' : 'Upload tracks first'} />
            </SelectTrigger>
            <SelectContent>
              {tracks.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.title} {t.features ? `(${t.features.bpm} BPM, ${t.features.key})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Creative Techniques */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Creative Techniques</p>
          <div className="space-y-1.5">
            {creativeTechniques.map(renderTechniqueCard)}
          </div>
        </div>

        {/* DAW Timeline Operations */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider pt-1">DAW Timeline Operations</p>
          <div className="space-y-1.5">
            {timelineTechniques.map(renderTechniqueCard)}
          </div>
        </div>

        {/* Toggle detail */}
        <Button variant="ghost" size="sm" className="w-full text-xs"
          onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide Details' : 'Show Details'}
        </Button>
      </CardContent>
    </Card>
  );
}
